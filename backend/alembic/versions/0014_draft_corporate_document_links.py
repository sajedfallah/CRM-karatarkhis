"""Exact customer corporate-document versions linked to case drafts."""
from alembic import op
import sqlalchemy as sa

revision = "0014_draft_corporate_document_links"
down_revision = "0013_draft_product_review"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("draft_corporate_document_links",
        sa.Column("id",sa.String(64),primary_key=True),
        sa.Column("draft_id",sa.String(64),sa.ForeignKey("case_drafts.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("document_version_id",sa.String(64),sa.ForeignKey("corporate_document_versions.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("added_by",sa.String(64),sa.ForeignKey("users.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("added_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),
        sa.Column("removed_by",sa.String(64),sa.ForeignKey("users.id",ondelete="RESTRICT")),
        sa.Column("removed_at",sa.DateTime(timezone=True)),
        sa.UniqueConstraint("draft_id","document_version_id",name="uq_draft_document_version"))
    op.create_index("ix_draft_corporate_document_links_draft_id","draft_corporate_document_links",["draft_id"])
    op.create_index("ix_draft_corporate_document_links_document_version_id","draft_corporate_document_links",["document_version_id"])


def downgrade():
    op.drop_table("draft_corporate_document_links")

