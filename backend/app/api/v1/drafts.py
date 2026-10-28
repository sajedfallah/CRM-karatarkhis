import hashlib
import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal
from uuid import UUID, uuid4
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Response, Query, UploadFile, File, Form
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select, update, func
from sqlalchemy.exc import IntegrityError
from app.api.deps import CurrentUser, DbSession
from app.api.v1.customers import _require_admin
from app.models.auth import PasswordCredential
from app.models.core import AuditLog, Customer, Organization, OrganizationMembership, User
from app.models.compliance import CorporateDocument, CorporateDocumentVersion
from app.models.drafts import CaseDraft, DraftCorporateDocumentLink
from app.models.draft_review import DraftCustomerReview
from app.services.product_review import product_fingerprint, product_review
from app.services.private_files import MAX_FILE_BYTES, PrivateFileStore
from app.services.import_requirements import IMPORT_DOCUMENT_LABELS
from app.api.v1.compliance import validate_file

router = APIRouter(prefix="/case-drafts", tags=["case drafts"])


class ProductDetails(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    brand: str = Field(default="", max_length=120)
    model: str = Field(default="", max_length=120)
    material: str = Field(default="", max_length=500)
    intended_use: str = Field(default="", max_length=1000)
    technical_attributes: str = Field(default="", max_length=4000)
    country_of_origin: str = Field(default="", max_length=100)
    hs_code: str = Field(default="", max_length=12, pattern=r"^(?:[0-9]{6,12})?$")


class ExportShipmentDetails(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    package_type: str = Field(default="", max_length=100)
    package_count: int | None = Field(default=None, ge=1, le=1_000_000_000)
    total_value: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    currency: str = Field(default="", max_length=3, pattern=r"^(?:[A-Z]{3})?$")
    driver_mobile: str = Field(default="", max_length=32)
    vehicle_identifier: str = Field(default="", max_length=128)


class DraftFinanceEstimate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    description: str = Field(default="", max_length=500)
    amount: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    currency: str = Field(default="", max_length=3, pattern=r"^(?:[A-Z]{3})?$")

    @model_validator(mode="after")
    def complete_or_empty(self):
        entered = bool(self.description) or self.amount is not None or bool(self.currency)
        if entered and not (self.description and self.amount is not None and self.currency):
            raise ValueError("finance_estimate_requires_description_amount_and_currency")
        return self


class DraftImportDocument(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    id: str = Field(pattern=r"^DID-[0-9a-f]{32}$")
    document_type: str | None = Field(default=None, min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=120)
    file_name: str = Field(min_length=1, max_length=180)
    object_key: str = Field(pattern=r"^case-draft-imports/[A-Za-z0-9_-]+/[0-9a-f]{32}$", max_length=255)
    mime_type: Literal["application/pdf", "image/png", "image/jpeg"]
    size_bytes: int = Field(gt=0, le=MAX_FILE_BYTES)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    uploaded_by: str = Field(min_length=1, max_length=64)
    uploaded_at: str = Field(min_length=1, max_length=40)

    @model_validator(mode="after")
    def known_type_and_label(self):
        if self.document_type is not None and (self.document_type not in IMPORT_DOCUMENT_LABELS or self.title != IMPORT_DOCUMENT_LABELS[self.document_type]):
            raise ValueError("unsupported_import_document_type")
        return self


class DraftContent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(default="", max_length=200)
    operation_type: Literal["import", "export", "transit"] | None = None
    customs: str = Field(default="", max_length=64)
    product_description: str = Field(default="", max_length=2000)
    product_details: ProductDetails = Field(default_factory=ProductDetails)
    export_shipment: ExportShipmentDetails = Field(default_factory=ExportShipmentDetails)
    finance_estimate: DraftFinanceEstimate = Field(default_factory=DraftFinanceEstimate)
    planned_assignee_user_id: str | None = Field(default=None, min_length=1, max_length=64)
    shipment_reference: str = Field(default="", max_length=128)
    quantity: int | None = Field(default=None, ge=1, le=1_000_000_000)
    net_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    gross_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    import_documents: list[DraftImportDocument] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def weights(self):
        if self.net_weight is not None and self.gross_weight is not None and self.gross_weight < self.net_weight:
            raise ValueError("gross_weight_must_not_be_less_than_net")
        return self


class DraftCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: UUID
    customer_id: str = Field(min_length=1, max_length=32)


class DraftSave(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_version: int = Field(ge=1)
    content: DraftContent


def read_draft(db, row):
    return {"id": row.id, "customer_id": row.customer_id, "customer_name": db.get(Customer, row.customer_id).name,
        "content": DraftContent.model_validate(row.content).model_dump(mode="json"), "version": row.version, "created_at": row.created_at, "updated_at": row.updated_at,
        "status": "DRAFT", "product_review": product_review(db,row)}


def require_customer(db, customer_id):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "customer_not_found")
    if not customer.is_active:
        raise HTTPException(409, "inactive_customer")


def _eligible_assignee_query(organization_id=None):
    query=select(User).where(User.is_active.is_(True))
    if organization_id:
        return query.join(OrganizationMembership,OrganizationMembership.user_id==User.id).join(
            Organization,Organization.id==OrganizationMembership.organization_id).where(
            Organization.id==organization_id,Organization.type=="INTERNAL",Organization.status=="active",
            Organization.customer_id.is_(None),OrganizationMembership.role=="internal_employee",
            OrganizationMembership.scope_type=="ORGANIZATION",OrganizationMembership.status=="ACTIVE",
            OrganizationMembership.deactivated_at.is_(None))
    # The no-organization branch is only reachable through the dev/test identity
    # fallback; production sessions always carry a selected active membership.
    return query.where(User.role=="internal_employee")


def _validate_planned_assignee(db, actor, assignee_user_id):
    if assignee_user_id is None:
        return
    organization_id=getattr(actor,"organization_id",None)
    valid=db.scalar(_eligible_assignee_query(organization_id).where(User.id==assignee_user_id))
    if not valid:
        raise HTTPException(422,"planned_assignee_not_active_internal_member")


def _review_recipient_query(customer_id):
    return select(OrganizationMembership,User).join(User,User.id==OrganizationMembership.user_id).join(
        Organization,Organization.id==OrganizationMembership.organization_id).join(
        PasswordCredential,PasswordCredential.user_id==User.id).where(
        Organization.type=="CUSTOMER",Organization.customer_id==customer_id,Organization.status=="active",
        OrganizationMembership.role=="customer_manager",OrganizationMembership.scope_type=="ORGANIZATION",
        OrganizationMembership.status=="ACTIVE",OrganizationMembership.deactivated_at.is_(None),
        User.role=="customer_manager",User.customer_id==customer_id,User.is_active.is_(True),
        PasswordCredential.email_verified_at.is_not(None),
        PasswordCredential.verified_email==func.lower(User.email))


def _customer_review_snapshot(db,row):
    content=DraftContent.model_validate(row.content).model_dump(mode="json")
    # These are strictly internal planning fields and must never enter the customer portal.
    content.pop("finance_estimate",None)
    content.pop("planned_assignee_user_id",None)
    if content.get("operation_type")=="import":
        content={key:content[key] for key in ("title","operation_type","customs","product_details","import_documents")}
        content["product_details"]={"hs_code":content["product_details"].get("hs_code","")}
        content["import_documents"]=[{key:value for key,value in item.items() if key not in {"uploaded_by","sha256","id","object_key"}}
            for item in content["import_documents"]]
    return {"draft_id":row.id,"draft_version":row.version,
        "customer_name":db.get(Customer,row.customer_id).name,"content":content}


def _customer_review_status(review,draft):
    if not draft or draft.version!=review.draft_version:return "STALE"
    return review.decision or "PENDING"


def _customer_review_read(db,review,draft=None):
    draft=draft or db.get(CaseDraft,review.draft_id)
    status=_customer_review_status(review,draft)
    return {"id":review.id,"draft_id":review.draft_id,"customer_id":review.customer_id,
        "draft_version":review.draft_version,"snapshot":review.snapshot,
        "confirmation_text_version":review.confirmation_text_version,"requested_at":review.requested_at,
        "status":status,"decision_comment":review.decision_comment if status=="CHANGES_REQUESTED" else None,
        "decided_at":review.decided_at if review.decision else None}


def _require_active_review_recipient(db,review,user):
    membership_id=getattr(user,"membership_id",None)
    if user.role!="customer_manager" or not membership_id or getattr(user,"customer_id",None)!=review.customer_id:
        raise HTTPException(404,"draft_customer_review_not_found")
    row=db.execute(_review_recipient_query(review.customer_id).where(
        OrganizationMembership.id==membership_id,OrganizationMembership.user_id==user.id)).first()
    if not row or membership_id!=review.recipient_membership_id:
        raise HTTPException(404,"draft_customer_review_not_found")


@router.get("")
def list_drafts(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    response.headers["Cache-Control"] = "private, no-store"
    return [read_draft(db, row) for row in db.scalars(select(CaseDraft).order_by(CaseDraft.updated_at.desc()))]


@router.get("/eligible-assignees")
def list_eligible_assignees(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    response.headers["Cache-Control"]="private, no-store"
    organization_id=getattr(user,"organization_id",None)
    return [{"id":row.id,"full_name":row.full_name} for row in db.scalars(
        _eligible_assignee_query(organization_id).order_by(User.full_name,User.id))]


@router.get("/customer-reviews")
def customer_review_inbox(db: DbSession,user: CurrentUser,response: Response):
    if user.role!="customer_manager" or not getattr(user,"membership_id",None):
        raise HTTPException(403,"customer_review_membership_required")
    response.headers["Cache-Control"]="private, no-store"
    result=[]
    for review in db.scalars(select(DraftCustomerReview).where(
            DraftCustomerReview.recipient_membership_id==user.membership_id,
            DraftCustomerReview.customer_id==user.customer_id).order_by(DraftCustomerReview.requested_at.desc())):
        try:
            _require_active_review_recipient(db,review,user)
        except HTTPException:
            continue
        result.append(_customer_review_read(db,review))
    return result


@router.get("/customer-reviews/{review_id}")
def customer_review_detail(review_id: str,db: DbSession,user: CurrentUser,response: Response):
    review=db.get(DraftCustomerReview,review_id)
    if not review:raise HTTPException(404,"draft_customer_review_not_found")
    _require_active_review_recipient(db,review,user)
    response.headers["Cache-Control"]="private, no-store"
    return _customer_review_read(db,review)


class CustomerReviewDecision(BaseModel):
    model_config=ConfigDict(extra="forbid",str_strip_whitespace=True)
    decision: Literal["CONFIRMED","CHANGES_REQUESTED"]
    comment: str=Field(default="",max_length=2000)

    @model_validator(mode="after")
    def correction_comment_required(self):
        if self.decision=="CHANGES_REQUESTED" and len(self.comment)<3:
            raise ValueError("correction_comment_required")
        return self


@router.post("/customer-reviews/{review_id}/decision")
def decide_customer_review(review_id: str,payload: CustomerReviewDecision,db: DbSession,user: CurrentUser,response: Response):
    review=db.scalar(select(DraftCustomerReview).where(DraftCustomerReview.id==review_id).with_for_update())
    if not review:raise HTTPException(404,"draft_customer_review_not_found")
    _require_active_review_recipient(db,review,user)
    draft=db.get(CaseDraft,review.draft_id)
    if _customer_review_status(review,draft)=="STALE":raise HTTPException(409,"draft_customer_review_stale")
    if review.decision:
        if review.decision==payload.decision and review.decision_comment==(payload.comment or None):
            response.headers["Cache-Control"]="private, no-store"
            return _customer_review_read(db,review,draft)
        raise HTTPException(409,"draft_customer_review_already_decided")
    review.decision=payload.decision
    review.decision_comment=payload.comment or None
    review.decided_by=user.id
    review.decided_at=func.now()
    db.add(AuditLog(actor_user_id=user.id,entity_type="case_draft_customer_review",entity_id=review.id,
        action=payload.decision.lower(),new_value=f"draft_id={review.draft_id};draft_version={review.draft_version}",source="api"))
    db.commit()
    db.refresh(review)
    response.headers["Cache-Control"]="private, no-store"
    return _customer_review_read(db,review,draft)


@router.get("/{draft_id}/review-recipients")
def draft_review_recipients(draft_id: str,db: DbSession,user: CurrentUser,response: Response):
    _require_admin(user)
    draft=db.get(CaseDraft,draft_id)
    if not draft:raise HTTPException(404,"draft_not_found")
    require_customer(db,draft.customer_id)
    response.headers["Cache-Control"]="private, no-store"
    return [{"membership_id":membership.id,"full_name":member.full_name,"email":member.email}
        for membership,member in db.execute(_review_recipient_query(draft.customer_id).order_by(User.full_name,OrganizationMembership.id))]


@router.get("/{draft_id}/customer-review")
def draft_customer_review(draft_id: str,db: DbSession,user: CurrentUser,response: Response):
    _require_admin(user)
    draft=db.get(CaseDraft,draft_id)
    if not draft:raise HTTPException(404,"draft_not_found")
    review=db.scalar(select(DraftCustomerReview).where(DraftCustomerReview.draft_id==draft.id,
        DraftCustomerReview.draft_version==draft.version))
    response.headers["Cache-Control"]="private, no-store"
    return _customer_review_read(db,review,draft) if review else None


class DraftCustomerReviewRequest(BaseModel):
    model_config=ConfigDict(extra="forbid")
    expected_version: int=Field(ge=1)
    recipient_membership_id: str=Field(min_length=1,max_length=64)


@router.post("/{draft_id}/customer-review",status_code=201)
def request_draft_customer_review(draft_id: str,payload: DraftCustomerReviewRequest,db: DbSession,user: CurrentUser,response: Response):
    _require_admin(user)
    draft=db.scalar(select(CaseDraft).where(CaseDraft.id==draft_id).with_for_update())
    if not draft:raise HTTPException(404,"draft_not_found")
    require_customer(db,draft.customer_id)
    if draft.version!=payload.expected_version:raise HTTPException(409,"draft_changed_reload_required")
    recipient=db.execute(_review_recipient_query(draft.customer_id).where(
        OrganizationMembership.id==payload.recipient_membership_id)).first()
    if not recipient:raise HTTPException(422,"customer_review_recipient_not_active_verified_manager")
    existing=db.scalar(select(DraftCustomerReview).where(DraftCustomerReview.draft_id==draft.id,
        DraftCustomerReview.draft_version==draft.version))
    if existing:
        if existing.recipient_membership_id==payload.recipient_membership_id:
            response.headers["Cache-Control"]="private, no-store"
            return _customer_review_read(db,existing,draft)
        raise HTTPException(409,"customer_review_already_requested_for_version")
    snapshot=_customer_review_snapshot(db,draft)
    content_hash=hashlib.sha256(json.dumps(snapshot,sort_keys=True,ensure_ascii=False,
        separators=(",",":")).encode("utf-8")).hexdigest()
    review=DraftCustomerReview(id="DCR-"+uuid4().hex,draft_id=draft.id,customer_id=draft.customer_id,
        recipient_membership_id=payload.recipient_membership_id,draft_version=draft.version,
        content_hash=content_hash,snapshot=snapshot,requested_by=user.id)
    db.add(review)
    db.add(AuditLog(actor_user_id=user.id,entity_type="case_draft_customer_review",entity_id=review.id,
        action="request_review",new_value=f"draft_id={draft.id};draft_version={draft.version}",source="api"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing=db.scalar(select(DraftCustomerReview).where(DraftCustomerReview.draft_id==draft.id,
            DraftCustomerReview.draft_version==draft.version))
        if existing and existing.recipient_membership_id==payload.recipient_membership_id:
            response.headers["Cache-Control"]="private, no-store"
            return _customer_review_read(db,existing,draft)
        raise HTTPException(409,"customer_review_already_requested_for_version") from None
    db.refresh(review)
    response.headers["Cache-Control"]="private, no-store"
    return _customer_review_read(db,review,draft)


@router.post("", status_code=201)
def create_draft(payload: DraftCreate, db: DbSession, user: CurrentUser):
    _require_admin(user)
    require_customer(db, payload.customer_id)
    draft_id = "DRAFT-"+payload.request_id.hex
    existing = db.get(CaseDraft, draft_id)
    if existing:
        if existing.customer_id != payload.customer_id:
            raise HTTPException(409, "request_id_conflict")
        return read_draft(db, existing)
    row = CaseDraft(id=draft_id, customer_id=payload.customer_id, created_by=user.id,
        content=DraftContent().model_dump(mode="json"), version=1)
    db.add(row)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_draft", entity_id=draft_id, action="create", source="api"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.get(CaseDraft, draft_id)
        if existing and existing.customer_id == payload.customer_id:
            return read_draft(db, existing)
        raise HTTPException(409, "request_id_conflict") from None
    return read_draft(db, row)


@router.get("/{draft_id}")
def get_draft(draft_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.get(CaseDraft, draft_id)
    if not row:
        raise HTTPException(404, "draft_not_found")
    response.headers["Cache-Control"] = "private, no-store"
    return read_draft(db, row)


@router.put("/{draft_id}")
def save_draft(draft_id: str, payload: DraftSave, db: DbSession, user: CurrentUser):
    _require_admin(user)
    row = db.get(CaseDraft, draft_id)
    if not row:
        raise HTTPException(404, "draft_not_found")
    require_customer(db, row.customer_id)
    actor = user.id
    content = payload.content.model_dump(mode="json")
    stored_import_documents = row.content.get("import_documents", [])
    if content.get("import_documents", []) != stored_import_documents:
        raise HTTPException(409, "import_documents_are_managed_by_upload_api")
    content["import_documents"] = stored_import_documents
    if content.get("operation_type")!="import":
        _validate_planned_assignee(db,user,content.get("planned_assignee_user_id"))
    result = db.execute(update(CaseDraft).where(CaseDraft.id == draft_id, CaseDraft.version == payload.expected_version)
        .values(content=content, version=payload.expected_version+1, updated_at=func.now(),
            product_revision=CaseDraft.product_revision+(1 if product_fingerprint(row.content)!=product_fingerprint(content) else 0))
        .execution_options(synchronize_session=False))
    if result.rowcount != 1:
        db.rollback()
        current = db.get(CaseDraft, draft_id)
        if current and current.version == payload.expected_version+1 and current.content == content:
            return read_draft(db, current)
        raise HTTPException(409, "draft_changed_reload_required")
    db.add(AuditLog(actor_user_id=actor, entity_type="case_draft", entity_id=draft_id, action="save",
        new_value=f"version={payload.expected_version+1}", source="api"))
    db.commit()
    db.expire_all()
    return read_draft(db, db.get(CaseDraft, draft_id))


@router.post("/{draft_id}/import-documents", status_code=201)
def upload_import_document(draft_id: str, db: DbSession, user: CurrentUser,
        file: UploadFile = File(...), upload_id: UUID = Form(...),
        document_type: str = Form(..., min_length=1, max_length=40), expected_version: int = Form(..., ge=1)):
    _require_admin(user)
    row=db.scalar(select(CaseDraft).where(CaseDraft.id==draft_id).with_for_update())
    if not row: raise HTTPException(404,"draft_not_found")
    require_customer(db,row.customer_id)
    if (row.content.get("operation_type") or "").lower()!="import":
        raise HTTPException(409,"import_documents_only_for_import_drafts")
    if document_type not in IMPORT_DOCUMENT_LABELS: raise HTTPException(422,"unsupported_import_document_type")
    data=file.file.read(MAX_FILE_BYTES+1)
    if not data or len(data)>MAX_FILE_BYTES: raise HTTPException(413,"file_too_large_or_empty")
    filename,mime=validate_file(file,data)
    digest=hashlib.sha256(data).hexdigest()
    document_id="DID-"+upload_id.hex
    old_docs=row.content.get("import_documents",[])
    existing=next((item for item in old_docs if item.get("id")==document_id),None)
    if existing:
        if existing.get("sha256")!=digest or existing.get("document_type")!=document_type or existing.get("uploaded_by")!=user.id:
            raise HTTPException(409,"upload_id_conflict")
        return {"draft_id":row.id,"draft_version":row.version,"documents":old_docs}
    if len(old_docs)>=100: raise HTTPException(409,"import_document_limit_reached")
    if row.version!=expected_version: raise HTTPException(409,"draft_changed_reload_required")
    actor_id=user.id
    db.rollback()
    storage_path=f"case-draft-imports/{draft_id}/{uuid4().hex}"
    try:
        store=PrivateFileStore()
        store.put(storage_path,data,mime)
    except Exception:
        raise HTTPException(503,"private_storage_unavailable") from None
    try:
        row=db.scalar(select(CaseDraft).where(CaseDraft.id==draft_id).with_for_update())
        if not row or row.version!=expected_version or (row.content.get("operation_type") or "").lower()!="import":
            raise HTTPException(409,"draft_changed_reload_required")
        docs=list(row.content.get("import_documents",[]))
        duplicate=next((item for item in docs if item.get("id")==document_id),None)
        if duplicate:
            if duplicate.get("sha256")==digest and duplicate.get("document_type")==document_type and duplicate.get("uploaded_by")==actor_id:
                store.remove_uncommitted(storage_path)
                return {"draft_id":row.id,"draft_version":row.version,"documents":docs}
            raise HTTPException(409,"upload_id_conflict")
        if len(docs)>=100: raise HTTPException(409,"import_document_limit_reached")
        metadata={"id":document_id,"document_type":document_type,"title":IMPORT_DOCUMENT_LABELS[document_type],
            "file_name":filename,"object_key":storage_path,"mime_type":mime,
            "size_bytes":len(data),"sha256":digest,"uploaded_by":actor_id,
            "uploaded_at":datetime.now(timezone.utc).isoformat()}
        content=dict(row.content)
        content["import_documents"]=[*docs,metadata]
        next_version=expected_version+1
        result=db.execute(update(CaseDraft).where(CaseDraft.id==draft_id,CaseDraft.version==expected_version)
            .values(content=content,version=next_version,updated_at=func.now())
            .execution_options(synchronize_session=False))
        if result.rowcount!=1: raise HTTPException(409,"draft_changed_reload_required")
        db.add(AuditLog(actor_user_id=actor_id,entity_type="case_draft_import_document",entity_id=document_id,
            action="upload",new_value=f"draft_id={draft_id};draft_version={next_version};sha256={digest}",source="api"))
        db.commit()
        return {"draft_id":draft_id,"draft_version":next_version,"documents":content["import_documents"]}
    except Exception as error:
        db.rollback()
        try: store.remove_uncommitted(storage_path)
        except Exception: pass
        if isinstance(error,HTTPException): raise
        raise HTTPException(503,"import_document_save_failed") from None


@router.get("/{draft_id}/import-documents/{document_id}/file")
def download_import_document(draft_id: str,document_id: str,db: DbSession,user: CurrentUser):
    _require_admin(user)
    row=db.get(CaseDraft,draft_id)
    if not row: raise HTTPException(404,"draft_not_found")
    metadata=next((item for item in row.content.get("import_documents",[]) if item.get("id")==document_id),None)
    if not metadata: raise HTTPException(404,"import_document_not_found")
    if not document_id.startswith("DID-") or len(document_id)!=36:
        raise HTTPException(404,"import_document_not_found")
    key=metadata.get("object_key","")
    if not key.startswith(f"case-draft-imports/{draft_id}/"):
        raise HTTPException(404,"import_document_not_found")
    db.add(AuditLog(actor_user_id=user.id,entity_type="case_draft_import_document",entity_id=document_id,
        action="download",new_value=f"draft_id={draft_id}",source="api"))
    db.commit()
    try:
        data=PrivateFileStore().get(key)
        if len(data)!=metadata["size_bytes"] or hashlib.sha256(data).hexdigest()!=metadata["sha256"]:
            raise ValueError("integrity_error")
    except Exception:
        raise HTTPException(503,"private_storage_unavailable") from None
    return Response(data,media_type=metadata["mime_type"],headers={"Cache-Control":"private, no-store",
        "Content-Disposition":"attachment; filename*=UTF-8''"+quote(metadata["file_name"]),
        "X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox; default-src 'none'",
        "Referrer-Policy":"no-referrer"})


@router.get("/{draft_id}/readiness")
def readiness(draft_id: str, db: DbSession, user: CurrentUser, response: Response,
              expected_version: int = Query(ge=1)):
    _require_admin(user)
    row=db.get(CaseDraft,draft_id)
    if not row: raise HTTPException(404,"draft_not_found")
    if row.version!=expected_version: raise HTTPException(409,"draft_changed_reload_required")
    from app.services.registration_readiness import registration_readiness
    response.headers["Cache-Control"]="private, no-store"
    return registration_readiness(db,row)


def _document_record(db, draft_id: str, link: DraftCorporateDocumentLink):
    version=db.get(CorporateDocumentVersion,link.document_version_id)
    document=db.get(CorporateDocument,version.document_id)
    from app.services.document_expiry import validity
    return {"link_id":link.id,"document_id":document.id,"document_version_id":version.id,
        "title":document.title,"document_type":document.document_type,"version":version.version,
        "file_name":version.file_name,"starts_on":version.starts_on,"expires_on":version.expires_on,
        "status":validity(version),"added_at":link.added_at}


def _draft_document_state(db, row):
    links=list(db.scalars(select(DraftCorporateDocumentLink).where(
        DraftCorporateDocumentLink.draft_id==row.id,
        DraftCorporateDocumentLink.removed_at.is_(None)).order_by(DraftCorporateDocumentLink.added_at)))
    linked=[_document_record(db,row.id,link) for link in links]
    linked_ids={item["document_version_id"] for item in linked}
    available=[]
    versions=db.execute(select(CorporateDocumentVersion,CorporateDocument).join(
        CorporateDocument,CorporateDocumentVersion.document_id==CorporateDocument.id).where(
        CorporateDocument.customer_id==row.customer_id).order_by(CorporateDocument.title,CorporateDocumentVersion.version.desc()))
    from app.services.document_expiry import validity
    for version,document in versions:
        if version.id in linked_ids:
            continue
        available.append({"document_id":document.id,"document_version_id":version.id,"title":document.title,
            "document_type":document.document_type,"version":version.version,"file_name":version.file_name,
            "starts_on":version.starts_on,"expires_on":version.expires_on,"status":validity(version)})
    return {"draft_id":row.id,"draft_version":row.version,"linked":linked,"available":available}


@router.get("/{draft_id}/documents")
def draft_documents(draft_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row=db.get(CaseDraft,draft_id)
    if not row: raise HTTPException(404,"draft_not_found")
    response.headers["Cache-Control"]="private, no-store"
    return _draft_document_state(db,row)


class DraftDocumentLinkCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    expected_version: int=Field(ge=1)
    document_version_id: str=Field(min_length=1,max_length=64)


def _require_document_link_replay(db,row,expected_version,version_id,active):
    if row.version==expected_version+1 and active:
        return _draft_document_state(db,row)
    raise HTTPException(409,"draft_changed_reload_required")


@router.post("/{draft_id}/documents",status_code=201)
def link_draft_document(draft_id: str,payload: DraftDocumentLinkCommand,db: DbSession,user: CurrentUser):
    _require_admin(user)
    row=db.scalar(select(CaseDraft).where(CaseDraft.id==draft_id).with_for_update())
    if not row: raise HTTPException(404,"draft_not_found")
    require_customer(db,row.customer_id)
    existing=db.scalar(select(DraftCorporateDocumentLink).where(
        DraftCorporateDocumentLink.draft_id==row.id,
        DraftCorporateDocumentLink.document_version_id==payload.document_version_id))
    active=bool(existing and existing.removed_at is None)
    if row.version!=payload.expected_version:
        return _require_document_link_replay(db,row,payload.expected_version,payload.document_version_id,active)
    version=db.scalar(select(CorporateDocumentVersion).join(CorporateDocument).where(
        CorporateDocumentVersion.id==payload.document_version_id,
        CorporateDocument.customer_id==row.customer_id))
    if not version: raise HTTPException(404,"customer_document_version_not_found")
    if active:
        return _draft_document_state(db,row)
    if existing:
        existing.removed_at=None
        existing.removed_by=None
    else:
        existing=DraftCorporateDocumentLink(id="DCL-"+uuid4().hex,draft_id=row.id,
            document_version_id=version.id,added_by=user.id)
        db.add(existing)
    row.version+=1
    row.updated_at=func.now()
    db.add(AuditLog(actor_user_id=user.id,entity_type="draft_corporate_document_link",entity_id=existing.id,
        action="attach_exact_version",new_value=f"draft_id={row.id};document_version_id={version.id}",source="api"))
    db.commit()
    return _draft_document_state(db,db.get(CaseDraft,row.id))


class DraftDocumentDetachCommand(BaseModel):
    model_config=ConfigDict(extra="forbid")
    expected_version: int=Field(ge=1)


@router.post("/{draft_id}/documents/{link_id}/detach")
def detach_draft_document(draft_id: str,link_id: str,payload: DraftDocumentDetachCommand,
                          db: DbSession,user: CurrentUser):
    _require_admin(user)
    row=db.scalar(select(CaseDraft).where(CaseDraft.id==draft_id).with_for_update())
    if not row: raise HTTPException(404,"draft_not_found")
    require_customer(db,row.customer_id)
    link=db.scalar(select(DraftCorporateDocumentLink).where(
        DraftCorporateDocumentLink.id==link_id,DraftCorporateDocumentLink.draft_id==row.id))
    if not link: raise HTTPException(404,"draft_document_link_not_found")
    if row.version!=payload.expected_version:
        if row.version==payload.expected_version+1 and link.removed_at is not None:
            return _draft_document_state(db,row)
        raise HTTPException(409,"draft_changed_reload_required")
    if link.removed_at is not None:
        return _draft_document_state(db,row)
    link.removed_at=func.now()
    link.removed_by=user.id
    row.version+=1
    row.updated_at=func.now()
    db.add(AuditLog(actor_user_id=user.id,entity_type="draft_corporate_document_link",entity_id=link.id,
        action="detach_exact_version",new_value=f"draft_id={row.id};document_version_id={link.document_version_id}",source="api"))
    db.commit()
    return _draft_document_state(db,db.get(CaseDraft,row.id))


class ProductReviewCommand(BaseModel):
    model_config=ConfigDict(extra="forbid",str_strip_whitespace=True)
    expected_version: int=Field(ge=1)
    reason: str=Field(min_length=3,max_length=2000)


@router.post("/{draft_id}/product-review")
def review_product(draft_id: str,payload: ProductReviewCommand,db: DbSession,user: CurrentUser):
    _require_admin(user)
    row=db.scalar(select(CaseDraft).where(CaseDraft.id==draft_id).with_for_update())
    if not row: raise HTTPException(404,"draft_not_found")
    require_customer(db,row.customer_id)
    if row.version!=payload.expected_version: raise HTTPException(409,"draft_changed_reload_required")
    content=DraftContent.model_validate(row.content)
    if not content.product_description or not content.product_details.technical_attributes or not content.product_details.hs_code:
        raise HTTPException(422,"product_description_technical_attributes_and_hs_required")
    from app.models.product_review import DraftProductReview
    previous=db.scalar(select(DraftProductReview).where(DraftProductReview.draft_id==row.id,
        DraftProductReview.product_revision==row.product_revision))
    if previous:
        if previous.reason!=payload.reason: raise HTTPException(409,"product_already_reviewed")
        return read_draft(db,row)
    from uuid import uuid4
    review=DraftProductReview(id="PR-"+uuid4().hex,draft_id=row.id,product_revision=row.product_revision,
        draft_version=row.version,source_fingerprint=product_fingerprint(row.content),
        snapshot=content.model_dump(mode="json"),reviewed_by=user.id,reason=payload.reason)
    db.add(review)
    db.add(AuditLog(actor_user_id=user.id,entity_type="draft_product_review",entity_id=review.id,
        action="human_verify",new_value=f"draft_id={row.id};product_revision={row.product_revision}",source="api"))
    db.commit()
    return read_draft(db,row)

