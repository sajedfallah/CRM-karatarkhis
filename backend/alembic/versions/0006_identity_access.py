"""identity and organization foundation

Revision ID: 0006_identity_access
Revises: 0005_drive_folder_provisioning
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_identity_access"
down_revision = "0005_drive_folder_provisioning"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("organizations", sa.Column("id",sa.String(64),primary_key=True),sa.Column("type",sa.String(16),nullable=False),sa.Column("name",sa.String(255),nullable=False),sa.Column("slug",sa.String(128),nullable=False,unique=True),sa.Column("status",sa.String(32),nullable=False,server_default="active"),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),sa.Column("updated_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),sa.CheckConstraint("type IN ('INTERNAL','CUSTOMER')"))
    op.create_table("organization_memberships",sa.Column("id",sa.String(64),primary_key=True),sa.Column("organization_id",sa.String(64),sa.ForeignKey("organizations.id",ondelete="CASCADE"),nullable=False),sa.Column("user_id",sa.String(64),sa.ForeignKey("users.id",ondelete="CASCADE"),nullable=False),sa.Column("role",sa.String(64),nullable=False),sa.Column("permission_profile",sa.String(32),nullable=False),sa.Column("scope_type",sa.String(32),nullable=False,server_default="ORGANIZATION"),sa.Column("status",sa.String(32),nullable=False,server_default="pending"),sa.Column("is_primary",sa.Boolean(),nullable=False,server_default=sa.false()),sa.Column("joined_at",sa.DateTime(timezone=True)),sa.Column("deactivated_at",sa.DateTime(timezone=True)),sa.UniqueConstraint("organization_id","user_id",name="uq_membership_org_user"))
    for table, cols in [("organization_memberships",["organization_id"]),("organization_memberships",["user_id"])]: op.create_index(f"ix_{table}_{cols[0]}",table,cols)
    op.create_table("invitations",sa.Column("id",sa.String(64),primary_key=True),sa.Column("organization_id",sa.String(64),sa.ForeignKey("organizations.id",ondelete="CASCADE"),nullable=False),sa.Column("email",sa.String(320),nullable=False),sa.Column("role",sa.String(64),nullable=False),sa.Column("scope_type",sa.String(32),nullable=False),sa.Column("invited_by",sa.String(64),sa.ForeignKey("users.id",ondelete="SET NULL")),sa.Column("token_hash",sa.String(128),nullable=False,unique=True),sa.Column("expires_at",sa.DateTime(timezone=True),nullable=False),sa.Column("accepted_at",sa.DateTime(timezone=True)),sa.Column("revoked_at",sa.DateTime(timezone=True)),sa.Column("status",sa.String(32),nullable=False,server_default="pending"))
    op.create_table("email_verifications",sa.Column("id",sa.String(64),primary_key=True),sa.Column("user_id",sa.String(64),sa.ForeignKey("users.id",ondelete="CASCADE")),sa.Column("email",sa.String(320),nullable=False),sa.Column("token_hash",sa.String(128),nullable=False,unique=True),sa.Column("expires_at",sa.DateTime(timezone=True),nullable=False),sa.Column("used_at",sa.DateTime(timezone=True)),sa.Column("revoked_at",sa.DateTime(timezone=True)))
    op.create_table("case_access_grants",sa.Column("id",sa.String(64),primary_key=True),sa.Column("membership_id",sa.String(64),sa.ForeignKey("organization_memberships.id",ondelete="CASCADE"),nullable=False),sa.Column("case_id",sa.String(64),sa.ForeignKey("cases.id",ondelete="CASCADE"),nullable=False),sa.Column("access_level",sa.String(32),nullable=False,server_default="view"),sa.Column("granted_by",sa.String(64),sa.ForeignKey("users.id",ondelete="SET NULL")),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),sa.Column("revoked_at",sa.DateTime(timezone=True)),sa.UniqueConstraint("membership_id","case_id",name="uq_case_grant_membership_case"))
    op.create_table("security_events",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("user_id",sa.String(64),sa.ForeignKey("users.id",ondelete="SET NULL")),sa.Column("organization_id",sa.String(64),sa.ForeignKey("organizations.id",ondelete="SET NULL")),sa.Column("event_type",sa.String(64),nullable=False),sa.Column("ip_address",sa.String(64)),sa.Column("user_agent",sa.Text()),sa.Column("metadata_json",sa.Text()),sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False))
    for table, column in [("invitations","organization_id"),("invitations","email"),("email_verifications","user_id"),("email_verifications","email"),("case_access_grants","membership_id"),("case_access_grants","case_id"),("security_events","user_id"),("security_events","organization_id"),("security_events","event_type")]:
        op.create_index(f"ix_{table}_{column}", table, [column])

def downgrade():
    op.drop_table("security_events"); op.drop_table("case_access_grants"); op.drop_table("email_verifications"); op.drop_table("invitations"); op.drop_table("organization_memberships"); op.drop_table("organizations")
