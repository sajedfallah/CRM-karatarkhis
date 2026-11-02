import json
import re
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Case, CaseAccessGrant, Customer, Invitation, Organization, OrganizationMembership, Permission, User
from app.services.authentication import utc_now
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService
from app.services.invitations import issue_customer_employee

router = APIRouter(prefix="/organizations", tags=["organizations"])
PROFILE_RANK = {"محدود":0, "عملیاتی":1, "مدیریتی":2, "پیشرفته":3}


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=128, pattern=r"^[a-z0-9-]+$")
    type: Literal["INTERNAL", "CUSTOMER"]
    customer_id: str | None = Field(default=None, max_length=32)
    reason: str = Field(min_length=3, max_length=500)


class MembershipWrite(BaseModel):
    role: Literal["admin", "internal_employee", "customer_manager", "customer_employee"]
    permission_profile: Literal["محدود", "عملیاتی", "مدیریتی", "پیشرفته"] = "محدود"
    scope_type: Literal["ORGANIZATION", "SELECTED_CASES"] = "ORGANIZATION"
    case_ids: list[str] = Field(default_factory=list, max_length=200)
    access_level: Literal["view", "edit"] = "view"
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"
    reason: str = Field(min_length=3, max_length=500)


class MembershipCreate(MembershipWrite):
    user_id: str = Field(min_length=1, max_length=64)


class EmployeeInvitation(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    email: str = Field(min_length=5, max_length=320)
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        value=value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+",value):
            raise ValueError("invalid_email")
        return value


def _org(db, organization_id):
    organization = db.get(Organization, organization_id)
    if not organization:
        raise HTTPException(404, "organization_not_found")
    return organization


def _manage(db, actor, organization):
    if actor.role == "admin":
        return
    if actor.role != "customer_manager" or getattr(actor, "organization_id", None) != organization.id:
        raise HTTPException(403, "organization_management_denied")
    if not any(p.can_assign for p in AuthorizationService(db).effective_permissions(actor)):
        raise HTTPException(403, "organization_management_denied")


def _membership_dict(db, row):
    user = db.get(User, row.user_id)
    return {key:getattr(row,key) for key in ("id","organization_id","user_id","role","permission_profile","scope_type","status")} | {
        "full_name": user.full_name if user else "",
        "email": user.email if user else None,
    }


def _audit(db, actor, entity, entity_id, action, payload):
    db.add(AuditLog(actor_user_id=actor.id, entity_type=entity, entity_id=entity_id,
        action=action, new_value=json.dumps(payload, ensure_ascii=False), source="organization_api"))


def _validate_membership(db, actor, organization, payload):
    roles = {"admin","internal_employee"} if organization.type == "INTERNAL" else {"customer_manager","customer_employee"}
    if payload.role not in roles or payload.role == "admin" and payload.scope_type != "ORGANIZATION":
        raise HTTPException(400, "role_organization_mismatch")
    if organization.type == "CUSTOMER" and not organization.customer_id:
        raise HTTPException(400, "customer_organization_not_linked")
    if actor.role != "admin":
        if payload.role != "customer_employee" or PROFILE_RANK[payload.permission_profile] > PROFILE_RANK.get(actor.permission_profile,0):
            raise HTTPException(403, "role_escalation_denied")
        if getattr(actor,"scope_type",None) == "SELECTED_CASES" and payload.scope_type != "SELECTED_CASES":
            raise HTTPException(403, "scope_escalation_denied")
    if payload.scope_type == "ORGANIZATION" and payload.case_ids:
        raise HTTPException(400, "unexpected_case_grants")
    if payload.scope_type == "SELECTED_CASES" and not payload.case_ids:
        raise HTTPException(400, "case_grants_required")
    for case_id in set(payload.case_ids):
        case = db.get(Case,case_id)
        if not case or organization.type == "CUSTOMER" and case.customer_id != organization.customer_id:
            raise HTTPException(400,"case_organization_mismatch")
        if actor.role != "admin":
            try:
                # A manager cannot delegate write access using a read-only case grant.
                AuthorizationService(db).require_case_action(actor,case,Action.ASSIGN)
                if payload.access_level == "edit":
                    AuthorizationService(db).require_case_action(actor,case,Action.EDIT)
            except AuthorizationDenied:
                raise HTTPException(403,"case_delegation_denied") from None


def _apply(db, actor, organization, member, payload):
    _validate_membership(db,actor,organization,payload)
    for key in ("role","permission_profile","scope_type","status"):
        setattr(member,key,getattr(payload,key))
    member.deactivated_at = utc_now() if payload.status == "INACTIVE" else None
    selected = set(payload.case_ids)
    grants = {row.case_id:row for row in db.scalars(select(CaseAccessGrant).where(CaseAccessGrant.membership_id == member.id))}
    for case_id,grant in grants.items():
        grant.revoked_at = None if case_id in selected else utc_now()
        if case_id in selected: grant.access_level=payload.access_level
    for case_id in selected - grants.keys():
        db.add(CaseAccessGrant(id="GRANT-"+uuid4().hex,membership_id=member.id,
            case_id=case_id,access_level=payload.access_level,granted_by=actor.id))
    # Permission rows remain the action boundary; membership adds a stricter scope.
    if payload.role != "admin" and payload.status == "ACTIVE":
        can_write=PROFILE_RANK[payload.permission_profile] >= 1
        db.add(Permission(id="PERM-"+uuid4().hex,user_id=member.user_id,role=payload.role,
            scope_type="CUSTOMER" if organization.type == "CUSTOMER" else "ASSIGNED",
            scope_id=organization.customer_id or "OWN_ASSIGNMENTS",profile=payload.permission_profile,
            can_view=True,can_create=can_write,can_edit=can_write,
            can_assign=payload.role == "customer_manager" and can_write))
    _audit(db,actor,"membership",member.id,"membership_scope_change",payload.model_dump())


@router.get("")
def organizations(db: DbSession, actor: CurrentUser):
    rows = list(db.scalars(select(Organization)))
    if actor.role != "admin":
        rows = [row for row in rows if row.id == getattr(actor,"organization_id",None)]
    return [{key:getattr(row,key) for key in ("id","name","slug","type","customer_id","status")} for row in rows]


@router.post("",status_code=201)
def create_organization(payload: OrganizationCreate, db: DbSession, actor: CurrentUser):
    if actor.role != "admin": raise HTTPException(403,"admin_required")
    if payload.type == "CUSTOMER":
        customer=db.get(Customer,payload.customer_id) if payload.customer_id else None
        if not customer or not customer.is_active: raise HTTPException(400,"invalid_customer")
    elif payload.customer_id:
        raise HTTPException(400,"internal_customer_link_not_allowed")
    if db.scalar(select(Organization.id).where(Organization.slug == payload.slug)):
        raise HTTPException(409,"organization_exists")
    if payload.customer_id and db.scalar(select(Organization.id).where(Organization.customer_id == payload.customer_id)):
        raise HTTPException(409,"customer_organization_exists")
    row=Organization(id="ORG-"+uuid4().hex,name=payload.name,slug=payload.slug,type=payload.type,customer_id=payload.customer_id)
    db.add(row);db.flush();_audit(db,actor,"organization",row.id,"create",{"reason":payload.reason})
    db.commit()
    return {"id":row.id}


@router.get("/{organization_id}/memberships")
def memberships(organization_id: str, db: DbSession, actor: CurrentUser):
    organization=_org(db,organization_id);_manage(db,actor,organization)
    return [_membership_dict(db,row) for row in db.scalars(select(OrganizationMembership).where(OrganizationMembership.organization_id == organization.id))]


@router.get("/{organization_id}/invitations")
def invitations(organization_id: str, db: DbSession, actor: CurrentUser):
    organization=_org(db,organization_id);_manage(db,actor,organization)
    if organization.type != "CUSTOMER":
        raise HTTPException(404,"customer_organization_required")
    return [{key:getattr(row,key) for key in ("id","email","role","purpose","status","expires_at")}
        for row in db.scalars(select(Invitation).where(Invitation.organization_id == organization.id,
            Invitation.purpose == "customer_employee")
            .order_by(Invitation.expires_at.desc()))]


@router.post("/{organization_id}/invitations", status_code=202)
def invite_employee(organization_id: str, payload: EmployeeInvitation, db: DbSession,
                    actor: CurrentUser):
    organization=_org(db,organization_id);_manage(db,actor,organization)
    if organization.type != "CUSTOMER":
        raise HTTPException(404,"customer_organization_required")
    _audit(db,actor,"organization",organization.id,"customer_employee_invitation",
        {"email":payload.email,"reason":payload.reason})
    result=issue_customer_employee(db,organization,payload.email,actor.id)
    db.commit()
    return {"id":result["id"],"status":result["status"],"email":payload.email,
        "duplicate":result.get("duplicate",False)}


@router.post("/{organization_id}/memberships",status_code=201)
def create_membership(organization_id: str, payload: MembershipCreate, db: DbSession, actor: CurrentUser):
    organization=_org(db,organization_id);_manage(db,actor,organization)
    if not db.get(User,payload.user_id): raise HTTPException(400,"user_not_found")
    if db.scalar(select(OrganizationMembership.id).where(OrganizationMembership.organization_id == organization.id,OrganizationMembership.user_id == payload.user_id)):
        raise HTTPException(409,"membership_exists")
    _validate_membership(db,actor,organization,payload)
    row=OrganizationMembership(id="MEM-"+uuid4().hex,organization_id=organization.id,user_id=payload.user_id,
        role=payload.role,permission_profile=payload.permission_profile,scope_type=payload.scope_type,status=payload.status,joined_at=utc_now())
    db.add(row);db.flush();_apply(db,actor,organization,row,payload);db.commit()
    return _membership_dict(db,row)


@router.patch("/{organization_id}/memberships/{membership_id}")
def update_membership(organization_id: str,membership_id: str,payload: MembershipWrite,db: DbSession,actor: CurrentUser):
    organization=_org(db,organization_id);_manage(db,actor,organization)
    member=db.get(OrganizationMembership,membership_id)
    if not member or member.organization_id != organization.id: raise HTTPException(404,"membership_not_found")
    if member.user_id == actor.id: raise HTTPException(409,"self_membership_change_denied")
    if actor.role != "admin" and member.role != "customer_employee": raise HTTPException(403,"role_escalation_denied")
    _apply(db,actor,organization,member,payload);db.commit()
    return _membership_dict(member)

