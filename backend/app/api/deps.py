from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.deps import get_db
from app.models.core import User


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    request: Request,
    x_user_id: Annotated[str | None, Header()] = None,
) -> User:
    from app.services.authentication import session_user

    user = session_user(db, request)
    if user is not None:
        return user
    settings = get_settings()
    if settings.app_env.lower() not in {"development", "test"} or not settings.dev_identity_enabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_identity")
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_identity")

    user = db.get(User, x_user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_identity")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
