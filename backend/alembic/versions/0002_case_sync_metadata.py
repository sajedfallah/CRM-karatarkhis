"""add case sync metadata

Revision ID: 0002_case_sync_metadata
Revises: 0001_v5
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_case_sync_metadata"
down_revision: str | None = "0001_v5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "cases",
        sa.Column("sync_version", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "cases",
        sa.Column("sync_source", sa.String(32), nullable=True),
    )
    op.add_column(
        "cases",
        sa.Column("sync_updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("cases", "sync_updated_at")
    op.drop_column("cases", "sync_source")
    op.drop_column("cases", "sync_version")
