"""Add optional customer identity, contact and address fields.

Revision ID: 0009_customer_profile
Revises: 0008_session_org_scope
"""
from alembic import op
import sqlalchemy as sa

revision = '0009_customer_profile'
down_revision = '0008_session_org_scope'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("customers", sa.Column("customer_type", sa.String(24), nullable=True))
    op.add_column("customers", sa.Column("national_id", sa.String(32), nullable=True))
    op.add_column("customers", sa.Column("registration_number", sa.String(64), nullable=True))
    op.add_column("customers", sa.Column("economic_code", sa.String(32), nullable=True))
    op.add_column("customers", sa.Column("contact_name", sa.String(255), nullable=True))
    op.add_column("customers", sa.Column("phone", sa.String(40), nullable=True))
    op.add_column("customers", sa.Column("mobile", sa.String(40), nullable=True))
    op.add_column("customers", sa.Column("email", sa.String(320), nullable=True))
    op.add_column("customers", sa.Column("province", sa.String(100), nullable=True))
    op.add_column("customers", sa.Column("city", sa.String(100), nullable=True))
    op.add_column("customers", sa.Column("postal_code", sa.String(20), nullable=True))
    op.add_column("customers", sa.Column("address", sa.String(2000), nullable=True))


def downgrade():
    op.drop_column("customers", "address")
    op.drop_column("customers", "postal_code")
    op.drop_column("customers", "city")
    op.drop_column("customers", "province")
    op.drop_column("customers", "email")
    op.drop_column("customers", "mobile")
    op.drop_column("customers", "phone")
    op.drop_column("customers", "contact_name")
    op.drop_column("customers", "economic_code")
    op.drop_column("customers", "registration_number")
    op.drop_column("customers", "national_id")
    op.drop_column("customers", "customer_type")
