from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Case, Customer, Task, TaskMessage, User
from app.schemas.tasks import TaskCreate, TaskMessageCreate, TaskMessageRead, TaskRead, TaskUpdate
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_or_404(db: DbSession, task_id: str) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task_not_found")
    return task


def _require_task_action(db: DbSession, current_user: User, task: Task, action: Action) -> None:
    try:
        AuthorizationService(db).require_task_action(current_user, task, action)
    except AuthorizationDenied:
        if action == Action.VIEW:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task_not_found") from None
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="action_not_allowed") from None


def _validate_assignee(db: DbSession, user_id: str | None, customer_id: str | None) -> User | None:
    if user_id is None:
        return None
    assignee = db.get(User, user_id)
    if assignee is None or not assignee.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_assignee")
    if assignee.role in {"customer_manager", "customer_employee"} and assignee.customer_id != customer_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="assignee_customer_mismatch")
    return assignee


def _resolve_relation(db: DbSession, payload: TaskCreate) -> tuple[str | None, str | None, str | None]:
    relation_type = payload.relation_type.strip().lower()
    if relation_type == "case":
        if not payload.case_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="case_id_required")
        case = db.get(Case, payload.case_id)
        if case is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_case")
        return case.customer_id, case.id, case.id

    if relation_type == "customer":
        if not payload.customer_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_id_required")
        customer = db.get(Customer, payload.customer_id)
        if customer is None or not customer.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_customer")
        return customer.id, None, customer.id

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_relation_type")


@router.get("", response_model=list[TaskRead])
def list_tasks(db: DbSession, current_user: CurrentUser) -> list[Task]:
    tasks = list(db.scalars(select(Task).order_by(Task.updated_at.desc())))
    if current_user.role == "admin":
        return tasks

    auth = AuthorizationService(db)
    visible: list[Task] = []
    for task in tasks:
        try:
            auth.require_task_action(current_user, task, Action.VIEW)
            visible.append(task)
        except AuthorizationDenied:
            continue
    return visible


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: DbSession, current_user: CurrentUser) -> Task:
    customer_id, case_id, related_id = _resolve_relation(db, payload)
    auth = AuthorizationService(db)
    try:
        auth.require_create_task(current_user, customer_id)
    except AuthorizationDenied:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="action_not_allowed") from None

    assignee = _validate_assignee(db, payload.assignee_user_id, customer_id)
    task = Task(
        id=f"KRT-{uuid4().hex[:8].upper()}",
        relation_type="Case" if case_id else "Customer",
        related_id=related_id,
        customer_id=customer_id,
        case_id=case_id,
        title=payload.title,
        category=payload.category,
        created_by=current_user.id,
        assignee_user_id=assignee.id if assignee else current_user.id,
        priority=payload.priority,
        status=payload.status,
        due_at=payload.due_at,
        needs_manager=payload.needs_manager,
        result=payload.result,
        next_action=payload.next_action,
        notes=payload.notes,
    )

    if task.assignee_user_id != current_user.id:
        try:
            auth.require_task_action(current_user, task, Action.ASSIGN)
        except AuthorizationDenied:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="assignment_not_allowed") from None

    db.add(task)
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="task",
            entity_id=task.id,
            action="create",
            new_value=f"relation={task.relation_type};assignee={task.assignee_user_id};status={task.status}",
            source="api",
        )
    )
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: str, db: DbSession, current_user: CurrentUser) -> Task:
    task = _task_or_404(db, task_id)
    _require_task_action(db, current_user, task, Action.VIEW)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: str, payload: TaskUpdate, db: DbSession, current_user: CurrentUser) -> Task:
    task = _task_or_404(db, task_id)
    _require_task_action(db, current_user, task, Action.EDIT)

    changes = payload.model_dump(exclude_unset=True)
    if "assignee_user_id" in changes and changes["assignee_user_id"] != task.assignee_user_id:
        _require_task_action(db, current_user, task, Action.ASSIGN)
        _validate_assignee(db, changes["assignee_user_id"], task.customer_id)

    audits: list[AuditLog] = []
    for field_name, value in changes.items():
        old_value = getattr(task, field_name)
        if old_value == value:
            continue
        setattr(task, field_name, value)
        audits.append(
            AuditLog(
                actor_user_id=current_user.id,
                entity_type="task",
                entity_id=task.id,
                action="update",
                field_name=field_name,
                old_value=None if old_value is None else str(old_value),
                new_value=None if value is None else str(value),
                source="api",
            )
        )

    if audits:
        task.updated_at = datetime.now(timezone.utc)
        db.add_all(audits)
        db.commit()
        db.refresh(task)
    return task


@router.get("/{task_id}/messages", response_model=list[TaskMessageRead])
def list_task_messages(task_id: str, db: DbSession, current_user: CurrentUser) -> list[TaskMessage]:
    task = _task_or_404(db, task_id)
    _require_task_action(db, current_user, task, Action.VIEW)
    statement = select(TaskMessage).where(TaskMessage.task_id == task.id).order_by(TaskMessage.created_at.asc())
    return list(db.scalars(statement))


@router.post("/{task_id}/messages", response_model=TaskMessageRead, status_code=status.HTTP_201_CREATED)
def create_task_message(
    task_id: str,
    payload: TaskMessageCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskMessage:
    task = _task_or_404(db, task_id)
    _require_task_action(db, current_user, task, Action.EDIT)

    message = TaskMessage(
        task_id=task.id,
        sender_user_id=current_user.id,
        body=payload.body,
        source="api",
    )
    task.updated_at = datetime.now(timezone.utc)
    db.add(message)
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="task_message",
            entity_id=task.id,
            action="create",
            new_value="message_added",
            source="api",
        )
    )
    db.commit()
    db.refresh(message)
    return message
