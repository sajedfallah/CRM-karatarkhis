from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DraftCustomerReview(Base):
    """Immutable customer-facing copy of one draft version and its one decision."""

    __tablename__ = "draft_customer_reviews"
    __table_args__ = (UniqueConstraint("draft_id", "draft_version", name="uq_draft_customer_review_version"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    draft_id: Mapped[str] = mapped_column(ForeignKey("case_drafts.id", ondelete="RESTRICT"), index=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customers.id", ondelete="RESTRICT"), index=True)
    recipient_membership_id: Mapped[str] = mapped_column(ForeignKey("organization_memberships.id", ondelete="RESTRICT"), index=True)
    draft_version: Mapped[int] = mapped_column(Integer, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    confirmation_text_version: Mapped[str] = mapped_column(String(32), nullable=False, default="case-draft-review-v1")
    requested_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decision: Mapped[str | None] = mapped_column(String(32))
    decision_comment: Mapped[str | None] = mapped_column(Text)
    decided_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
