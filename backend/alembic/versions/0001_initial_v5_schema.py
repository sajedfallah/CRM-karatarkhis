"""initial v5 schema

Revision ID: 0001_v5
Revises:
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0001_v5"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_customers_name", "customers", ["name"])

    op.create_table(
        "users",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("mobile", sa.String(32)),
        sa.Column("email", sa.String(320), unique=True),
        sa.Column("telegram_user_id", sa.String(64), unique=True),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT")),
        sa.Column("permission_profile", sa.String(32), nullable=False, server_default="محدود"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("workspace_url", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_customer_id", "users", ["customer_id"])

    op.create_table(
        "cases",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("real_case_number", sa.String(128)),
        sa.Column("operation_type", sa.String(32), nullable=False),
        sa.Column("customs", sa.String(64), nullable=False),
        sa.Column("status", sa.String(64), nullable=False, server_default="پیش‌نویس"),
        sa.Column("created_by", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_cases_customer_id", "cases", ["customer_id"])
    op.create_index("ix_cases_real_case_number", "cases", ["real_case_number"])

    op.create_table(
        "permissions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("scope_type", sa.String(32), nullable=False),
        sa.Column("scope_id", sa.String(128), nullable=False),
        sa.Column("profile", sa.String(32), nullable=False),
        sa.Column("can_view", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_create", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_edit", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_assign", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_approve_documents", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_finance", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_permissions_user_id", "permissions", ["user_id"])

    op.create_table(
        "case_assignments",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("case_id", sa.String(64), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT")),
        sa.Column("assignment_type", sa.String(64), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("assigned_by", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("case_id", "user_id", "assignment_type", name="uq_case_assignments_case_user_type"),
    )
    op.create_index("ix_case_assignments_case_id", "case_assignments", ["case_id"])
    op.create_index("ix_case_assignments_user_id", "case_assignments", ["user_id"])
    op.create_index("ix_case_assignments_customer_id", "case_assignments", ["customer_id"])
    op.create_index(
        "uq_case_primary_internal_active",
        "case_assignments",
        ["case_id"],
        unique=True,
        postgresql_where=sa.text("is_active = true AND is_primary = true AND assignment_type = 'مسئول داخلی اصلی'"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("actor_user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("entity_type", sa.String(64), nullable=False),
        sa.Column("entity_id", sa.String(128), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("field_name", sa.String(128)),
        sa.Column("old_value", sa.Text()),
        sa.Column("new_value", sa.Text()),
        sa.Column("source", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_entity_id", "audit_logs", ["entity_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("case_assignments")
    op.drop_table("permissions")
    op.drop_table("cases")
    op.drop_table("users")
    op.drop_table("customers")
