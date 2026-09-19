"""add Drive folder provisioning metadata

Revision ID: 0005_drive_folder_provisioning
Revises: 0004_documents
"""

from alembic import op
import sqlalchemy as sa

revision = "0005_drive_folder_provisioning"
down_revision = "0004_documents"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("drive_folder_id", sa.String(length=128), nullable=True))
    op.add_column("customers", sa.Column("drive_provisioning_status", sa.String(length=32), nullable=False, server_default="pending"))
    op.add_column("customers", sa.Column("drive_provisioning_error", sa.Text(), nullable=True))
    op.create_unique_constraint("uq_customers_drive_folder_id", "customers", ["drive_folder_id"])

    op.add_column("cases", sa.Column("drive_folder_id", sa.String(length=128), nullable=True))
    op.add_column("cases", sa.Column("drive_provisioning_status", sa.String(length=32), nullable=False, server_default="pending"))
    op.add_column("cases", sa.Column("drive_provisioning_error", sa.Text(), nullable=True))
    op.create_unique_constraint("uq_cases_drive_folder_id", "cases", ["drive_folder_id"])


def downgrade() -> None:
    op.drop_constraint("uq_cases_drive_folder_id", "cases", type_="unique")
    op.drop_column("cases", "drive_provisioning_error")
    op.drop_column("cases", "drive_provisioning_status")
    op.drop_column("cases", "drive_folder_id")

    op.drop_constraint("uq_customers_drive_folder_id", "customers", type_="unique")
    op.drop_column("customers", "drive_provisioning_error")
    op.drop_column("customers", "drive_provisioning_status")
    op.drop_column("customers", "drive_folder_id")
