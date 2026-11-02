"""Version-bound customer review of a safe case-draft snapshot."""
from alembic import op
import sqlalchemy as sa


revision = "0015_draft_customer_review"
down_revision = "0014_draft_doc_links"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("draft_customer_reviews",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("draft_id", sa.String(64), sa.ForeignKey("case_drafts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("recipient_membership_id", sa.String(64), sa.ForeignKey("organization_memberships.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("draft_version", sa.Integer(), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("confirmation_text_version", sa.String(32), nullable=False, server_default="case-draft-review-v1"),
        sa.Column("requested_by", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("decision", sa.String(32)),
        sa.Column("decision_comment", sa.Text()),
        sa.Column("decided_by", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT")),
        sa.Column("decided_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("draft_id", "draft_version", name="uq_draft_customer_review_version"),
    )
    op.create_index("ix_draft_customer_reviews_draft_id", "draft_customer_reviews", ["draft_id"])
    op.create_index("ix_draft_customer_reviews_customer_id", "draft_customer_reviews", ["customer_id"])
    op.create_index("ix_draft_customer_reviews_recipient_membership_id", "draft_customer_reviews", ["recipient_membership_id"])


def downgrade():
    op.drop_table("draft_customer_reviews")
