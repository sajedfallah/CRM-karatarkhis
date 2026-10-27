"""Version-bound customer declaration review."""
from alembic import op
import sqlalchemy as sa
revision = "0012_declaration_review"
down_revision = "0011_case_drafts"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("declaration_versions",
        sa.Column("id",sa.String(64),primary_key=True),
        sa.Column("case_id",sa.String(64),sa.ForeignKey("cases.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("version",sa.Integer(),nullable=False),
        sa.Column("object_key",sa.String(255),unique=True,nullable=False),
        sa.Column("file_name",sa.String(180),nullable=False),
        sa.Column("mime_type",sa.String(100),nullable=False),
        sa.Column("size_bytes",sa.Integer(),nullable=False),
        sa.Column("sha256",sa.String(64),nullable=False),
        sa.Column("created_by",sa.String(64),sa.ForeignKey("users.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),
        sa.UniqueConstraint("case_id","version",name="uq_declaration_case_version"))
    op.create_index("ix_declaration_versions_case_id","declaration_versions",["case_id"])
    op.create_table("declaration_requests",
        sa.Column("id",sa.String(64),primary_key=True),
        sa.Column("version_id",sa.String(64),sa.ForeignKey("declaration_versions.id",ondelete="RESTRICT"),unique=True,nullable=False),
        sa.Column("recipient_membership_id",sa.String(64),sa.ForeignKey("organization_memberships.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("sent_by",sa.String(64),sa.ForeignKey("users.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False))
    op.create_table("declaration_decisions",
        sa.Column("id",sa.String(64),primary_key=True),
        sa.Column("request_id",sa.String(64),sa.ForeignKey("declaration_requests.id",ondelete="RESTRICT"),unique=True,nullable=False),
        sa.Column("decision",sa.String(32),nullable=False),
        sa.Column("comment",sa.Text()),
        sa.Column("actor_user_id",sa.String(64),sa.ForeignKey("users.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("actor_membership_id",sa.String(64),sa.ForeignKey("organization_memberships.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False))


def downgrade():
    op.drop_table("declaration_decisions")
    op.drop_table("declaration_requests")
    op.drop_table("declaration_versions")
