"""add document metadata

Revision ID: 0004_documents
Revises: 0003_tasks
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0004_documents"
down_revision: str | None = "0003_tasks"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("case_id", sa.String(64), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=True),
        sa.Column("document_type", sa.String(64), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("drive_file_id", sa.String(128), nullable=False, unique=True),
        sa.Column("drive_url", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.String(255), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(32), nullable=False, server_default="uploaded"),
        sa.Column("uploaded_by", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_by", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_documents_customer_id", "documents", ["customer_id"])
    op.create_index("ix_documents_case_id", "documents", ["case_id"])
    op.create_index("ix_documents_status", "documents", ["status"])
    op.create_index("ix_documents_expires_at", "documents", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_documents_expires_at", table_name="documents")
    op.drop_index("ix_documents_status", table_name="documents")
    op.drop_index("ix_documents_case_id", table_name="documents")
    op.drop_index("ix_documents_customer_id", table_name="documents")
    op.drop_table("documents")
