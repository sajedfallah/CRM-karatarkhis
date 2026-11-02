"""Password credential and revocable session foundation.

Revision ID: 0007_password_sessions
Revises: 0006_identity_access
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_password_sessions"
down_revision = "0006_identity_access"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("password_credentials",
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("verified_email", sa.String(320)),
        sa.Column("email_verified_at", sa.DateTime(timezone=True)))
    op.create_table("auth_sessions",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("csrf_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)))
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_table("login_throttles",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False))


def downgrade():
    op.drop_table("login_throttles")
    op.drop_table("auth_sessions")
    op.drop_table("password_credentials")
