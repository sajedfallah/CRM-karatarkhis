"""Customer case-registration intake and the administrator's submission queue."""
import copy
import json
import hashlib
import os
from datetime import datetime, timezone
from uuid import UUID, uuid4
from urllib.parse import quote

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from decimal import Decimal
from types import SimpleNamespace
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.api.v1.compliance import validate_file
from app.api.v1.customers import _require_admin
from app.models.case_registration_request import CaseRegistrationRequest
from app.models.core import AuditLog, Case, Customer
from app.models.compliance import CorporateDocument, CorporateDocumentVersion
from app.services.import_requirements import IMPORT_DOCUMENT_LABELS
from app.services.private_files import MAX_FILE_BYTES, PrivateFileStore
from app.services.admin_document_ai import AIReviewProviderError, AIReviewUnavailable, analyze_documents, review_available, source_fingerprint

router = APIRouter(prefix="/case-registration-requests", tags=["case registration requests"])
IMPORT_TYPES = set(IMPORT_DOCUMENT_LABELS)


def _customer_actor(user):
    if user.role not in {"customer_manager", "customer_employee"} or not getattr(user, "customer_id", None):
        raise HTTPException(403, "customer_membership_required")
    if not getattr(user, "membership_id", None) and os.getenv("APP_ENV", "production") not in {"development", "test"}:
        raise HTTPException(403, "customer_membership_required")
    return user.customer_id


def _customer_request(db, user, request_id, editable=False):
    row = db.scalar(select(CaseRegistrationRequest).where(CaseRegistrationRequest.id == request_id).with_for_update()) if editable else db.get(CaseRegistrationRequest, request_id)
    if not row:
        raise HTTPException(404, "request_not_found")
    if user.role != "admin":
        customer_id = _customer_actor(user)
        if row.customer_id != customer_id or (user.role == "customer_employee" and row.created_by != user.id):
            raise HTTPException(404, "request_not_found")
        if editable:
            if row.status != "DRAFT":
                raise HTTPException(409, "request_already_submitted")
            if row.created_by != user.id:
                raise HTTPException(403, "only_request_owner_can_edit")
    return row


def _read(row, customer, include_admin_details=False, actor_id=None):
    details = dict(row.details or {})
    correction_reason = details.pop("_correction_reason", None)
    details.pop("_admin_action_history", None)
    details.pop("_deleted_previous_status", None)
    details.pop("_review_after", None)
    packing = details.pop("_packing_list_snapshot", None)
    if not include_admin_details:
        details.pop("corporate_document_version_ids", None)
    return {"id": row.id, "correction_reason": correction_reason, "customer_id": row.customer_id, "customer_name": customer.name,
        "title": row.title, "operation_type": row.operation_type, "customs": row.customs,
        "hs_code": row.hs_code, "details": details,
        "packing_list_ready": bool(packing and packing.get("fingerprint") == _packing_fingerprint(row)),
        "packing_list_created_at": packing.get("created_at") if packing else None, "status": row.status, "submitted_at": row.submitted_at,
        "registered_case_id": row.registered_case_id, "can_edit": row.status == "DRAFT" and row.created_by == actor_id,
        "documents": [{key: doc[key] for key in ("id", "document_type", "title", "file_name", "mime_type", "size_bytes", "uploaded_at")}
            for doc in row.documents], "created_at": row.created_at, "updated_at": row.updated_at}


class ExportProduct(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(default="", max_length=200)
    hs_code: str = Field(default="", max_length=12, pattern=r"^(?:[0-9]{6,12})?$")
    quantity: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    unit: str = Field(default="", max_length=32)
    package_type: str = Field(default="", max_length=100)
    package_count: int | None = Field(default=None, ge=1, le=1_000_000_000)
    net_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    gross_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    value: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    currency: str = Field(default="", max_length=3, pattern=r"^(?:[A-Z]{3})?$")
    description: str = Field(default="", max_length=1000)

    @model_validator(mode="before")
    @classmethod
    def blank_numbers_are_empty(cls, value):
        if isinstance(value, dict):
            value = dict(value)
            for key in ("quantity", "package_count", "net_weight", "gross_weight", "value"):
                if value.get(key) == "":
                    value[key] = None
        return value

    @model_validator(mode="after")
    def consistent_values(self):
        if self.net_weight is not None and self.gross_weight is not None and self.gross_weight < self.net_weight:
            raise ValueError("gross_weight_must_not_be_less_than_net")
        if (self.value is None) != (not self.currency):
            raise ValueError("product_value_requires_currency")
        return self


class ExportDetails(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    border_code: str = Field(default="", max_length=64)
    buyer_name: str = Field(default="", max_length=200)
    destination_country: str = Field(default="", max_length=100)
    products: list[ExportProduct] = Field(default_factory=list, max_length=50)
    transport_type: str = Field(default="", max_length=80)
    vehicle_capacity: str = Field(default="", max_length=80)
    driver_name: str = Field(default="", max_length=160)
    driver_mobile: str = Field(default="", max_length=32)
    driver_national_code: str = Field(default="", max_length=16)
    vehicle_plate: str = Field(default="", max_length=80)


def _customer_details(payload):
    return payload.details.model_dump(mode="json")


class CreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    request_id: UUID
    title: str = Field(min_length=2, max_length=200)
    operation_type: str = Field(pattern=r"^(import|export)$")
    customs: str = Field(min_length=1, max_length=64)
    hs_code: str = Field(default="", max_length=12, pattern=r"^(?:[0-9]{6,12})?$")
    details: ExportDetails = Field(default_factory=ExportDetails)


class UpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=2, max_length=200)
    operation_type: str = Field(pattern=r"^(import|export)$")
    customs: str = Field(min_length=1, max_length=64)
    hs_code: str = Field(default="", max_length=12, pattern=r"^(?:[0-9]{6,12})?$")
    details: ExportDetails = Field(default_factory=ExportDetails)


@router.get("/mine")
def mine(db: DbSession, user: CurrentUser, response: Response):
    customer_id = _customer_actor(user)
    response.headers["Cache-Control"] = "private, no-store"
    query = select(CaseRegistrationRequest).where(CaseRegistrationRequest.customer_id == customer_id)
    if user.role == "customer_employee":
        query = query.where(CaseRegistrationRequest.created_by == user.id)
    rows = db.scalars(query.order_by(CaseRegistrationRequest.created_at.desc()))
    customer = db.get(Customer, customer_id)
    return [_read(row, customer, actor_id=user.id) for row in rows]


@router.get("")
def inbox(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    response.headers["Cache-Control"] = "private, no-store"
    rows = db.scalars(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.status.in_(("SUBMITTED", "REGISTERED", "ACTIVE"))).order_by(
            CaseRegistrationRequest.submitted_at.desc(), CaseRegistrationRequest.created_at.desc()))
    result = []
    for row in rows:
        customer = db.get(Customer, row.customer_id)
        if customer and customer.is_active:
            result.append(_read(row, customer, include_admin_details=True, actor_id=user.id))
    return result


@router.post("", status_code=201)
def create(payload: CreateRequest, db: DbSession, user: CurrentUser, response: Response):
    customer_id = _customer_actor(user)
    customer = db.get(Customer, customer_id)
    if not customer or not customer.is_active:
        raise HTTPException(409, "inactive_customer")
    request_id = "CRR-" + payload.request_id.hex
    row = db.get(CaseRegistrationRequest, request_id)
    if row:
        if row.created_by != user.id or row.customer_id != customer_id:
            raise HTTPException(409, "request_id_conflict")
        return _read(row, customer, actor_id=user.id)
    row = CaseRegistrationRequest(id=request_id, customer_id=customer_id, created_by=user.id,
        title=payload.title, operation_type=payload.operation_type, customs=payload.customs,
        hs_code=(payload.details.products[0].hs_code if payload.operation_type == "export" and payload.details.products else payload.hs_code),
        details=_customer_details(payload), documents=[])
    db.add(row)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=request_id,
        action="create", source="api"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        row = db.get(CaseRegistrationRequest, request_id)
        if not row or row.created_by != user.id or row.customer_id != customer_id:
            raise HTTPException(409, "request_id_conflict") from None
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, customer, actor_id=user.id)


@router.get("/{request_id}")
def detail(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id)
    if user.role == "admin" and row.status not in {"SUBMITTED", "REGISTERED"}:
        raise HTTPException(404, "request_not_found")
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id), include_admin_details=user.role == "admin", actor_id=user.id)


@router.put("/{request_id}")
def update(request_id: str, payload: UpdateRequest, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id, editable=True)
    if row.documents and row.operation_type != payload.operation_type:
        raise HTTPException(409, "operation_type_locked_after_document_upload")
    row.title, row.operation_type, row.customs = payload.title, payload.operation_type, payload.customs
    row.hs_code = (payload.details.products[0].hs_code if payload.operation_type == "export" and payload.details.products else payload.hs_code)
    previous_selection = (row.details or {}).get("corporate_document_version_ids", [])
    row.details = _customer_details(payload)
    row.details["corporate_document_version_ids"] = previous_selection
    row.updated_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=row.id,
        action="update", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id), actor_id=user.id)


@router.post("/{request_id}/documents", status_code=201)
def upload_document(request_id: str, db: DbSession, user: CurrentUser,
        file: UploadFile = File(...), upload_id: UUID = Form(...),
        document_type: str = Form(..., min_length=1, max_length=40), title: str = Form(..., min_length=2, max_length=120)):
    row = _customer_request(db, user, request_id, editable=True)
    if row.operation_type == "import":
        if document_type not in IMPORT_TYPES or title.strip() != IMPORT_DOCUMENT_LABELS[document_type]:
            raise HTTPException(422, "unsupported_import_document_type")
    elif document_type != "supporting_document":
        raise HTTPException(422, "unsupported_export_document_type")
    data = file.file.read(MAX_FILE_BYTES + 1)
    if not data or len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "file_too_large_or_empty")
    filename, mime = validate_file(file, data)
    digest = hashlib.sha256(data).hexdigest()
    document_id = "RRD-" + upload_id.hex
    existing = next((doc for doc in row.documents if doc["id"] == document_id), None)
    if existing:
        if existing["sha256"] != digest or existing["document_type"] != document_type or existing["uploaded_by"] != user.id:
            raise HTTPException(409, "upload_id_conflict")
        return _read(row, db.get(Customer, row.customer_id), actor_id=user.id)
    if len(row.documents) >= 100:
        raise HTTPException(409, "request_document_limit_reached")
    db.rollback()
    key = "case-registration-requests/" + row.id + "/" + uuid4().hex
    try:
        store = PrivateFileStore()
        store.put(key, data, mime)
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    try:
        row = db.scalar(select(CaseRegistrationRequest).where(
            CaseRegistrationRequest.id == request_id).with_for_update())
        if not row or row.status != "DRAFT" or row.created_by != user.id:
            raise HTTPException(409, "request_already_submitted")
        doc = {"id": document_id, "document_type": document_type, "title": title.strip(),
            "file_name": filename, "mime_type": mime, "size_bytes": len(data), "sha256": digest,
            "object_key": key, "uploaded_by": user.id, "malware_scan_status": "not_scanned",
            "uploaded_at": datetime.now(timezone.utc).isoformat()}
        row.documents = [*row.documents, doc]
        row.updated_at = datetime.now(timezone.utc)
        db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request_document", entity_id=document_id,
            action="upload", source="api"))
        db.commit()
    except Exception as error:
        db.rollback()
        try: store.remove_uncommitted(key)
        except Exception: pass
        if isinstance(error, HTTPException): raise
        raise HTTPException(503, "request_document_save_failed") from None
    return _read(row, db.get(Customer, row.customer_id), actor_id=user.id)


@router.get("/{request_id}/documents/{document_id}/file")
def download_document(request_id: str, document_id: str, db: DbSession, user: CurrentUser):
    row = _customer_request(db, user, request_id)
    if user.role == "admin" and row.status not in {"SUBMITTED", "REGISTERED"}:
        raise HTTPException(404, "request_not_found")
    doc = next((item for item in row.documents if item["id"] == document_id), None)
    if not doc:
        raise HTTPException(404, "document_not_found")
    key, name, mime, size, digest = doc["object_key"], doc["file_name"], doc["mime_type"], doc["size_bytes"], doc["sha256"]
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request_document", entity_id=document_id,
        action="download", source="api"))
    db.commit()
    try:
        data = PrivateFileStore().get(key)
        if len(data) != size or hashlib.sha256(data).hexdigest() != digest:
            raise ValueError("file_integrity_error")
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    return Response(data, media_type=mime, headers={"Cache-Control": "private, no-store",
        "Content-Disposition": "attachment; filename*=UTF-8''" + quote(name),
        "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'",
        "Referrer-Policy": "no-referrer"})




def _packing_source(row):
    details = copy.deepcopy(row.details or {})
    details.pop("_packing_list_snapshot", None)
    details.pop("corporate_document_version_ids", None)
    return {"title": row.title, "customs": row.customs, "details": details}


def _packing_fingerprint(row):
    return hashlib.sha256(json.dumps(_packing_source(row), ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def _validate_export_packing(row):
    details = row.details or {}
    products = details.get("products") or []
    if (not details.get("border_code", "").strip() or not details.get("buyer_name", "").strip()
            or not details.get("destination_country", "").strip() or not products
            or not details.get("transport_type", "").strip() or not details.get("vehicle_capacity", "").strip()
            or not details.get("driver_name", "").strip() or not details.get("driver_mobile", "").strip()
            or not details.get("driver_national_code", "").strip() or not details.get("vehicle_plate", "").strip()):
        raise HTTPException(422, "export_case_details_incomplete")
    for product in products:
        hs_code = product.get("hs_code", "")
        if (not product.get("name", "").strip() or not hs_code.isdigit() or not 6 <= len(hs_code) <= 12
                or product.get("quantity") is None or Decimal(str(product.get("quantity"))) <= 0
                or not product.get("unit", "").strip() or not product.get("package_type", "").strip()
                or product.get("package_count") is None
                or product.get("net_weight") is None or product.get("gross_weight") is None
                or product.get("value") is None or not product.get("currency", "")):
            raise HTTPException(422, "export_product_details_incomplete")



@router.post("/{request_id}/packing-list")
def generate_packing_list(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id, editable=True)
    if user.role == "admin" or row.operation_type != "export":
        raise HTTPException(403, "export_request_owner_required")
    _validate_export_packing(row)
    fingerprint = _packing_fingerprint(row)
    previous = (row.details or {}).get("_packing_list_snapshot")
    if not previous or previous.get("fingerprint") != fingerprint:
        snapshot = {"id": "PKL-" + uuid4().hex, "fingerprint": fingerprint,
            "created_at": datetime.now(timezone.utc).isoformat(), "source": _packing_source(row)}
        row.details = {**(row.details or {}), "_packing_list_snapshot": snapshot}
        db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request",
            entity_id=row.id, action="generate_initial_export_packing_list",
            new_value=json.dumps(snapshot, ensure_ascii=False), source="api"))
        db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id), actor_id=user.id)


@router.post("/{request_id}/submit")
def submit(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id, editable=True)
    if len(row.title.strip()) < 2 or not row.customs.strip():
        raise HTTPException(422, "request_fields_incomplete")
    if row.operation_type == "import":
        if not row.hs_code.isdigit() or not 6 <= len(row.hs_code) <= 12:
            raise HTTPException(422, "request_fields_incomplete")
        complete = {doc["document_type"] for doc in row.documents}
        if not IMPORT_TYPES.issubset(complete):
            raise HTTPException(422, "required_import_documents_missing")
    else:
        details = row.details or {}
        products = details.get("products") or []
        if (not details.get("border_code", "").strip() or not details.get("buyer_name", "").strip()
                or not details.get("destination_country", "").strip() or not products
                or not details.get("transport_type", "").strip() or not details.get("vehicle_capacity", "").strip()
                or not details.get("driver_name", "").strip() or not details.get("driver_mobile", "").strip()
                or not details.get("driver_national_code", "").strip() or not details.get("vehicle_plate", "").strip()):
            raise HTTPException(422, "export_case_details_incomplete")
        for product in products:
            hs_code = product.get("hs_code", "")
            if (not product.get("name", "").strip() or not hs_code.isdigit() or not 6 <= len(hs_code) <= 12
                    or product.get("quantity") is None or Decimal(str(product.get("quantity"))) <= 0
                    or not product.get("unit", "").strip() or not product.get("package_type", "").strip()
                    or product.get("package_count") is None
                    or product.get("net_weight") is None or product.get("gross_weight") is None
                    or product.get("value") is None or not product.get("currency", "")):
                raise HTTPException(422, "export_product_details_incomplete")
        packing = (row.details or {}).get("_packing_list_snapshot")
        if not packing or packing.get("fingerprint") != _packing_fingerprint(row):
            raise HTTPException(422, "export_packing_list_required_before_submission")
        if not row.documents:
            raise HTTPException(422, "export_documents_required")
    row.status = "SUBMITTED"
    row.submitted_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=row.id,
        action="submit", new_value="status=SUBMITTED", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id), actor_id=user.id)


class ExportDocumentSelection(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version_ids: list[str] = Field(default_factory=list, max_length=100)


@router.put("/{request_id}/export-document-selection")
def set_export_document_selection(request_id: str, payload: ExportDocumentSelection,
        db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.scalar(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.id == request_id).with_for_update())
    if not row or row.operation_type != "export" or row.status not in {"SUBMITTED", "REGISTERED"}:
        raise HTTPException(404, "export_request_not_found")
    ids = list(dict.fromkeys(payload.version_ids))
    versions = list(db.scalars(select(CorporateDocumentVersion).join(
        CorporateDocument, CorporateDocument.id == CorporateDocumentVersion.document_id).where(
        CorporateDocument.customer_id == row.customer_id,
        CorporateDocumentVersion.id.in_(ids)))) if ids else []
    if len(versions) != len(ids):
        raise HTTPException(422, "corporate_document_version_not_for_customer")
    previous = row.details or {}
    row.details = {**previous, "corporate_document_version_ids": ids}
    row.updated_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=row.id,
        action="select_export_package_documents", new_value=f"version_count={len(ids)}", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id), include_admin_details=True)


@router.get("/{request_id}/ai-review")
def get_ai_review(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.get(CaseRegistrationRequest, request_id)
    if not row or row.status not in {"SUBMITTED", "REGISTERED"}:
        raise HTTPException(404, "request_not_found")
    stored = row.ai_review
    current_fingerprint = source_fingerprint(row.documents or [])
    review_status = "NOT_RUN"
    if stored:
        review_status = "CURRENT" if stored.get("source_fingerprint") == current_fingerprint else "STALE"
    response.headers["Cache-Control"] = "private, no-store"
    available, block_reason = review_available(row.documents or [])
    return {"available": available, "block_reason": block_reason, "status": review_status,
        "model": stored.get("model") if stored else None,
        "reviewed_at": stored.get("reviewed_at") if stored else None,
        "result": stored.get("result") if stored and review_status == "CURRENT" else None}


@router.post("/{request_id}/ai-review")
async def run_ai_review(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.get(CaseRegistrationRequest, request_id)
    if not row or row.status not in {"SUBMITTED", "REGISTERED"}:
        raise HTTPException(404, "request_not_found")
    documents = [dict(item) for item in (row.documents or [])]
    snapshot_fingerprint = source_fingerprint(documents)
    available, block_reason = review_available(documents)
    if not available:
        raise HTTPException(503, block_reason)
    if row.ai_review and row.ai_review.get("source_fingerprint") == snapshot_fingerprint:
        response.headers["Cache-Control"] = "private, no-store"
        return {"status": "CURRENT", "result": row.ai_review.get("result"),
            "model": row.ai_review.get("model"), "reviewed_at": row.ai_review.get("reviewed_at")}
    db.rollback()  # Release the database transaction before the external model call.
    try:
        analysis = await analyze_documents(SimpleNamespace(documents=documents))
    except AIReviewUnavailable as error:
        code = str(error)
        status = 413 if code == "ai_review_payload_too_large" else 503
        raise HTTPException(status, code) from None
    except AIReviewProviderError as error:
        raise HTTPException(502, str(error)) from None

    locked = db.scalar(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.id == request_id).with_for_update())
    if not locked or locked.status not in {"SUBMITTED", "REGISTERED"}:
        db.rollback()
        raise HTTPException(409, "request_changed_during_ai_review")
    if source_fingerprint(locked.documents or []) != snapshot_fingerprint:
        db.rollback()
        raise HTTPException(409, "ai_review_sources_changed_reload_required")
    reviewed_at = datetime.now(timezone.utc).isoformat()
    locked.ai_review = {**analysis, "reviewed_by": user.id, "reviewed_at": reviewed_at}
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=locked.id,
        action="admin_ai_document_precheck", new_value=f"source_count={len(analysis['sources'])};model={analysis['model']}", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return {"status": "CURRENT", "result": analysis["result"], "model": analysis["model"], "reviewed_at": reviewed_at}


@router.post("/{request_id}/register")
def register(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.scalar(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.id == request_id).with_for_update())
    if not row:
        raise HTTPException(404, "request_not_found")
    if row.status == "REGISTERED" and row.registered_case_id:
        return {**_read(row, db.get(Customer, row.customer_id), include_admin_details=True), "case_id": row.registered_case_id}
    if row.status != "SUBMITTED":
        raise HTTPException(409, "request_not_submitted")
    case = db.get(Case, row.registered_case_id) if row.registered_case_id else None
    if case:
        case.customs = row.customs
        case.operation_type = row.operation_type
        case.status = "در انتظار پیش‌نویس اظهارنامه"
    else:
        case = Case(id="CASE-" + uuid4().hex[:20].upper(), customer_id=row.customer_id,
            operation_type=row.operation_type, customs=row.customs, status="در انتظار پیش‌نویس اظهارنامه",
            sync_version=0, sync_source="api", sync_updated_at=datetime.now(timezone.utc), created_by=user.id)
        db.add(case)
        db.flush()
    row.status, row.reviewed_by, row.reviewed_at, row.registered_case_id = "REGISTERED", user.id, datetime.now(timezone.utc), case.id
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=row.id,
        action="approve_and_register", new_value=f"case_id={case.id}", source="api"))
    db.add(AuditLog(actor_user_id=user.id, entity_type="case", entity_id=case.id,
        action="create_from_customer_submission", new_value=f"request_id={row.id}", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return {**_read(row, db.get(Customer, row.customer_id), include_admin_details=True), "case_id": case.id}



class AdminRequestAction(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    reason: str = Field(min_length=3, max_length=1000)


@router.get("/admin/deleted")
def deleted_requests(db: DbSession, user: CurrentUser):
    _require_admin(user)
    rows = db.scalars(select(CaseRegistrationRequest).where(CaseRegistrationRequest.status == "DELETED"))
    return [_read(row, db.get(Customer, row.customer_id), include_admin_details=True) for row in rows]


@router.post("/{request_id}/admin-action/{action}")
def admin_request_action(request_id: str, action: str, payload: AdminRequestAction,
        db: DbSession, user: CurrentUser):
    _require_admin(user)
    row = db.scalar(select(CaseRegistrationRequest).where(CaseRegistrationRequest.id == request_id).with_for_update())
    if not row:
        raise HTTPException(404, "request_not_found")
    if action not in {"correction", "delete", "restore"}:
        raise HTTPException(422, "invalid_request_action")
    case = db.get(Case, row.registered_case_id) if row.registered_case_id else None
    if row.status == "ACTIVE" or (case and case.customs_quota_number):
        raise HTTPException(409, "active_case_requires_separate_authorized_revision")
    details = dict(row.details or {})
    previous = row.status
    if action == "restore":
        if row.status != "DELETED":
            raise HTTPException(409, "request_not_deleted")
        row.status = details.pop("_deleted_previous_status", "SUBMITTED")
    elif action == "delete":
        if row.status == "DELETED":
            raise HTTPException(409, "request_already_deleted")
        details["_deleted_previous_status"] = row.status
        row.status = "DELETED"
    else:
        if row.status not in {"SUBMITTED", "REGISTERED"}:
            raise HTTPException(409, "request_not_reviewable")
        row.status = "DRAFT"
        details["_correction_reason"] = payload.reason
        details["_review_after"] = datetime.now(timezone.utc).isoformat()
        details.pop("_packing_list_snapshot", None)
        if case:
            case.status = "در انتظار اصلاح اطلاعات توسط مشتری"
    details["_admin_action_history"] = [*(details.get("_admin_action_history") or []),
        {"action": action, "reason": payload.reason, "from": previous, "actor": user.id,
         "at": datetime.now(timezone.utc).isoformat()}]
    row.details = details
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request",
        entity_id=row.id, action="admin_"+action, new_value=payload.reason, source="api"))
    db.commit()
    return _read(row, db.get(Customer, row.customer_id), include_admin_details=True)
