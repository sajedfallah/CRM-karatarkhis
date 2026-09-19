from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.deps import get_db
from app.models.core import User


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    x_user_id: Annotated[str | None, Header()] = None,
) -> User:
    """DEV/STAGING identity adapter only; production requires a real adapter."""
    if get_settings().app_env.lower() == "production":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="production_auth_not_configured")
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_identity")

    user = db.get(User, x_user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_identity")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
