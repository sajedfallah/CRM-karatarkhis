"""Internal-admin invitation for a narrow declaration reviewer, not full portal access."""
import re
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from app.api.deps import CurrentUser, DbSession
from app.api.v1.customers import _require_admin
from app.models.core import AuditLog, Customer, Invitation, Organization
from app.services.invitations import issue_customer_reviewer

router=APIRouter(tags=["customer reviewer enrollment"])

class InviteReviewer(BaseModel):
    model_config=ConfigDict(extra="forbid")
    email: str=Field(min_length=3,max_length=320)
    reason: str=Field(min_length=3,max_length=500)
    @field_validator("email")
    @classmethod
    def email_format(cls,value):
        value=value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+",value): raise ValueError("invalid_email")
        return value
    @field_validator("reason")
    @classmethod
    def reason_required(cls,value):
        if len(value.strip())<3: raise ValueError("reason_required")
        return value.strip()


def customer(db,customer_id,lock=False):
    query=select(Customer).where(Customer.id==customer_id)
    row=db.scalar(query.with_for_update() if lock else query)
    if not row: raise HTTPException(404,"customer_not_found")
    if not row.is_active: raise HTTPException(409,"inactive_customer")
    return row


@router.get("/customers/{customer_id}/reviewer-invitations")
def invitations(customer_id: str,db: DbSession,user: CurrentUser,response: Response):
    _require_admin(user)
    customer(db,customer_id)
    response.headers["Cache-Control"]="private, no-store"
    org=db.scalar(select(Organization).where(Organization.customer_id==customer_id))
    if not org:return []
    return [{"id":row.id,"email":row.email,"purpose":row.purpose,"status":row.status,"expires_at":row.expires_at} for row in db.scalars(select(Invitation).where(Invitation.organization_id==org.id).order_by(Invitation.expires_at.desc()))]


@router.post("/customers/{customer_id}/reviewer-invitations",status_code=202)
def invite(customer_id: str,payload: InviteReviewer,db: DbSession,user: CurrentUser,response: Response):
    _require_admin(user)
    row=customer(db,customer_id,lock=True)
    org=db.scalar(select(Organization).where(Organization.customer_id==row.id))
    if not org:
        org=Organization(id="ORG-"+uuid4().hex,type="CUSTOMER",customer_id=row.id,
            name=row.name,slug="customer-"+uuid4().hex,status="active")
        db.add(org);db.flush()
    db.add(AuditLog(actor_user_id=user.id,entity_type="customer",entity_id=row.id,
        action="invite_declaration_reviewer",new_value=payload.reason,source="api"))
    response.headers["Cache-Control"]="private, no-store"
    return issue_customer_reviewer(db,org,payload.email,user.id)

