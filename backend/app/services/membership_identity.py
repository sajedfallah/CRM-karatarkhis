"""Immutable request identity. Never mutate the ORM user's role during org selection."""
from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import Customer, Organization, OrganizationMembership, User


@dataclass(frozen=True)
class MembershipIdentity:
    user: User
    membership_id: str
    organization_id: str
    scope_type: str
    role: str
    permission_profile: str
    customer_id: str | None

    def __getattr__(self, name):
        return getattr(self.user, name)


def resolve_membership(db: Session, user: User, *, membership_id: str | None = None,
                       organization_id: str | None = None) -> MembershipIdentity:
    query = select(OrganizationMembership).where(OrganizationMembership.user_id == user.id,
        OrganizationMembership.deactivated_at.is_(None))
    if membership_id:
        query = query.where(OrganizationMembership.id == membership_id)
    if organization_id:
        query = query.where(OrganizationMembership.organization_id == organization_id)
    candidates = []
    for membership in db.scalars(query):
        if membership.status.upper() != "ACTIVE":
            continue
        organization = db.get(Organization, membership.organization_id)
        if not organization or organization.status.lower() != "active":
            continue
        if membership.scope_type not in {"ORGANIZATION", "SELECTED_CASES"}:
            continue
        if membership.permission_profile not in {"محدود", "عملیاتی", "مدیریتی", "پیشرفته"}:
            continue
        if organization.type == "INTERNAL":
            if organization.customer_id or membership.role not in {"admin", "internal_employee"}:
                continue
            if membership.role == "admin" and membership.scope_type != "ORGANIZATION":
                continue
            customer_id = None
        elif organization.type == "CUSTOMER":
            customer = db.get(Customer, organization.customer_id) if organization.customer_id else None
            if not customer or not customer.is_active or membership.role not in {"customer_manager", "customer_employee"}:
                continue
            customer_id = customer.id
        else:
            continue
        candidates.append(MembershipIdentity(user, membership.id, organization.id, membership.scope_type,
            membership.role, membership.permission_profile, customer_id))
    if not candidates:
        raise HTTPException(403, "no_active_membership")
    if len(candidates) != 1:
        raise HTTPException(409, "organization_selection_required")
    return candidates[0]
