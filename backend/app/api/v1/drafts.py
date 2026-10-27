from decimal import Decimal
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select, update, func
from sqlalchemy.exc import IntegrityError
from app.api.deps import CurrentUser, DbSession
from app.api.v1.customers import _require_admin
from app.models.core import AuditLog, Customer
from app.models.drafts import CaseDraft

router = APIRouter(prefix="/case-drafts", tags=["case drafts"])


class DraftContent(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(default="", max_length=200)
    operation_type: Literal["import", "export", "transit"] | None = None
    customs: str = Field(default="", max_length=64)
    product_description: str = Field(default="", max_length=2000)
    shipment_reference: str = Field(default="", max_length=128)
    quantity: int | None = Field(default=None, ge=1, le=1_000_000_000)
    net_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)
    gross_weight: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=3)

    @model_validator(mode="after")
    def weights(self):
        if self.net_weight is not None and self.gross_weight is not None and self.gross_weight < self.net_weight:
            raise ValueError("gross_weight_must_not_be_less_than_net")
        return self


class DraftCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: UUID
    customer_id: str = Field(min_length=1, max_length=32)


class DraftSave(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_version: int = Field(ge=1)
    content: DraftContent


def read_draft(db, row):
    return {"id": row.id, "customer_id": row.customer_id, "customer_name": db.get(Customer, row.customer_id).name,
        "content": row.content, "version": row.version, "created_at": row.created_at, "updated_at": row.updated_at,
        "status": "DRAFT"}


def require_customer(db, customer_id):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "customer_not_found")
    if not customer.is_active:
        raise HTTPException(409, "inactive_customer")


@router.get("")
def list_drafts(db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    response.headers["Cache-Control"] = "private, no-store"
    return [read_draft(db, row) for row in db.scalars(select(CaseDraft).order_by(CaseDraft.updated_at.desc()))]


@router.post("", status_code=201)
def create_draft(payload: DraftCreate, db: DbSession, user: CurrentUser):
    _require_admin(user)
    require_customer(db, payload.customer_id)
    draft_id = "DRAFT-"+payload.request_id.hex
    existing = db.get(CaseDraft, draft_id)
    if existing:
        if existing.customer_id != payload.customer_id:
            raise HTTPException(409, "request_id_conflict")
        return read_draft(db, existing)
    row = CaseDraft(id=draft_id, customer_id=payload.customer_id, created_by=user.id,
        content=DraftContent().model_dump(mode="json"), version=1)
    db.add(row)
    db.add(AuditLog(actor_user_id=user.id, entity_type="case_draft", entity_id=draft_id, action="create", source="api"))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.get(CaseDraft, draft_id)
        if existing and existing.customer_id == payload.customer_id:
            return read_draft(db, existing)
        raise HTTPException(409, "request_id_conflict") from None
    return read_draft(db, row)


@router.get("/{draft_id}")
def get_draft(draft_id: str, db: DbSession, user: CurrentUser, response: Response):
    _require_admin(user)
    row = db.get(CaseDraft, draft_id)
    if not row:
        raise HTTPException(404, "draft_not_found")
    response.headers["Cache-Control"] = "private, no-store"
    return read_draft(db, row)


@router.put("/{draft_id}")
def save_draft(draft_id: str, payload: DraftSave, db: DbSession, user: CurrentUser):
    _require_admin(user)
    row = db.get(CaseDraft, draft_id)
    if not row:
        raise HTTPException(404, "draft_not_found")
    require_customer(db, row.customer_id)
    actor = user.id
    content = payload.content.model_dump(mode="json")
    result = db.execute(update(CaseDraft).where(CaseDraft.id == draft_id, CaseDraft.version == payload.expected_version)
        .values(content=content, version=payload.expected_version+1, updated_at=func.now())
        .execution_options(synchronize_session=False))
    if result.rowcount != 1:
        db.rollback()
        current = db.get(CaseDraft, draft_id)
        if current and current.version == payload.expected_version+1 and current.content == content:
            return read_draft(db, current)
        raise HTTPException(409, "draft_changed_reload_required")
    db.add(AuditLog(actor_user_id=actor, entity_type="case_draft", entity_id=draft_id, action="save",
        new_value=f"version={payload.expected_version+1}", source="api"))
    db.commit()
    db.expire_all()
    return read_draft(db, db.get(CaseDraft, draft_id))
