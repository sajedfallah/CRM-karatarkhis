"""Customer-submitted case-registration queue and customs quota number."""
from alembic import op
import sqlalchemy as sa


revision = "0016_case_registration_requests"
down_revision = "0015_draft_customer_review"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("cases", sa.Column("customs_quota_number", sa.String(128), nullable=True))
    op.create_unique_constraint("uq_cases_customs_quota_number", "cases", ["customs_quota_number"])
    op.create_table("case_registration_requests",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_by", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("operation_type", sa.String(16), nullable=False),
        sa.Column("customs", sa.String(64), nullable=False),
        sa.Column("hs_code", sa.String(12), nullable=False),
        sa.Column("documents", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("status", sa.String(24), nullable=False, server_default="DRAFT"),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("reviewed_by", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("registered_case_id", sa.String(64), sa.ForeignKey("cases.id", ondelete="RESTRICT"), unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_case_registration_requests_customer_id", "case_registration_requests", ["customer_id"])
    op.create_index("ix_case_registration_requests_created_by", "case_registration_requests", ["created_by"])
    op.create_index("ix_case_registration_requests_status", "case_registration_requests", ["status"])


def downgrade():
    op.drop_table("case_registration_requests")
    op.drop_constraint("uq_cases_customs_quota_number", "cases", type_="unique")
    op.drop_column("cases", "customs_quota_number")

