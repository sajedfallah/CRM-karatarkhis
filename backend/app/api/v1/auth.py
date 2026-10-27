from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, Field, field_validator

from app.api.deps import CurrentUser, DbSession
from app.models.auth import AuthSession
from app.models.core import SecurityEvent
from app.services.authentication import COOKIE_NAME, authenticate_password, create_session, require_origin, token_hash, utc_now

router = APIRouter(prefix="/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128, repr=False)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession):
    require_origin(request)
    user = authenticate_password(db, payload.email, payload.password, request)
    token, csrf = create_session(db, user)
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
