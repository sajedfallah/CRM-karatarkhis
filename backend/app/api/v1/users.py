from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Customer, Permission, User
from app.schemas.users import CurrentUserRead, PermissionRead, UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

_ALLOWED_ROLES = {"admin", "internal_employee", "customer_manager", "customer_employee"}


def _require_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_required")


def _sync_user_permission(db: DbSession, user: User) -> None:
    for item in db.scalars(select(Permission).where(Permission.user_id == user.id)):
        item.is_active = False
    if user.role == "admin":
        return
    if user.role in {"customer_manager", "customer_employee"} and not user.customer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_required_for_customer_role")
    if user.customer_id and db.get(Customer, user.customer_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_customer")

    scope_type = "CUSTOMER" if user.role == "customer_manager" else "ASSIGNED"
    scope_id = user.customer_id or "OWN_ASSIGNMENTS"
    can_write = user.permission_profile in {"عملیاتی", "مدیریتی", "پیشرفته"}
    db.add(
        Permission(
            id=f"PERM-{uuid4().hex[:20].upper()}",
            user_id=user.id,
            role=user.role,
            scope_type=scope_type,
            scope_id=scope_id,
            profile=user.permission_profile,
            can_view=True,
            can_create=can_write,
            can_edit=can_write,
            can_assign=user.role == "customer_manager",
            can_approve_documents=False,
            can_finance=False,
            is_active=True,
        )
    )


@router.get("/me", response_model=CurrentUserRead)
def get_me(current_user: CurrentUser) -> CurrentUserRead:
    return CurrentUserRead.model_validate(current_user)


@router.get("/me/permissions", response_model=list[PermissionRead])
def get_my_permissions(db: DbSession, current_user: CurrentUser) -> list[PermissionRead]:
    statement = select(Permission).where(
        Permission.is_active.is_(True),
        (Permission.user_id == current_user.id)
        | ((Permission.user_id.is_(None)) & (Permission.role == current_user.role) & (Permission.profile == current_user.permission_profile)),
    )
    return [PermissionRead.model_validate(item) for item in db.scalars(statement)]


@router.get("", response_model=list[UserRead])
def list_users(db: DbSession, current_user: CurrentUser) -> list[User]:
    _require_admin(current_user)
    return list(db.scalars(select(User).order_by(User.created_at.desc())))


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: DbSession, current_user: CurrentUser) -> User:
    _require_admin(current_user)
    if payload.role not in _ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="invalid_role")
    user = User(
        id=f"USR-{uuid4().hex[:20].upper()}",
        full_name=payload.full_name,
        mobile=payload.mobile,
        email=payload.email,
        telegram_user_id=payload.telegram_user_id,
        role=payload.role,
        customer_id=payload.customer_id,
        permission_profile=payload.permission_profile,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()
    _sync_user_permission(db, user)
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="user", entity_id=user.id, action="create", source="api"))
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: str, payload: UserUpdate, db: DbSession, current_user: CurrentUser) -> User:
    _require_admin(current_user)
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user_not_found")
    changes = payload.model_dump(exclude_unset=True)
    if "role" in changes and changes["role"] not in _ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="invalid_role")
    for field_name, value in changes.items():
        setattr(user, field_name, value)
    _sync_user_permission(db, user)
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="user", entity_id=user.id, action="update", source="api"))
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", response_model=UserRead)
def delete_user(user_id: str, db: DbSession, current_user: CurrentUser) -> User:
    _require_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=409, detail="cannot_delete_current_admin")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user_not_found")
    user.is_active = False
    for item in db.scalars(select(Permission).where(Permission.user_id == user.id)):
        item.is_active = False
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="user", entity_id=user.id, action="deactivate", source="api"))
    db.commit()
    db.refresh(user)
    return user
