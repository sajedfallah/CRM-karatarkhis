"""Store structured export details and exact company-document selections."""
from alembic import op
import sqlalchemy as sa


revision = "0018_export_request_details"
down_revision = "0017_customer_company_invites"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("case_registration_requests", sa.Column(
        "details", sa.JSON(), nullable=False, server_default=sa.text("'{}'")))
    op.add_column("case_registration_requests", sa.Column("ai_review", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("case_registration_requests", "ai_review")
    op.drop_column("case_registration_requests", "details")

