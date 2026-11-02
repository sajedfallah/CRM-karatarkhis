from datetime import datetime, timezone
import hashlib
import json
import os
import re
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.case_workflow import CaseWorkflowAttachment, CaseWorkflowMessage, CaseWorkflowNotification
from app.models.core import AuditLog, Case, CaseAssignment, User
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService
from app.services.private_files import MAX_FILE_BYTES, PrivateFileStore

router = APIRouter(prefix="/cases/{case_id}/workflow/messages", tags=["case workflow messages"])
_ALLOWED = {"pdf": ("application/pdf", b"%PDF-"), "png": ("image/png", b"\x89PNG\r\n\x1a\n"),
            "jpg": ("image/jpeg", b"\xff\xd8\xff"), "jpeg": ("image/jpeg", b"\xff\xd8\xff")}


def _case_or_404(db, case_id):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "case_not_found")
    return case


def _authorize(db, user, case, action):
    try:
        AuthorizationService(db).require_case_action(user, case, action)
    except AuthorizationDenied:
        if action == Action.VIEW:
            raise HTTPException(404, "case_not_found") from None
        raise HTTPException(403, "action_not_allowed") from None


def _file_data(file):
    if not file:
        return None
    name = re.sub(r"[^\w. ()-]", "_", (file.filename or "attachment").replace("\\", "/").split("/")[-1])[:180]
    extension = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    spec = _ALLOWED.get(extension)
    data = file.file.read(MAX_FILE_BYTES + 1)
    if not data or len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "file_too_large_or_empty")
    if not spec or file.content_type != spec[0] or not data.startswith(spec[1]):
        raise HTTPException(415, "file_content_mismatch")
    return name, spec[0], data, hashlib.sha256(data).hexdigest()


def _visible(message, user):
    return message.visibility == "customer" or user.role in {"admin", "internal_employee"}


def _message_read(db, message, user):
    attachment = db.scalar(select(CaseWorkflowAttachment).where(CaseWorkflowAttachment.message_id == message.id))
    notification = db.scalar(select(CaseWorkflowNotification).where(
        CaseWorkflowNotification.message_id == message.id,
        CaseWorkflowNotification.recipient_user_id == user.id))
    sender = db.get(User, message.sender_user_id) if message.sender_user_id else None
    sender_label = (sender.full_name if sender and user.role in {"admin", "internal_employee"}
                    else "تیم کاراترخیص" if sender and sender.role in {"admin", "internal_employee"}
                    else "شرکت شما" if sender else "کاربر")
    return {"id": message.id, "case_id": message.case_id, "stage": message.stage,
        "visibility": message.visibility, "body": message.body,
        "sender": sender_label,
        "created_at": message.created_at, "unread": bool(notification and notification.read_at is None),
        "notification_id": notification.id if notification else None,
        "attachment": ({"id": attachment.id, "file_name": attachment.file_name, "mime_type": attachment.mime_type,
            "size_bytes": attachment.size_bytes} if attachment else None)}


def _recipients(db, case, sender, visibility):
    if visibility != "customer":
        return []
    if sender.role in {"admin", "internal_employee"}:
        return list(db.scalars(select(User).where(User.customer_id == case.customer_id,
            User.role.in_(("customer_manager", "customer_employee")), User.is_active.is_(True))))
    assigned = list(db.scalars(select(User).join(CaseAssignment, CaseAssignment.user_id == User.id).where(
        CaseAssignment.case_id == case.id, CaseAssignment.is_active.is_(True),
        User.role == "internal_employee", User.is_active.is_(True))))
    admins = list(db.scalars(select(User).where(User.role == "admin", User.is_active.is_(True))))
    return list({user.id: user for user in assigned + admins}.values())


@router.get("")
def list_messages(case_id: str, db: DbSession, user: CurrentUser):
    case = _case_or_404(db, case_id)
    _authorize(db, user, case, Action.VIEW)
    if case.operation_type not in {"import", "export"}:
        raise HTTPException(409, "import_or_export_case_required")
    rows = list(db.scalars(select(CaseWorkflowMessage).where(
        CaseWorkflowMessage.case_id == case.id).order_by(CaseWorkflowMessage.created_at.asc())))
    messages = [_message_read(db, row, user) for row in rows if _visible(row, user)]
    history = list(db.scalars(select(AuditLog).where(AuditLog.entity_type == "case_workflow",
        AuditLog.entity_id == case.id, AuditLog.action == "transition").order_by(AuditLog.id.asc())))
    current_stage = None
    if history:
        try:
            current_stage = json.loads(history[-1].new_value or "{}").get("stage")
        except (TypeError, json.JSONDecodeError):
            current_stage = None
    return {"messages": messages, "current_stage": current_stage}


@router.post("", status_code=201)
def create_message(case_id: str, db: DbSession, user: CurrentUser,
                   body: str = Form(""), visibility: str = Form("customer"), stage: str | None = Form(None),
                   file: UploadFile | None = File(None)):
    case = _case_or_404(db, case_id)
    is_internal = user.role in {"admin", "internal_employee"}
    _authorize(db, user, case, Action.EDIT if is_internal else Action.CREATE)
    if case.operation_type not in {"import", "export"}:
        raise HTTPException(409, "import_or_export_case_required")
    body = body.strip()
    if len(body) > 4000 or (not body and not file):
        raise HTTPException(422, "message_required_or_too_long")
    if visibility not in {"customer", "internal"} or (not is_internal and visibility != "customer"):
        raise HTTPException(422, "invalid_message_visibility")
    if stage is not None and (len(stage) > 80 or not stage.strip()):
        raise HTTPException(422, "invalid_workflow_stage")
    attachment_data = _file_data(file) if file else None
    case_id, actor_id, message_id = case.id, user.id, "WFM-" + uuid4().hex
    key = "case-workflow/" + uuid4().hex if attachment_data else None
    db.rollback()
    store = None
    if attachment_data:
        try:
            store = PrivateFileStore()
            store.put(key, attachment_data[2], attachment_data[1])
        except Exception:
            raise HTTPException(503, "private_storage_unavailable") from None
    try:
        message = CaseWorkflowMessage(id=message_id, case_id=case_id, stage=stage,
            sender_user_id=actor_id, visibility=visibility, body=body or "پیوست پرونده")
        db.add(message)
        if attachment_data and key:
            db.add(CaseWorkflowAttachment(id="WFA-" + uuid4().hex, message_id=message_id,
                object_key=key, file_name=attachment_data[0], mime_type=attachment_data[1],
                size_bytes=len(attachment_data[2]), sha256=attachment_data[3], uploaded_by=actor_id))
        db.add(AuditLog(actor_user_id=actor_id, entity_type="case_workflow_message", entity_id=message_id,
            action="create", new_value=json.dumps({"case_id": case_id, "stage": stage, "visibility": visibility}, ensure_ascii=False), source="api"))
        for recipient in _recipients(db, db.get(Case, case_id), user, visibility):
            if recipient.id != actor_id:
                db.add(CaseWorkflowNotification(id="WFN-" + uuid4().hex, recipient_user_id=recipient.id,
                    message_id=message_id, case_id=case_id))
        db.commit()
    except Exception:
        db.rollback()
        if store and key:
            try:
                store.remove_uncommitted(key)
            except Exception:
                pass
        raise HTTPException(503, "message_save_failed") from None
    db.refresh(message)
    return _message_read(db, message, user)


@router.get("/{message_id}/attachments/{attachment_id}")
def download_attachment(case_id: str, message_id: str, attachment_id: str, db: DbSession, user: CurrentUser):
    case = _case_or_404(db, case_id)
    _authorize(db, user, case, Action.VIEW)
    message = db.get(CaseWorkflowMessage, message_id)
    if not message or message.case_id != case.id or not _visible(message, user):
        raise HTTPException(404, "attachment_not_found")
    attachment = db.get(CaseWorkflowAttachment, attachment_id)
    if not attachment or attachment.message_id != message.id:
        raise HTTPException(404, "attachment_not_found")
    try:
        data = PrivateFileStore().get(attachment.object_key)
        if len(data) != attachment.size_bytes or hashlib.sha256(data).hexdigest() != attachment.sha256:
            raise ValueError("file_integrity_error")
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    return Response(data, media_type=attachment.mime_type, headers={"Cache-Control": "private, no-store",
        "Content-Disposition": "attachment; filename*=UTF-8''" + quote(attachment.file_name),
        "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'",
        "Referrer-Policy": "no-referrer"})


@router.patch("/notifications/{notification_id}/read", status_code=204)
def read_notification(case_id: str, notification_id: str, db: DbSession, user: CurrentUser):
    notification = db.scalar(select(CaseWorkflowNotification).where(
        CaseWorkflowNotification.id == notification_id,
        CaseWorkflowNotification.case_id == case_id,
        CaseWorkflowNotification.recipient_user_id == user.id))
    if not notification:
        raise HTTPException(404, "notification_not_found")
    case = _case_or_404(db, case_id)
    _authorize(db, user, case, Action.VIEW)
    notification.read_at = notification.read_at or datetime.now(timezone.utc)
    db.commit()
