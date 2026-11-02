"""Draft product revision and immutable human review snapshots."""
from alembic import op
import sqlalchemy as sa
revision="0013_draft_product_review"
down_revision="0012_declaration_review"
branch_labels=None
depends_on=None

def upgrade():
    op.add_column("case_drafts",sa.Column("product_revision",sa.Integer(),nullable=False,server_default="1"))
    op.create_table("draft_product_reviews",
        sa.Column("id",sa.String(64),primary_key=True),
        sa.Column("draft_id",sa.String(64),sa.ForeignKey("case_drafts.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("product_revision",sa.Integer(),nullable=False),
        sa.Column("draft_version",sa.Integer(),nullable=False),
        sa.Column("source_fingerprint",sa.String(64),nullable=False),
        sa.Column("snapshot",sa.JSON(),nullable=False),
        sa.Column("reviewed_by",sa.String(64),sa.ForeignKey("users.id",ondelete="RESTRICT"),nullable=False),
        sa.Column("reason",sa.Text(),nullable=False),
        sa.Column("created_at",sa.DateTime(timezone=True),server_default=sa.func.now(),nullable=False),
        sa.UniqueConstraint("draft_id","product_revision",name="uq_draft_product_review_revision"))
    op.create_index("ix_draft_product_reviews_draft_id","draft_product_reviews",["draft_id"])

def downgrade():
    op.drop_table("draft_product_reviews")
    op.drop_column("case_drafts","product_revision")

