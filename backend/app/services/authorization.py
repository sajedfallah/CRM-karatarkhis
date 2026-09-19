from dataclasses import dataclass
from enum import Enum

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import Case, CaseAssignment, Permission, Task, User


class Action(str, Enum):
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    ASSIGN = "assign"
    APPROVE_DOCUMENTS = "approve_documents"
    FINANCE = "finance"


class AuthorizationDenied(PermissionError):
    pass


@dataclass(frozen=True)
class AuthorizationContext:
    user: User
    case: Case | None = None


_PERMISSION_FIELD = {
    Action.VIEW: "can_view",
    Action.CREATE: "can_create",
    Action.EDIT: "can_edit",
    Action.ASSIGN: "can_assign",
    Action.APPROVE_DOCUMENTS: "can_approve_documents",
    Action.FINANCE: "can_finance",
}


class AuthorizationService:
    """Server-side authorization boundary for tenant and assignment scopes."""

    def __init__(self, db: Session):
        self.db = db

    def require_create_case(self, user: User, customer_id: str) -> None:
        self._require_create_for_customer(user, customer_id)

    def require_create_task(self, user: User, customer_id: str | None) -> None:
        self._require_create_for_customer(user, customer_id)

    def require_customer_action(self, user: User, customer_id: str, action: Action) -> None:
        if not user.is_active:
            raise AuthorizationDenied("inactive_user")
        if user.role == "admin":
            return
        if user.role in {"customer_manager", "customer_employee"}:
            if not user.customer_id or user.customer_id != customer_id:
                raise AuthorizationDenied("customer_boundary_violation")

        matching = [
            p for p in self._active_permissions(user)
            if getattr(p, _PERMISSION_FIELD[action]) and p.scope_type in {"GLOBAL", "CUSTOMER", "ASSIGNED"}
        ]
        if not matching:
            raise AuthorizationDenied(f"action_not_allowed:{action.value}")

        if any(p.scope_type in {"GLOBAL", "CUSTOMER"} for p in matching):
            return

        if action in {Action.VIEW, Action.EDIT, Action.APPROVE_DOCUMENTS}:
            if self._has_any_active_assignment_for_customer(user.id, customer_id):
                return
        raise AuthorizationDenied(f"action_not_allowed:{action.value}")

    def _require_create_for_customer(self, user: User, customer_id: str | None) -> None:
        if not user.is_active:
            raise AuthorizationDenied("inactive_user")
        if user.role == "admin":
            return
        if user.role in {"customer_manager", "customer_employee"}:
            if not customer_id or not user.customer_id or user.customer_id != customer_id:
                raise AuthorizationDenied("customer_boundary_violation")
        permissions = self._active_permissions(user)
        if not any(permission.can_create for permission in permissions):
            raise AuthorizationDenied("action_not_allowed:create")

    def require_case_action(self, user: User, case: Case, action: Action) -> None:
        if not user.is_active:
            raise AuthorizationDenied("inactive_user")
        if user.role == "admin":
            return

        self._enforce_customer_boundary(user, case)
        permissions = self._active_permissions(user)
        if not permissions:
            raise AuthorizationDenied("no_active_permission")
        if not any(self._scope_matches_case(p, user, case) and getattr(p, _PERMISSION_FIELD[action]) for p in permissions):
            raise AuthorizationDenied(f"action_not_allowed:{action.value}")

        matching = [p for p in permissions if self._scope_matches_case(p, user, case) and getattr(p, _PERMISSION_FIELD[action])]
        if any(p.scope_type == "ASSIGNED" for p in matching) and not any(p.scope_type in {"CUSTOMER", "GLOBAL"} for p in matching):
            if not self._has_active_assignment(user.id, case.id):
                raise AuthorizationDenied("case_not_assigned")

    def require_task_action(self, user: User, task: Task, action: Action) -> None:
        if not user.is_active:
            raise AuthorizationDenied("inactive_user")
        if user.role == "admin":
            return

        if user.role in {"customer_manager", "customer_employee"}:
            if not user.customer_id or user.customer_id != task.customer_id:
                raise AuthorizationDenied("customer_boundary_violation")

        permissions = self._active_permissions(user)
        matching = [p for p in permissions if getattr(p, _PERMISSION_FIELD[action])]
        if not matching:
            raise AuthorizationDenied(f"action_not_allowed:{action.value}")

        if any(p.scope_type in {"GLOBAL", "CUSTOMER"} for p in matching):
            return

        if any(p.scope_type == "ASSIGNED" for p in matching):
            if task.assignee_user_id == user.id:
                return
            if task.case_id and self._has_active_assignment(user.id, task.case_id):
                return
            raise AuthorizationDenied("task_not_assigned")

        raise AuthorizationDenied(f"action_not_allowed:{action.value}")

    def _enforce_customer_boundary(self, user: User, case: Case) -> None:
        if user.role in {"customer_manager", "customer_employee"}:
            if not user.customer_id or user.customer_id != case.customer_id:
                raise AuthorizationDenied("customer_boundary_violation")

    def _active_permissions(self, user: User) -> list[Permission]:
        statement = select(Permission).where(
            Permission.is_active.is_(True),
            (Permission.user_id == user.id)
            | (
                (Permission.user_id.is_(None))
                & (Permission.role == user.role)
                & (Permission.profile == user.permission_profile)
            ),
        )
        return list(self.db.scalars(statement))

    @staticmethod
    def _scope_matches_case(permission: Permission, user: User, case: Case) -> bool:
        if permission.scope_type == "GLOBAL":
            return True
        if permission.scope_type == "CUSTOMER":
            return bool(user.customer_id and user.customer_id == case.customer_id)
        if permission.scope_type == "ASSIGNED":
            return True
        return False

    def _has_active_assignment(self, user_id: str, case_id: str) -> bool:
        statement = select(CaseAssignment.id).where(
            CaseAssignment.user_id == user_id,
            CaseAssignment.case_id == case_id,
            CaseAssignment.is_active.is_(True),
        )
        return self.db.scalar(statement) is not None

    def _has_any_active_assignment_for_customer(self, user_id: str, customer_id: str) -> bool:
        statement = (
            select(CaseAssignment.id)
            .join(Case, Case.id == CaseAssignment.case_id)
            .where(
                CaseAssignment.user_id == user_id,
                CaseAssignment.is_active.is_(True),
                Case.customer_id == customer_id,
            )
        )
        return self.db.scalar(statement) is not None
