from decimal import Decimal
from typing import Literal
from uuid import UUID, uuid4
from fastapi import APIRouter, HTTPException, Response, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select, update, func
from sqlalchemy.exc import IntegrityError
from app.api.deps import CurrentUser, DbSession
from app.api.v1.customers import _require_admin
from app.models.core import AuditLog, Customer
from app.models.compliance import CorporateDocument, CorporateDocumentVersion
from app.models.drafts import CaseDraft, DraftCorporateDocumentLink
from app.services.product_review import product_fingerprint, product_review

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


class DraftContent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(default="", max_length=200)
    operation_type: Literal["import", "export", "transit"] | None = None
    customs: str = Field(default="", max_length=64)
    product_description: str = Field(default="", max_length=2000)
    product_details: ProductDetails = Field(default_factory=ProductDetails)
    export_shipment: ExportShipmentDetails = Field(default_factory=ExportShipmentDetails)
    shipment_reference: str = Field(default="", max_length=128)
    quantity: int | None = Field(default=None, ge=1, le=1_000_000_000)
    net_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    gross_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)

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


@router.get("")
def list_drafts(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    response.headers["Cache-Control"] = "private, no-store"
    return [read_draft(db, row) for row in db.scalars(select(CaseDraft).order_by(CaseDraft.updated_at.desc()))]


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

