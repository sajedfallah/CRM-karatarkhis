from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Customer, User
from app.schemas.customers import CustomerCreate, CustomerRead, CustomerUpdate
from app.services.drive_provisioning import DriveProvisioningService

router = APIRouter(prefix="/customers", tags=["customers"])


def _require_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_required")


@router.get("", response_model=list[CustomerRead])
def list_customers(db: DbSession, current_user: CurrentUser) -> list[Customer]:
    _require_admin(current_user)
    return list(db.scalars(select(Customer).order_by(Customer.created_at.desc())))


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: DbSession, current_user: CurrentUser) -> Customer:
    _require_admin(current_user)
    customer = Customer(
        id=f"CUS-{uuid4().hex[:12].upper()}",
        name=payload.name,
        is_active=payload.is_active,
        drive_provisioning_status="pending",
    )
    db.add(customer)
    db.flush()
    try:
        DriveProvisioningService(db).provision_customer(customer)
    except Exception:
        pass
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id, action="create", source="api"))
    db.commit()
    db.refresh(customer)
    return customer


@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: str, payload: CustomerUpdate, db: DbSession, current_user: CurrentUser) -> Customer:
    _require_admin(current_user)
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="customer_not_found")
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field_name, value)
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id, action="update", source="api"))
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", response_model=CustomerRead)
def delete_customer(customer_id: str, db: DbSession, current_user: CurrentUser) -> Customer:
    _require_admin(current_user)
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="customer_not_found")
    customer.is_active = False
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id, action="deactivate", source="api"))
    db.commit()
    db.refresh(customer)
    return customer
