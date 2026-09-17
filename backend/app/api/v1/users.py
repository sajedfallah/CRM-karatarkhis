from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import Permission
from app.schemas.users import CurrentUserRead, PermissionRead


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUserRead)
def get_me(current_user: CurrentUser) -> CurrentUserRead:
    return CurrentUserRead.model_validate(current_user)


@router.get("/me/permissions", response_model=list[PermissionRead])
def get_my_permissions(db: DbSession, current_user: CurrentUser) -> list[PermissionRead]:
    statement = select(Permission).where(
        Permission.is_active.is_(True),
        (Permission.user_id == current_user.id)
        | ((Permission.user_id.is_(None)) & (Permission.role == current_user.role)),
    )
    return [PermissionRead.model_validate(item) for item in db.scalars(statement)]
