from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator

from app.api.deps import CurrentUser, DbSession
from app.models.auth import AuthSession, PasswordCredential
from app.models.core import SecurityEvent
from app.services.authentication import COOKIE_NAME, authenticate_password, create_session, require_origin, token_hash, utc_now
from app.services.authentication import consume_login_attempt, session_csrf_token
from app.services.invitations import accept_invitation, issue_internal_invitation
from app.core.config import get_settings
from app.models.core import Organization, User
from sqlalchemy import select
from uuid import uuid4
import secrets

router = APIRouter(prefix="/auth", tags=["authentication"])


class AcceptInvitationRequest(BaseModel):
    token: str = Field(min_length=32, max_length=128, repr=False)
    password: str = Field(min_length=12, max_length=128, repr=False)
    full_name: str = Field(min_length=2, max_length=255)


@router.post("/accept-invitation")
def activate(payload: AcceptInvitationRequest, request: Request, response: Response, db: DbSession):
    require_origin(request)
    consume_login_attempt(db, "activation:" + (request.client.host if request.client else "unknown"), 30)
    response.headers["Cache-Control"] = "no-store"
    return accept_invitation(db, payload.token, payload.password, payload.full_name)


@router.post("/bootstrap-admin", status_code=202, include_in_schema=False)
def bootstrap_admin(request: Request, db: DbSession):
    """One-account staging bootstrap; email verification is still mandatory."""
    settings = get_settings()
    configured = settings.admin_bootstrap_token.get_secret_value() if settings.admin_bootstrap_token else ""
    supplied = request.headers.get("x-bootstrap-token", "")
    if settings.app_env != "staging" or len(configured) < 32 or not secrets.compare_digest(supplied, configured):
        raise HTTPException(404, "not_found")
    email = (settings.admin_bootstrap_email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(503, "bootstrap_not_configured")
    if db.scalar(select(PasswordCredential.user_id).join(User).where(User.role == "admin", PasswordCredential.email_verified_at.is_not(None))):
        raise HTTPException(409, "bootstrap_closed")
    organization = db.scalar(select(Organization).where(Organization.slug == "karatarkhis-internal"))
    if not organization:
        organization = Organization(id="ORG-" + uuid4().hex, type="INTERNAL", name="کاراترخیص", slug="karatarkhis-internal")
        db.add(organization)
        db.commit()
    return issue_internal_invitation(db, organization, email, "admin", None)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128, repr=False)
    organization_id: str | None = Field(default=None, min_length=1, max_length=64)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession):
    require_origin(request)
    user = authenticate_password(db, payload.email, payload.password, request)
    token, csrf = create_session(db, user, payload.organization_id)
    response.set_cookie(COOKIE_NAME, token, httponly=True, secure=True, samesite="strict", path="/", max_age=8 * 3600)
    response.headers["Cache-Control"] = "no-store"
    return {"user_id": user.id, "csrf_token": csrf}


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: DbSession, user: CurrentUser):
    token = request.cookies.get(COOKIE_NAME)
    session = db.get(AuthSession, token_hash(token)) if token else None
    if session:
        session.revoked_at = utc_now()
        db.add(SecurityEvent(user_id=user.id, event_type="logout"))
        db.commit()
    response.delete_cookie(COOKIE_NAME, path="/", secure=True, httponly=True, samesite="strict")
    response.headers["Cache-Control"] = "no-store"


@router.get("/csrf")
def csrf_token(request: Request, response: Response, user: CurrentUser):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(401, "session_required")
    # A custom header prevents acquisition through cross-site images/forms.
    # Cross-origin JavaScript is blocked by the browser's preflight/SOP.
    if request.headers.get("x-csrf-request") != "1":
        raise HTTPException(403, "csrf_request_header_required")
    origin = request.headers.get("origin")
    if origin is not None:
        require_origin(request)
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["Vary"] = "Cookie"
    return {"csrf_token": session_csrf_token(token)}
