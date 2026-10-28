from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Customer, Invitation, Organization, User
from app.schemas.customers import CustomerCreate, CustomerRead, CustomerUpdate
from app.services.drive_provisioning import DriveProvisioningService
from app.services.invitations import issue_customer_manager
from app.services.authentication import utc_now

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
        **payload.model_dump(),
        drive_provisioning_status="pending",
    )
    db.add(customer)
    db.flush()
    try:
        DriveProvisioningService(db).provision_customer(customer)
    except Exception:
        pass
    org = None
    if customer.is_active:
        org = Organization(id="ORG-" + uuid4().hex, type="CUSTOMER", customer_id=customer.id,
            name=customer.name, slug="customer-" + customer.id.lower())
        db.add(org)
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id, action="create", source="api"))
    db.commit()
    db.refresh(customer)
    customer.manager_invitation_status = "email_required" if not customer.email else "not_invited"
    if org and customer.email:
        try:
            db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id,
                action="invite_customer_manager", new_value="Initial company manager invitation", source="api"))
            result = issue_customer_manager(db, org, customer.email, current_user.id)
            customer.manager_invitation_status = result["status"]
        except HTTPException as exc:
            # The customer/org are durable before email delivery. Surface invitation failure
            # without inviting an unsafe retry of the customer-creation command.
            customer.manager_invitation_status = "existing_account" if exc.detail == "existing_account_requires_sign_in" else "delivery_failed"
    return customer


@router.post("/{customer_id}/manager-invitation", status_code=202)
def invite_customer_manager(customer_id: str, db: DbSession, current_user: CurrentUser, response: Response):
    _require_admin(current_user)
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="customer_not_found")
    if not customer.is_active:
        raise HTTPException(status_code=409, detail="inactive_customer")
    if not customer.email:
        raise HTTPException(status_code=409, detail="customer_manager_email_required")
    org = db.scalar(select(Organization).where(Organization.customer_id == customer.id))
    if not org:
        org = Organization(id="ORG-" + uuid4().hex, type="CUSTOMER", customer_id=customer.id,
            name=customer.name, slug="customer-" + customer.id.lower())
        db.add(org)
        db.flush()
    for pending in db.scalars(select(Invitation).where(Invitation.organization_id == org.id,
        Invitation.email == customer.email, Invitation.purpose == "customer_manager",
        Invitation.status == "pending", Invitation.revoked_at.is_(None), Invitation.expires_at > utc_now())):
        pending.status = "revoked"
        pending.revoked_at = utc_now()
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="customer", entity_id=customer.id,
        action="invite_customer_manager", new_value="Admin resent company manager invitation", source="api"))
    result = issue_customer_manager(db, org, customer.email, current_user.id)
    response.headers["Cache-Control"] = "private, no-store"
    return {"status": result["status"], "email": customer.email, "duplicate": result.get("duplicate", False)}


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

