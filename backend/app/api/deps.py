from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.core import User


DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    x_user_id: Annotated[str | None, Header()] = None,
) -> User:
    """Development identity adapter.

    This is intentionally not final authentication. It provides one controlled
    identity seam for DEV/STAGING while Telegram/OAuth authentication adapters
    are implemented. Production must reject this adapter.
    """
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_identity")

    user = db.get(User, x_user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_identity")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
