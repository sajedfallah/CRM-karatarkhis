from datetime import datetime
from sqlalchemy import DateTime,ForeignKey,Integer,JSON,String,Text,UniqueConstraint,func
from sqlalchemy.orm import Mapped,mapped_column
from app.db.base import Base

class DraftProductReview(Base):
    __tablename__="draft_product_reviews"
    __table_args__=(UniqueConstraint("draft_id","product_revision",name="uq_draft_product_review_revision"),)
    id: Mapped[str]=mapped_column(String(64),primary_key=True)
    draft_id: Mapped[str]=mapped_column(ForeignKey("case_drafts.id",ondelete="RESTRICT"),index=True)
    product_revision: Mapped[int]=mapped_column(Integer)
    draft_version: Mapped[int]=mapped_column(Integer)
    source_fingerprint: Mapped[str]=mapped_column(String(64))
    snapshot: Mapped[dict]=mapped_column(JSON)
    reviewed_by: Mapped[str]=mapped_column(ForeignKey("users.id",ondelete="RESTRICT"))
    reason: Mapped[str]=mapped_column(Text)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())

