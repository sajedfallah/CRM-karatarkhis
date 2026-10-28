"""Customer case-registration intake and the administrator's submission queue."""
import hashlib
import os
from datetime import datetime, timezone
from uuid import UUID, uuid4
from urllib.parse import quote

from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.api.v1.compliance import validate_file
from app.api.v1.customers import _require_admin
from app.models.case_registration_request import CaseRegistrationRequest
from app.models.core import AuditLog, Case, Customer
from app.services.import_requirements import IMPORT_DOCUMENT_LABELS
from app.services.private_files import MAX_FILE_BYTES, PrivateFileStore

router = APIRouter(prefix="/case-registration-requests", tags=["case registration requests"])
IMPORT_TYPES = set(IMPORT_DOCUMENT_LABELS)


def _customer_actor(user):
    if user.role not in {"customer_manager", "customer_employee"} or not getattr(user, "customer_id", None):
        raise HTTPException(403, "customer_membership_required")
    if not getattr(user, "membership_id", None) and os.getenv("APP_ENV", "production") not in {"development", "test"}:
        raise HTTPException(403, "customer_membership_required")
    return user.customer_id


def _customer_request(db, user, request_id, editable=False):
    row = db.get(CaseRegistrationRequest, request_id)
    if not row:
        raise HTTPException(404, "request_not_found")
    if user.role != "admin":
        customer_id = _customer_actor(user)
        if row.customer_id != customer_id or row.created_by != user.id:
            raise HTTPException(404, "request_not_found")
        if editable and row.status != "DRAFT":
            raise HTTPException(409, "request_already_submitted")
    return row


def _read(row, customer):
    return {"id": row.id, "customer_id": row.customer_id, "customer_name": customer.name,
        "title": row.title, "operation_type": row.operation_type, "customs": row.customs,
        "hs_code": row.hs_code, "status": row.status, "submitted_at": row.submitted_at,
        "registered_case_id": row.registered_case_id,
        "documents": [{key: doc[key] for key in ("id", "document_type", "title", "file_name", "mime_type", "size_bytes", "uploaded_at")}
            for doc in row.documents], "created_at": row.created_at, "updated_at": row.updated_at}


class CreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    request_id: UUID
    title: str = Field(min_length=2, max_length=200)
    operation_type: str = Field(pattern=r"^(import|export)$")
    customs: str = Field(min_length=1, max_length=64)
    hs_code: str = Field(min_length=6, max_length=12, pattern=r"^[0-9]{6,12}$")


class UpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=2, max_length=200)
    operation_type: str = Field(pattern=r"^(import|export)$")
    customs: str = Field(min_length=1, max_length=64)
    hs_code: str = Field(min_length=6, max_length=12, pattern=r"^[0-9]{6,12}$")


@router.get("/mine")
def mine(db: DbSession, user: CurrentUser, response: Response):
    customer_id = _customer_actor(user)
    response.headers["Cache-Control"] = "private, no-store"
    rows = db.scalars(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.customer_id == customer_id,
        CaseRegistrationRequest.created_by == user.id).order_by(CaseRegistrationRequest.created_at.desc()))
    customer = db.get(Customer, customer_id)
    return [_read(row, customer) for row in rows]


@router.get("")
def inbox(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    response.headers["Cache-Control"] = "private, no-store"
    rows = db.scalars(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.status.in_(("SUBMITTED", "REGISTERED"))).order_by(
            CaseRegistrationRequest.submitted_at.desc(), CaseRegistrationRequest.created_at.desc()))
    result = []
    for row in rows:
        customer = db.get(Customer, row.customer_id)
        if customer and customer.is_active:
            result.append(_read(row, customer))
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
        return _read(row, customer)
    row = CaseRegistrationRequest(id=request_id, customer_id=customer_id, created_by=user.id,
        title=payload.title, operation_type=payload.operation_type, customs=payload.customs,
        hs_code=payload.hs_code, documents=[])
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
    return _read(row, customer)


@router.get("/{request_id}")
def detail(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id)
    if user.role == "admin" and row.status not in {"SUBMITTED", "REGISTERED"}:
        raise HTTPException(404, "request_not_found")
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id))


@router.put("/{request_id}")
def update(request_id: str, payload: UpdateRequest, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id, editable=True)
    if row.documents and row.operation_type != payload.operation_type:
        raise HTTPException(409, "operation_type_locked_after_document_upload")
    row.title, row.operation_type, row.customs, row.hs_code = payload.title, payload.operation_type, payload.customs, payload.hs_code
    row.updated_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=row.id,
        action="update", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id))


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
        return _read(row, db.get(Customer, row.customer_id))
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
            "object_key": key, "uploaded_by": user.id, "uploaded_at": datetime.now(timezone.utc).isoformat()}
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
    return _read(row, db.get(Customer, row.customer_id))


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


@router.post("/{request_id}/submit")
def submit(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    row = _customer_request(db, user, request_id, editable=True)
    if len(row.title.strip()) < 2 or not row.customs.strip() or not row.hs_code.isdigit() or not 6 <= len(row.hs_code) <= 12:
        raise HTTPException(422, "request_fields_incomplete")
    if row.operation_type == "import":
        complete = {doc["document_type"] for doc in row.documents}
        if not IMPORT_TYPES.issubset(complete):
            raise HTTPException(422, "required_import_documents_missing")
    elif not row.documents:
        raise HTTPException(422, "export_documents_required")
    row.status = "SUBMITTED"
    row.submitted_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_registration_request", entity_id=row.id,
        action="submit", new_value="status=SUBMITTED", source="api"))
    db.commit()
    response.headers["Cache-Control"] = "private, no-store"
    return _read(row, db.get(Customer, row.customer_id))


@router.post("/{request_id}/register")
def register(request_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.scalar(select(CaseRegistrationRequest).where(
        CaseRegistrationRequest.id == request_id).with_for_update())
    if not row:
        raise HTTPException(404, "request_not_found")
    if row.status == "REGISTERED" and row.registered_case_id:
        return {**_read(row, db.get(Customer, row.customer_id)), "case_id": row.registered_case_id}
    if row.status != "SUBMITTED":
        raise HTTPException(409, "request_not_submitted")
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
    return {**_read(row, db.get(Customer, row.customer_id)), "case_id": case.id}

