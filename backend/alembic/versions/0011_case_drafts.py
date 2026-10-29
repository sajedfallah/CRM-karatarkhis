"""Resumable case drafts with optimistic versioning."""
from alembic import op
import sqlalchemy as sa

revision = "0011_case_drafts"
down_revision = "0010_customer_documents"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("case_drafts",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_by", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_case_drafts_customer_id", "case_drafts", ["customer_id"])


def downgrade():
    op.drop_table("case_drafts")
