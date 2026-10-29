"""Bind sessions to memberships and customer organizations to customer records.

Revision ID: 0008_session_org_scope
Revises: 0007_password_sessions
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_session_org_scope"
down_revision = "0007_password_sessions"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("organizations", sa.Column("customer_id", sa.String(32), nullable=True))
    op.create_foreign_key("fk_org_customer", "organizations", "customers", ["customer_id"], ["id"], ondelete="RESTRICT")
    op.create_unique_constraint("uq_org_customer", "organizations", ["customer_id"])
    op.add_column("auth_sessions", sa.Column("membership_id", sa.String(64), nullable=True))
    op.create_foreign_key("fk_session_membership", "auth_sessions", "organization_memberships", ["membership_id"], ["id"], ondelete="RESTRICT")
    op.create_index("ix_auth_sessions_membership_id", "auth_sessions", ["membership_id"])


def downgrade():
    op.drop_index("ix_auth_sessions_membership_id", table_name="auth_sessions")
    op.drop_constraint("fk_session_membership", "auth_sessions", type_="foreignkey")
    op.drop_column("auth_sessions", "membership_id")
    op.drop_constraint("uq_org_customer", "organizations", type_="unique")
    op.drop_constraint("fk_org_customer", "organizations", type_="foreignkey")
    op.drop_column("organizations", "customer_id")
