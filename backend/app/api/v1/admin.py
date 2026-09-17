from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Customer, Permission, User
from app.schemas.admin import (
    AdminCustomerCreate,
    AdminCustomerUpdate,
    AdminEmployeeCreate,
    AdminEmployeeUpdate,
)
from app.services.drive_provisioning import DriveProvisioningService

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user: User) -> None:
    if user.role != "admin" or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_required")


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "telegram_user_id": user.telegram_user_id,
        "mobile": user.mobile,
        "email": user.email,
        "role": user.role,
        "permission_profile": user.permission_profile,
        "is_active": user.is_active,
    }


def _customer_dict(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "is_active": customer.is_active,
        "drive_folder_id": customer.drive_folder_id,
        "drive_provisioning_status": customer.drive_provisioning_status,
    }


def _employee_permission(employee: User) -> Permission:
    return Permission(
        id=f"PERM-{uuid4().hex[:16].upper()}",
        user_id=employee.id,
        role="internal_employee",
        scope_type="ASSIGNED",
        scope_id="OWN_ASSIGNMENTS",
        profile=employee.permission_profile,
        can_view=True,
        can_create=True,
        can_edit=True,
        can_assign=False,
        can_approve_documents=False,
        can_finance=False,
        is_active=employee.is_active,
    )


@router.get("/employees")
def list_employees(db: DbSession, current_user: CurrentUser) -> list[dict]:
    _require_admin(current_user)
    rows = db.scalars(select(User).where(User.role == "internal_employee").order_by(User.created_at.asc()))
    return [_user_dict(row) for row in rows]


@router.post("/employees", status_code=status.HTTP_201_CREATED)
def create_employee(payload: AdminEmployeeCreate, db: DbSession, current_user: CurrentUser) -> dict:
    _require_admin(current_user)
    duplicate = db.scalar(select(User.id).where(User.telegram_user_id == payload.telegram_user_id))
    if duplicate:
        raise HTTPException(status_code=409, detail="telegram_user_id_exists")
    employee = User(
        id=f"USR-INTERNAL-{uuid4().hex[:12].upper()}",
        full_name=payload.full_name.strip(),
        mobile=payload.mobile,
        email=payload.email,
        telegram_user_id=payload.telegram_user_id.strip(),
        role="internal_employee",
        customer_id=None,
        permission_profile=payload.permission_profile,
        is_active=True,
    )
    db.add(employee)
    db.flush()
    db.add(_employee_permission(employee))
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="user", entity_id=employee.id, action="create_employee", source="api"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="employee_conflict") from None
    db.refresh(employee)
    return _user_dict(employee)


@router.patch("/employees/{user_id}")
def update_employee(user_id: str, payload: AdminEmployeeUpdate, db: DbSession, current_user: CurrentUser) -> dict:
    _require_admin(current_user)
    employee = db.get(User, user_id)
    if employee is None or employee.role != "internal_employee":
        raise HTTPException(status_code=404, detail="employee_not_found")
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(employee, key, value.strip() if isinstance(value, str) else value)
    permission = db.scalar(select(Permission).where(Permission.user_id == employee.id, Permission.role == "internal_employee"))
    if permission is None:
        db.add(_employee_permission(employee))
    else:
        permission.profile = employee.permission_profile
        permission.is_active = employee.is_active
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="user", entity_id=employee.id, action="update_employee", source="api"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="employee_conflict") from None
    db.refresh(employee)
    return _user_dict(employee)


@router.delete("/employees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(user_id: str, db: DbSession, current_user: CurrentUser) -> None:
    _require_admin(current_user)
    employee = db.get(User, user_id)
    if employee is None or employee.role != "internal_employee":
        raise HTTPException(status_code=404, detail="employee_not_found")
    db.delete(employee)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="employee_has_dependencies") from None


@router.get("/customers")
def list_customers(db: DbSession, current_user: CurrentUser) -> list[dict]:
    _require_admin(current_user)
    return [_customer_dict(row) for row in db.scalars(select(Customer).order_by(Customer.created_at.asc()))]


@router.post("/customers", status_code=status.HTTP_201_CREATED)
def create_customer(payload: AdminCustomerCreate, db: DbSession, current_user: CurrentUser) -> dict:
    _require_admin(current_user)
    customer = Customer(
        id=f"CUS-{uuid4().hex[:12].upper()}",
        name=payload.name.strip(),
        is_active=True,
        drive_provisioning_status="pending",
    )
    db.add(customer)
    db.flush()
    try:
        DriveProvisioningService(db).provision_customer(customer)
    except Exception:
        pass
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id, action="create_customer", source="api"))
    db.commit()
    db.refresh(customer)
    return _customer_dict(customer)


@router.patch("/customers/{customer_id}")
def update_customer(customer_id: str, payload: AdminCustomerUpdate, db: DbSession, current_user: CurrentUser) -> dict:
    _require_admin(current_user)
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="customer_not_found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, key, value.strip() if isinstance(value, str) else value)
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id, action="update_customer", source="api"))
    db.commit()
    db.refresh(customer)
    return _customer_dict(customer)


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: str, db: DbSession, current_user: CurrentUser) -> None:
    _require_admin(current_user)
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="customer_not_found")
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="customer_has_dependencies") from None
