"""Add private stage messages, attachments, and recipient notifications."""
from alembic import op
import sqlalchemy as sa


revision = "0019_case_workflow_messages"
down_revision = "0018_export_request_details"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "case_workflow_messages",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("case_id", sa.String(length=64), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stage", sa.String(length=80), nullable=True),
        sa.Column("sender_user_id", sa.String(length=64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("visibility", sa.String(length=16), nullable=False, server_default="customer"),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_case_workflow_messages_case_id", "case_workflow_messages", ["case_id"])
    op.create_index("ix_case_workflow_messages_stage", "case_workflow_messages", ["stage"])
    op.create_index("ix_case_workflow_messages_sender_user_id", "case_workflow_messages", ["sender_user_id"])
    op.create_index("ix_case_workflow_messages_visibility", "case_workflow_messages", ["visibility"])
    op.create_index("ix_case_workflow_messages_created_at", "case_workflow_messages", ["created_at"])

    op.create_table(
        "case_workflow_attachments",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("message_id", sa.String(length=64), sa.ForeignKey("case_workflow_messages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("object_key", sa.String(length=255), nullable=False, unique=True),
        sa.Column("file_name", sa.String(length=180), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("uploaded_by", sa.String(length=64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_case_workflow_attachments_message_id", "case_workflow_attachments", ["message_id"])

    op.create_table(
        "case_workflow_notifications",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("recipient_user_id", sa.String(length=64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message_id", sa.String(length=64), sa.ForeignKey("case_workflow_messages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("case_id", sa.String(length=64), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("recipient_user_id", "message_id", name="uq_case_workflow_notification_recipient_message"),
    )
    op.create_index("ix_case_workflow_notifications_recipient_user_id", "case_workflow_notifications", ["recipient_user_id"])
    op.create_index("ix_case_workflow_notifications_message_id", "case_workflow_notifications", ["message_id"])
    op.create_index("ix_case_workflow_notifications_case_id", "case_workflow_notifications", ["case_id"])


def downgrade():
    op.drop_table("case_workflow_notifications")
    op.drop_table("case_workflow_attachments")
    op.drop_table("case_workflow_messages")
