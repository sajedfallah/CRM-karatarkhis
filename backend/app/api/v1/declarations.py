"""Private declaration versions and explicit recipient-bound customer review."""
import hashlib
from typing import Literal
from urllib.parse import quote
from uuid import UUID, uuid4
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from app.api.deps import CurrentUser, DbSession
from app.api.v1.compliance import validate_file
from app.models.core import AuditLog, Case, Customer, OrganizationMembership, User
from app.models.auth import PasswordCredential
from app.models.declarations import DeclarationVersion, DeclarationRequest, DeclarationDecision
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService
from app.services.membership_identity import resolve_membership
from app.services.private_files import MAX_FILE_BYTES, PrivateFileStore

router = APIRouter(prefix="/declarations", tags=["declaration review"])


def audit(db, user, entity, action):
    db.add(AuditLog(actor_user_id=user.id, entity_type="declaration", entity_id=entity, action=action, source="api"))


def case_access(db, user, case_id, write=False, lock=False):
    query = select(Case).where(Case.id == case_id)
    case = db.scalar(query.with_for_update() if lock else query)
    if not case:
        raise HTTPException(404, "case_not_found")
    customer = db.get(Customer, case.customer_id)
    if not customer or not customer.is_active:
        raise HTTPException(404, "case_not_found")
    try:
        AuthorizationService(db).require_case_action(user, case, Action.EDIT if write else Action.VIEW)
    except AuthorizationDenied:
        raise HTTPException(403 if write else 404, "case_not_allowed") from None
    if case.operation_type != "import":
        raise HTTPException(409, "import_case_required")
    return case


def internal(user):
    if user.role != "admin" or getattr(user, "customer_id", None):
        raise HTTPException(403, "internal_admin_required")


def reviewer(db, membership_id, case):
    member = db.get(OrganizationMembership, membership_id)
    user = db.get(User, member.user_id) if member else None
    credential = db.get(PasswordCredential, user.id) if user else None
    if not user or not user.is_active or not credential or not credential.email_verified_at or credential.verified_email != (user.email or "").strip().lower():
        raise HTTPException(409, "active_verified_customer_required")
    identity = resolve_membership(db, user, membership_id=membership_id)
    if identity.role != "customer_manager" or identity.customer_id != case.customer_id:
        raise HTTPException(403, "customer_reviewer_required")
    try:
        AuthorizationService(db).require_case_action(identity, case, Action.APPROVE_DOCUMENTS)
    except AuthorizationDenied:
        raise HTTPException(403, "customer_review_permission_required") from None
    return identity


def latest(db, case_id):
    return db.scalar(select(func.max(DeclarationVersion.version)).where(DeclarationVersion.case_id == case_id)) or 0


def view(db, version, current_version):
    sent = db.scalar(select(DeclarationRequest).where(DeclarationRequest.version_id == version.id))
    decision = db.scalar(select(DeclarationDecision).where(DeclarationDecision.request_id == sent.id)) if sent else None
    status = "superseded" if version.version != current_version else decision.decision if decision else "pending" if sent else "uploaded"
    return {"id": version.id, "case_id": version.case_id, "version": version.version, "file_name": version.file_name,
        "created_at": version.created_at, "status": status,
        "request_id": sent.id if sent else None, "sent_at": sent.created_at if sent else None,
        "decision": decision.decision if decision else None, "comment": decision.comment if decision else None,
        "decided_at": decision.created_at if decision else None}


def visible_version(db, user, version_id, lock=False):
    version = db.get(DeclarationVersion, version_id)
    if not version:
        raise HTTPException(404, "declaration_not_found")
    case = case_access(db, user, version.case_id, lock=lock)
    if user.role != "admin":
        sent = db.scalar(select(DeclarationRequest).where(DeclarationRequest.version_id == version.id,
            DeclarationRequest.recipient_membership_id == getattr(user, "membership_id", None)))
        if user.role != "customer_manager" or not sent:
            raise HTTPException(404, "declaration_not_found")
        reviewer(db, user.membership_id, case)
    return version, case


@router.get("/inbox")
def inbox(db: DbSession, user: CurrentUser, response: Response):
    response.headers["Cache-Control"] = "private, no-store"
    if user.role != "customer_manager" or not getattr(user,"membership_id",None): return []
    result = []
    for sent in db.scalars(select(DeclarationRequest).where(DeclarationRequest.recipient_membership_id==user.membership_id).order_by(DeclarationRequest.created_at.desc())):
        try:
            version,case = visible_version(db,user,sent.version_id)
            item = view(db,version,latest(db,case.id))
            if item["status"]=="pending": result.append(item)
        except HTTPException as error:
            if error.status_code not in {403,404,409}: raise
    return result


@router.get("/cases/{case_id}")
def versions(case_id: str, db: DbSession, user: CurrentUser, response: Response):
    case_access(db, user, case_id)
    response.headers["Cache-Control"] = "private, no-store"
    rows = list(db.scalars(select(DeclarationVersion).where(DeclarationVersion.case_id == case_id).order_by(DeclarationVersion.version.desc())))
    result = []
    for row in rows:
        try:
            visible_version(db, user, row.id)
            result.append(view(db, row, latest(db, case_id)))
        except HTTPException as error:
            if error.status_code not in {403,404}: raise
    return result


@router.get("/cases/{case_id}/reviewers")
def reviewers(case_id: str, db: DbSession, user: CurrentUser, response: Response):
    internal(user)
    case = case_access(db, user, case_id)
    response.headers["Cache-Control"] = "private, no-store"
    result = []
    for member in db.scalars(select(OrganizationMembership).where(OrganizationMembership.role == "customer_manager")):
        try:
            identity = reviewer(db, member.id, case)
            result.append({"membership_id": member.id, "name": identity.full_name})
        except HTTPException:
            continue
    return result


@router.post("/cases/{case_id}", status_code=201)
def upload(case_id: str, db: DbSession, user: CurrentUser, file: UploadFile = File(...), upload_id: UUID = Form(...)):
    internal(user)
    case_access(db, user, case_id, write=True)
    data = file.file.read(MAX_FILE_BYTES+1)
    if not data or len(data)>MAX_FILE_BYTES: raise HTTPException(413, "file_too_large_or_empty")
    filename, mime = validate_file(file, data)
    digest = hashlib.sha256(data).hexdigest()
    version_id = "DV-"+upload_id.hex
    def replay():
        old = db.get(DeclarationVersion, version_id)
        if not old: return None
        if old.case_id != case_id or old.sha256 != digest or old.file_name != filename or old.created_by != user.id:
            raise HTTPException(409, "upload_id_conflict")
        return view(db, old, latest(db, case_id))
    previous = replay()
    if previous: return previous
    actor_id = user.id
    db.rollback()
    storage_path = "declarations/"+uuid4().hex
    try:
        store = PrivateFileStore()
        store.put(storage_path, data, mime)
    except Exception:
        raise HTTPException(503, "private_storage_unavailable") from None
    try:
        case_access(db, user, case_id, write=True, lock=True)
        number = latest(db, case_id)+1
        row = DeclarationVersion(id=version_id,case_id=case_id,version=number,object_key=storage_path,
            file_name=filename,mime_type=mime,size_bytes=len(data),sha256=digest,created_by=actor_id)
        db.add(row)
        audit(db,user,version_id,"upload_version")
        db.commit()
    except Exception as error:
        db.rollback()
        try: store.remove_uncommitted(storage_path)
        except Exception: pass
        if isinstance(error,IntegrityError):
            previous = replay()
            if previous: return previous
        if isinstance(error,HTTPException): raise
        raise HTTPException(503,"declaration_save_failed") from None
    return view(db,row,number)


class Send(BaseModel):
    model_config = ConfigDict(extra="forbid")
    recipient_membership_id: str = Field(min_length=1,max_length=64)


@router.post("/{version_id}/send")
def send(version_id: str, payload: Send, db: DbSession, user: CurrentUser):
    internal(user)
    version, case = visible_version(db,user,version_id,lock=True)
    if version.version != latest(db,case.id): raise HTTPException(409,"stale_declaration_version")
    reviewer(db,payload.recipient_membership_id,case)
    old = db.scalar(select(DeclarationRequest).where(DeclarationRequest.version_id==version_id))
    if old:
        if old.recipient_membership_id != payload.recipient_membership_id: raise HTTPException(409,"already_sent")
        return view(db,version,version.version)
    row = DeclarationRequest(id="DR-"+uuid4().hex,version_id=version_id,
        recipient_membership_id=payload.recipient_membership_id,sent_by=user.id)
    db.add(row)
    audit(db,user,row.id,"send_customer_review")
    db.commit()
    return view(db,version,version.version)


class Decision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: Literal["approved","correction_required"]
    comment: str | None = Field(default=None,max_length=2000)
    @model_validator(mode="after")
    def comment_required(self):
        self.comment = (self.comment or "").strip() or None
        if self.decision=="correction_required" and not self.comment: raise ValueError("correction_comment_required")
        return self


@router.post("/{version_id}/decision")
def decide(version_id: str, payload: Decision, db: DbSession, user: CurrentUser):
    if user.role!="customer_manager" or not getattr(user,"membership_id",None): raise HTTPException(403,"customer_reviewer_required")
    version, case = visible_version(db,user,version_id,lock=True)
    if version.version != latest(db,case.id): raise HTTPException(409,"stale_declaration_version")
    sent = db.scalar(select(DeclarationRequest).where(DeclarationRequest.version_id==version_id,
        DeclarationRequest.recipient_membership_id==user.membership_id))
    if not sent: raise HTTPException(404,"request_not_found")
    old = db.scalar(select(DeclarationDecision).where(DeclarationDecision.request_id==sent.id))
    if old:
        if old.decision != payload.decision or old.comment != payload.comment: raise HTTPException(409,"decision_already_recorded")
        return view(db,version,version.version)
    db.add(DeclarationDecision(id="DD-"+uuid4().hex,request_id=sent.id,decision=payload.decision,comment=payload.comment,
        actor_user_id=user.id,actor_membership_id=user.membership_id))
    audit(db,user,sent.id,"customer_"+payload.decision)
    db.commit()
    return view(db,version,version.version)


@router.get("/{version_id}/file")
def download(version_id: str, db: DbSession, user: CurrentUser):
    version,_ = visible_version(db,user,version_id)
    key,name,mime,size,digest = version.object_key,version.file_name,version.mime_type,version.size_bytes,version.sha256
    audit(db,user,version_id,"download")
    db.commit()
    try:
        data = PrivateFileStore().get(key)
        if len(data)!=size or hashlib.sha256(data).hexdigest()!=digest: raise ValueError("integrity_error")
    except Exception:
        raise HTTPException(503,"private_storage_unavailable") from None
    return Response(data,media_type=mime,headers={"Cache-Control":"private, no-store",
        "Content-Disposition":"attachment; filename*=UTF-8''"+quote(name),"X-Content-Type-Options":"nosniff",
        "Content-Security-Policy":"sandbox; default-src 'none'","Referrer-Policy":"no-referrer"})
