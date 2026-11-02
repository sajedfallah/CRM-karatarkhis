from datetime import date, datetime, timezone
import hashlib
import re
from typing import Literal
from urllib.parse import quote
from uuid import UUID, uuid4
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field, ValidationError, model_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from app.api.deps import CurrentUser, DbSession
from app.api.v1.customers import _require_admin
from app.models.core import AuditLog, Case, Customer
from app.models.case_workflow import CaseWorkflowMessage, CaseWorkflowNotification
from app.models.compliance import CorporateDocument, CorporateDocumentVersion, DocumentNotification
from app.services.document_expiry import latest_versions, local_today, scan_expiry, validity
from app.services.private_files import MAX_FILE_BYTES, PrivateFileStore
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService

router = APIRouter(tags=["customer corporate documents"])


@router.get("/corporate-document-storage/status")
def storage_status(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    db.rollback()
    response.headers["Cache-Control"] = "private, no-store"
    try:
        PrivateFileStore().probe()
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    return {"ready": True}


class Metadata(BaseModel):
    document_type: Literal["power_of_attorney", "license"]
    title: str = Field(min_length=2, max_length=255)
    starts_on: date | None = None
    expires_on: date | None = None
    remind_days: int = Field(default=30, ge=1, le=365)

    @model_validator(mode="after")
    def dates(self):
        if self.document_type == "power_of_attorney" and (not self.starts_on or not self.expires_on):
            raise ValueError("power_of_attorney_dates_required")
        if self.starts_on and self.expires_on and self.expires_on < self.starts_on:
            raise ValueError("expiry_before_start")
        return self


def customer_or_404(db, customer_id):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "customer_not_found")
    return customer


def version_read(version):
    return {"id": version.id, "version": version.version, "file_name": version.file_name,
        "mime_type": version.mime_type, "size_bytes": version.size_bytes, "starts_on": version.starts_on,
        "expires_on": version.expires_on, "remind_days": version.remind_days, "created_at": version.created_at,
        "status": validity(version), "remaining_days": (version.expires_on-local_today()).days if version.expires_on else None}


def document_read(db, document):
    versions = list(db.scalars(select(CorporateDocumentVersion).where(
        CorporateDocumentVersion.document_id == document.id).order_by(CorporateDocumentVersion.version.desc())))
    return {"id": document.id, "customer_id": document.customer_id, "title": document.title,
        "document_type": document.document_type, "versions": [version_read(v) for v in versions]}


@router.get("/customers/{customer_id}/corporate-documents")
def list_documents(customer_id: str, db: DbSession, user: CurrentUser):
    _require_admin(user)
    customer_or_404(db, customer_id)
    return [document_read(db, row) for row in db.scalars(select(CorporateDocument).where(
        CorporateDocument.customer_id == customer_id).order_by(CorporateDocument.created_at.desc()))]


def validate_file(file, data):
    name = re.sub(r"[^\w. ()-]", "_", (file.filename or "document").replace("\\", "/").split("/")[-1])[:180]
    extension = name.rsplit(".", 1)[-1].lower()
    allowed = {"pdf": ("application/pdf", b"%PDF-"), "png": ("image/png", b"\x89PNG\r\n\x1a\n"),
        "jpg": ("image/jpeg", b"\xff\xd8\xff"), "jpeg": ("image/jpeg", b"\xff\xd8\xff")}
    if extension not in allowed:
        raise HTTPException(415, "unsupported_file_type")
    mime, signature = allowed[extension]
    if file.content_type != mime or not data.startswith(signature):
        raise HTTPException(415, "file_content_mismatch")
    return name, mime


def previous_upload(db, version_id, customer_id, metadata, digest, filename, document_id):
    version = db.get(CorporateDocumentVersion, version_id)
    if not version:
        return None
    document = db.get(CorporateDocument, version.document_id)
    if (document.customer_id != customer_id or document.document_type != metadata.document_type or
        document.title != metadata.title or version.sha256 != digest or version.file_name != filename or
        version.starts_on != metadata.starts_on or version.expires_on != metadata.expires_on or
        version.remind_days != metadata.remind_days or (document_id and document.id != document_id) or
        (not document_id and version.version != 1)):
        raise HTTPException(409, "upload_id_conflict")
    return document_read(db, document)


@router.post("/customers/{customer_id}/corporate-documents", status_code=201)
def upload_document(customer_id: str, db: DbSession, user: CurrentUser, file: UploadFile = File(...),
    upload_id: UUID = Form(...), document_type: str = Form(...), title: str = Form(...),
    starts_on: date | None = Form(None), expires_on: date | None = Form(None),
    remind_days: int = Form(30), document_id: str | None = Form(None)):
    _require_admin(user)
    customer = customer_or_404(db, customer_id)
    if not customer.is_active:
        raise HTTPException(409, "inactive_customer")
    try:
        metadata = Metadata(document_type=document_type, title=title.strip(), starts_on=starts_on,
            expires_on=expires_on, remind_days=remind_days)
    except ValidationError:
        raise HTTPException(422, "invalid_document_dates_or_metadata") from None
    if document_id:
        document = db.get(CorporateDocument, document_id)
        if not document or document.customer_id != customer_id:
            raise HTTPException(404, "document_not_found")
        if document.document_type != metadata.document_type or document.title != metadata.title:
            raise HTTPException(422, "document_identity_cannot_change")
    data = file.file.read(MAX_FILE_BYTES+1)
    if not data or len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "file_too_large_or_empty")
    filename, mime = validate_file(file, data)
    digest = hashlib.sha256(data).hexdigest()
    version_id = "CDV-"+upload_id.hex
    previous = previous_upload(db, version_id, customer_id, metadata, digest, filename, document_id)
    if previous:
        return previous
    actor_id = user.id
    # End the authorization/read transaction before external storage I/O.
    db.rollback()
    key = "corporate/"+uuid4().hex
    try:
        store = PrivateFileStore()
        store.put(key, data, mime)
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    try:
        if document_id:
            document = db.scalar(select(CorporateDocument).where(CorporateDocument.id == document_id,
                CorporateDocument.customer_id == customer_id).with_for_update())
            if not document:
                raise HTTPException(404, "document_not_found")
        else:
            document = CorporateDocument(id="CD-"+uuid4().hex, customer_id=customer_id,
                document_type=metadata.document_type, title=metadata.title, created_by=actor_id)
            db.add(document)
            db.flush()
        number = (db.scalar(select(func.max(CorporateDocumentVersion.version)).where(
            CorporateDocumentVersion.document_id == document.id)) or 0)+1
        db.add(CorporateDocumentVersion(id=version_id, document_id=document.id, version=number,
            object_key=key, file_name=filename, mime_type=mime, size_bytes=len(data), sha256=digest,
            starts_on=metadata.starts_on, expires_on=metadata.expires_on, remind_days=metadata.remind_days, created_by=actor_id))
        db.add(AuditLog(actor_user_id=actor_id, entity_type="corporate_document_version", entity_id=version_id,
            action="create_version", source="api"))
        db.commit()
    except Exception as error:
        db.rollback()
        try:
            store.remove_uncommitted(key)
        except Exception:
            pass
        if isinstance(error, IntegrityError):
            previous = previous_upload(db, version_id, customer_id, metadata, digest, filename, document_id)
            if previous:
                return previous
        if isinstance(error, HTTPException):
            raise error
        raise HTTPException(503, "document_save_failed") from None
    result = document_read(db, document)
    # Notifications are materialized independently by the notification poll/scan.
    return result


@router.get("/customers/{customer_id}/corporate-documents/{version_id}/file")
def download_document(customer_id: str, version_id: str, db: DbSession, user: CurrentUser):
    _require_admin(user)
    version = db.scalar(select(CorporateDocumentVersion).join(CorporateDocument).where(
        CorporateDocumentVersion.id == version_id, CorporateDocument.customer_id == customer_id))
    if not version:
        raise HTTPException(404, "document_not_found")
    key, name, mime, size, digest = version.object_key, version.file_name, version.mime_type, version.size_bytes, version.sha256
    actor_id = user.id
    db.add(AuditLog(actor_user_id=actor_id, entity_type="corporate_document_version", entity_id=version_id, action="download", source="api"))
    db.commit()
    try:
        data = PrivateFileStore().get(key)
        if len(data) != size or hashlib.sha256(data).hexdigest() != digest:
            raise ValueError("file_integrity_error")
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    return Response(data, media_type=mime, headers={"Cache-Control": "private, no-store",
        "Content-Disposition": "attachment; filename*=UTF-8''"+quote(name), "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'", "Referrer-Policy": "no-referrer"})


@router.get("/notifications")
def notifications(db: DbSession, user: CurrentUser):
    result = []
    if user.role == "admin":
        scan_expiry(db)
        latest = {version.id for _, version in latest_versions(db)}
        rows = list(db.scalars(select(DocumentNotification).where(DocumentNotification.recipient_user_id == user.id,
            DocumentNotification.version_id.in_(latest)).order_by(DocumentNotification.created_at.desc()))) if latest else []
        result.extend({"id": row.id, "kind": "corporate_document", "title": row.title,
            "customer_id": row.customer_id, "version_id": row.version_id,
            "customer_name": db.get(Customer, row.customer_id).name,
            "document_title": db.get(CorporateDocument, db.get(CorporateDocumentVersion, row.version_id).document_id).title,
            "read_at": row.read_at, "created_at": row.created_at, "threshold": row.threshold} for row in rows)
    workflow_rows = list(db.execute(select(CaseWorkflowNotification, CaseWorkflowMessage, Case).join(
        CaseWorkflowMessage, CaseWorkflowMessage.id == CaseWorkflowNotification.message_id).join(
        Case, Case.id == CaseWorkflowNotification.case_id).where(
        CaseWorkflowNotification.recipient_user_id == user.id,
        CaseWorkflowMessage.visibility == "customer").order_by(CaseWorkflowNotification.created_at.desc()).limit(100)))
    result.extend({"id": notification.id, "kind": "case_workflow", "title": "پیام جدید دربارهٔ پرونده",
        "case_id": case.id, "case_title": case.real_case_number or case.id,
        "customer_id": case.customer_id, "body": message.body,
        "read_at": notification.read_at, "created_at": notification.created_at}
        for notification, message, case in workflow_rows)
    return sorted(result, key=lambda row: row["created_at"], reverse=True)


@router.patch("/notifications/{notification_id}/read", status_code=204)
def read_notification(notification_id: str, db: DbSession, user: CurrentUser):
    row = db.get(DocumentNotification, notification_id)
    if row and row.recipient_user_id == user.id and user.role == "admin":
        row.read_at = row.read_at or datetime.now(timezone.utc)
        db.commit()
        return
    workflow_row = db.get(CaseWorkflowNotification, notification_id)
    if not workflow_row or workflow_row.recipient_user_id != user.id:
        raise HTTPException(404, "notification_not_found")
    try:
        AuthorizationService(db).require_case_action(user, db.get(Case, workflow_row.case_id), Action.VIEW)
    except AuthorizationDenied:
        raise HTTPException(404, "notification_not_found") from None
    workflow_row.read_at = workflow_row.read_at or datetime.now(timezone.utc)
    db.commit()
