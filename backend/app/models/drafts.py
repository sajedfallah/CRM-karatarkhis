from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class CaseDraft(Base):
    __tablename__ = "case_drafts"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), index=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    product_revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DraftCorporateDocumentLink(Base):
    __tablename__ = "draft_corporate_document_links"
    __table_args__ = (UniqueConstraint("draft_id", "document_version_id", name="uq_draft_document_version"),)
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    draft_id: Mapped[str] = mapped_column(ForeignKey("case_drafts.id", ondelete="RESTRICT"), index=True)
    document_version_id: Mapped[str] = mapped_column(ForeignKey("corporate_document_versions.id", ondelete="RESTRICT"), index=True)
    added_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    removed_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

