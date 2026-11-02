"""Distinguish customer portal managers/employees from declaration reviewers."""
from alembic import op
import sqlalchemy as sa


revision = "0017_customer_company_invites"
down_revision = "0016_case_registration_requests"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "invitations",
        sa.Column("purpose", sa.String(length=32), nullable=False,
                  server_default="declaration_reviewer"),
    )


def downgrade():
    op.drop_column("invitations", "purpose")

