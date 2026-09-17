from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import Case, CaseAssignment
from app.schemas.cases import AssignmentRead, CaseRead
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("/{case_id}", response_model=CaseRead)
def get_case(case_id: str, db: DbSession, current_user: CurrentUser) -> Case:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case_not_found")

    try:
        AuthorizationService(db).require_case_action(current_user, case, Action.VIEW)
    except AuthorizationDenied:
        # Do not reveal whether another tenant's case exists.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case_not_found") from None
    return case


@router.get("/{case_id}/assignments", response_model=list[AssignmentRead])
def list_case_assignments(case_id: str, db: DbSession, current_user: CurrentUser) -> list[CaseAssignment]:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case_not_found")

    try:
        AuthorizationService(db).require_case_action(current_user, case, Action.VIEW)
    except AuthorizationDenied:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="case_not_found") from None

    statement = select(CaseAssignment).where(CaseAssignment.case_id == case_id, CaseAssignment.is_active.is_(True))
    return list(db.scalars(statement))
