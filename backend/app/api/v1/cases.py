from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Case, CaseAssignment, Customer, User
from app.models.case_registration_request import CaseRegistrationRequest
from app.models.declarations import DeclarationDecision, DeclarationRequest, DeclarationVersion
from app.schemas.cases import AssignmentCreate, AssignmentRead, CaseCreate, CaseRead, CaseUpdate
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService

router = APIRouter(prefix="/cases", tags=["cases"])


class QuotaNumber(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    number: str = Field(min_length=1, max_length=128)

_ALLOWED_ASSIGNMENT_TYPES = {
    "مسئول داخلی اصلی",
    "همکار داخلی",
    "مسئول سمت مشتری",
    "همکار سمت مشتری",
    "ناظر",
}


def _case_or_404(db: DbSession, case_id: str) -> Case:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case_not_found")
    return case


def _require_case_action(db: DbSession, current_user: User, case: Case, action: Action) -> None:
    try:
        AuthorizationService(db).require_case_action(current_user, case, action)
    except AuthorizationDenied:
        if action == Action.VIEW:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case_not_found") from None
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="action_not_allowed") from None


@router.get("", response_model=list[CaseRead])
def list_cases(db: DbSession, current_user: CurrentUser) -> list[Case]:
    if current_user.role == "admin":
        return list(db.scalars(select(Case).join(CaseRegistrationRequest,
            CaseRegistrationRequest.registered_case_id == Case.id).where(
                CaseRegistrationRequest.status == "REGISTERED").order_by(Case.created_at.desc())))
    cases = list(db.scalars(select(Case).order_by(Case.created_at.desc())))

    authorized: list[Case] = []
    auth = AuthorizationService(db)
    for case in cases:
        try:
            auth.require_case_action(current_user, case, Action.VIEW)
            authorized.append(case)
        except AuthorizationDenied:
            continue
    return authorized


@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: DbSession, current_user: CurrentUser) -> Case:
    customer = db.get(Customer, payload.customer_id)
    if customer is None or not customer.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_customer")

    try:
        AuthorizationService(db).require_create_case(current_user, payload.customer_id)
    except AuthorizationDenied:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="action_not_allowed") from None

    case = Case(
        id=f"CASE-{uuid4().hex[:20].upper()}",
        customer_id=payload.customer_id,
        real_case_number=payload.real_case_number,
        operation_type=payload.operation_type,
        customs=payload.customs,
        status=payload.status,
        sync_version=0,
        sync_source="api",
        sync_updated_at=datetime.now(timezone.utc),
        created_by=current_user.id,
    )
    db.add(case)
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="case",
            entity_id=case.id,
            action="create",
            new_value=f"customer_id={case.customer_id};status={case.status}",
            source="api",
        )
    )
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseRead)
def get_case(case_id: str, db: DbSession, current_user: CurrentUser) -> Case:
    case = _case_or_404(db, case_id)
    _require_case_action(db, current_user, case, Action.VIEW)
    return case


@router.post("/{case_id}/customs-quota-number")
def record_customs_quota_number(case_id: str, payload: QuotaNumber, db: DbSession, current_user: CurrentUser):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="admin_required")
    case = db.scalar(select(Case).where(Case.id == case_id).with_for_update())
    if not case:
        raise HTTPException(status_code=404, detail="case_not_found")
    if case.operation_type not in {"import", "export"}:
        raise HTTPException(status_code=409, detail="import_or_export_case_required")
    version = db.scalar(select(DeclarationVersion).where(DeclarationVersion.case_id == case_id)
        .order_by(DeclarationVersion.version.desc()).limit(1))
    sent = db.scalar(select(DeclarationRequest).where(DeclarationRequest.version_id == version.id)) if version else None
    decision = db.scalar(select(DeclarationDecision).where(DeclarationDecision.request_id == sent.id)) if sent else None
    if not decision or decision.decision != "approved":
        raise HTTPException(status_code=409, detail="customer_declaration_confirmation_required")
    if case.customs_quota_number and case.customs_quota_number != payload.number:
        raise HTTPException(status_code=409, detail="customs_quota_number_already_recorded")
    case.customs_quota_number = payload.number
    case.status = "فعال"
    case.sync_version += 1
    case.sync_source = "api"
    case.sync_updated_at = datetime.now(timezone.utc)
    db.add(AuditLog(actor_user_id=current_user.id, entity_type="case", entity_id=case.id,
        action="record_customs_quota_number", new_value=payload.number, source="api"))
    registration = db.scalar(select(CaseRegistrationRequest).where(CaseRegistrationRequest.registered_case_id == case.id).with_for_update())
    if registration:
        registration.status = "ACTIVE"
        registration.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)
    return CaseRead.model_validate(case)


@router.patch("/{case_id}", response_model=CaseRead)
def update_case(case_id: str, payload: CaseUpdate, db: DbSession, current_user: CurrentUser) -> Case:
    case = _case_or_404(db, case_id)
    _require_case_action(db, current_user, case, Action.EDIT)

    changes = payload.model_dump(exclude_unset=True)
    if changes.get("status") == "فعال" and case.operation_type in {"import", "export"} and not case.customs_quota_number:
        raise HTTPException(status_code=409, detail="customs_quota_number_required_to_activate_case")
    if not changes:
        return case

    audit_entries: list[AuditLog] = []
    for field_name, value in changes.items():
        old_value = getattr(case, field_name)
        if old_value == value:
            continue
        setattr(case, field_name, value)
        audit_entries.append(
            AuditLog(
                actor_user_id=current_user.id,
                entity_type="case",
                entity_id=case.id,
                action="update",
                field_name=field_name,
                old_value=None if old_value is None else str(old_value),
                new_value=None if value is None else str(value),
                source="api",
            )
        )

    if audit_entries:
        case.sync_version += 1
        case.sync_source = "api"
        case.sync_updated_at = datetime.now(timezone.utc)
        db.add_all(audit_entries)
        db.commit()
        db.refresh(case)
    return case


@router.get("/{case_id}/assignments", response_model=list[AssignmentRead])
def list_case_assignments(case_id: str, db: DbSession, current_user: CurrentUser) -> list[CaseAssignment]:
    case = _case_or_404(db, case_id)
    _require_case_action(db, current_user, case, Action.VIEW)
    statement = select(CaseAssignment).where(CaseAssignment.case_id == case_id).order_by(CaseAssignment.assigned_at.desc())
    return list(db.scalars(statement))


@router.post("/{case_id}/assignments", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
def create_case_assignment(
    case_id: str,
    payload: AssignmentCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> CaseAssignment:
    case = _case_or_404(db, case_id)
    _require_case_action(db, current_user, case, Action.ASSIGN)

    if payload.assignment_type not in _ALLOWED_ASSIGNMENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_assignment_type")

    effective_primary = payload.assignment_type == "مسئول داخلی اصلی"
    if payload.is_primary != effective_primary:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_primary_flag")

    assignee = db.get(User, payload.user_id)
    if assignee is None or not assignee.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_assignee")

    if assignee.role in {"customer_manager", "customer_employee"} and assignee.customer_id != case.customer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="assignee_customer_mismatch")

    if payload.assignment_type == "مسئول داخلی اصلی":
        if assignee.role != "internal_employee":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="primary_internal_requires_internal_employee")
        existing_primary = db.scalar(
            select(CaseAssignment.id).where(
                CaseAssignment.case_id == case.id,
                CaseAssignment.assignment_type == "مسئول داخلی اصلی",
                CaseAssignment.is_primary.is_(True),
                CaseAssignment.is_active.is_(True),
            )
        )
        if existing_primary is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="active_primary_internal_exists")

    duplicate = db.scalar(
        select(CaseAssignment.id).where(
            CaseAssignment.case_id == case.id,
            CaseAssignment.user_id == assignee.id,
            CaseAssignment.assignment_type == payload.assignment_type,
            CaseAssignment.is_active.is_(True),
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="active_assignment_exists")

    assignment = CaseAssignment(
        id=f"ASG-{uuid4().hex[:20].upper()}",
        case_id=case.id,
        user_id=assignee.id,
        customer_id=assignee.customer_id,
        assignment_type=payload.assignment_type,
        is_primary=effective_primary,
        is_active=True,
        assigned_by=current_user.id,
    )
    db.add(assignment)
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="case_assignment",
            entity_id=assignment.id,
            action="create",
            new_value=f"case_id={case.id};user_id={assignee.id};type={payload.assignment_type}",
            source="api",
        )
    )
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{case_id}/assignments/{assignment_id}", response_model=AssignmentRead)
def end_case_assignment(
    case_id: str,
    assignment_id: str,
    db: DbSession,
    current_user: CurrentUser,
) -> CaseAssignment:
    case = _case_or_404(db, case_id)
    _require_case_action(db, current_user, case, Action.ASSIGN)

    assignment = db.get(CaseAssignment, assignment_id)
    if assignment is None or assignment.case_id != case_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="assignment_not_found")
    if not assignment.is_active:
        return assignment

    assignment.is_active = False
    assignment.ended_at = datetime.now(timezone.utc)
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="case_assignment",
            entity_id=assignment.id,
            action="end",
            old_value="active",
            new_value="ended",
            source="api",
        )
    )
    db.commit()
    db.refresh(assignment)
    return assignment

