from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import AuditLog, Case, Customer, Document, User
from app.schemas.documents import DocumentApproval, DocumentCreate, DocumentRead, DocumentUpdate
from app.services.authorization import Action, AuthorizationDenied, AuthorizationService

router = APIRouter(prefix="/documents", tags=["documents"])


def _document_or_404(db: DbSession, document_id: str) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="document_not_found")
    return document


def _require_document_action(db: DbSession, current_user: User, document: Document, action: Action) -> None:
    auth = AuthorizationService(db)
    try:
        if document.case_id:
            case = db.get(Case, document.case_id)
            if case is None:
                raise AuthorizationDenied("case_not_found")
            auth.require_case_action(current_user, case, action)
        else:
            auth.require_customer_action(current_user, document.customer_id, action)
    except AuthorizationDenied:
        if action == Action.VIEW:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="document_not_found") from None
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="action_not_allowed") from None


@router.get("", response_model=list[DocumentRead])
def list_documents(db: DbSession, current_user: CurrentUser) -> list[Document]:
    documents = list(db.scalars(select(Document).order_by(Document.updated_at.desc())))
    if current_user.role == "admin":
        return documents

    visible: list[Document] = []
    for document in documents:
        try:
            _require_document_action(db, current_user, document, Action.VIEW)
            visible.append(document)
        except HTTPException:
            continue
    return visible


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate, db: DbSession, current_user: CurrentUser) -> Document:
    customer = db.get(Customer, payload.customer_id)
    if customer is None or not customer.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_customer")

    auth = AuthorizationService(db)
    try:
        if payload.case_id:
            case = db.get(Case, payload.case_id)
            if case is None or case.customer_id != payload.customer_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_case")
            auth.require_case_action(current_user, case, Action.EDIT)
        else:
            auth.require_customer_action(current_user, payload.customer_id, Action.CREATE)
    except AuthorizationDenied:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="action_not_allowed") from None

    existing = db.scalar(select(Document.id).where(Document.drive_file_id == payload.drive_file_id))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="drive_file_already_registered")

    document = Document(
        id=f"DOC-{uuid4().hex[:16].upper()}",
        customer_id=payload.customer_id,
        case_id=payload.case_id,
        document_type=payload.document_type,
        title=payload.title,
        drive_file_id=payload.drive_file_id,
        drive_url=payload.drive_url,
        mime_type=payload.mime_type,
        version=payload.version,
        status=payload.status,
        uploaded_by=current_user.id,
        expires_at=payload.expires_at,
        notes=payload.notes,
    )
    db.add(document)
    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="document",
            entity_id=document.id,
            action="create",
            new_value=f"customer_id={document.customer_id};case_id={document.case_id};drive_file_id={document.drive_file_id}",
            source="api",
        )
    )
    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: str, db: DbSession, current_user: CurrentUser) -> Document:
    document = _document_or_404(db, document_id)
    _require_document_action(db, current_user, document, Action.VIEW)
    return document


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(document_id: str, payload: DocumentUpdate, db: DbSession, current_user: CurrentUser) -> Document:
    document = _document_or_404(db, document_id)
    _require_document_action(db, current_user, document, Action.EDIT)

    changes = payload.model_dump(exclude_unset=True)
    audits: list[AuditLog] = []
    for field_name, value in changes.items():
        old_value = getattr(document, field_name)
        if old_value == value:
            continue
        setattr(document, field_name, value)
        audits.append(
            AuditLog(
                actor_user_id=current_user.id,
                entity_type="document",
                entity_id=document.id,
                action="update",
                field_name=field_name,
                old_value=None if old_value is None else str(old_value),
                new_value=None if value is None else str(value),
                source="api",
            )
        )

    if audits:
        document.updated_at = datetime.now(timezone.utc)
        db.add_all(audits)
        db.commit()
        db.refresh(document)
    return document


@router.post("/{document_id}/approval", response_model=DocumentRead)
def approve_document(
    document_id: str,
    payload: DocumentApproval,
    db: DbSession,
    current_user: CurrentUser,
) -> Document:
    document = _document_or_404(db, document_id)
    _require_document_action(db, current_user, document, Action.APPROVE_DOCUMENTS)

    old_status = document.status
    document.status = "approved" if payload.approved else "rejected"
    document.approved_by = current_user.id if payload.approved else None
    document.approved_at = datetime.now(timezone.utc) if payload.approved else None
    if payload.notes is not None:
        document.notes = payload.notes
    document.updated_at = datetime.now(timezone.utc)

    db.add(
        AuditLog(
            actor_user_id=current_user.id,
            entity_type="document",
            entity_id=document.id,
            action="approve" if payload.approved else "reject",
            field_name="status",
            old_value=old_status,
            new_value=document.status,
            source="api",
        )
    )
    db.commit()
    db.refresh(document)
    return document
