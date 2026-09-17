"""add tasks and task messages

Revision ID: 0003_tasks
Revises: 0002_case_sync_metadata
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0003_tasks"
down_revision: str | None = "0002_case_sync_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("relation_type", sa.String(32), nullable=False),
        sa.Column("related_id", sa.String(64), nullable=True),
        sa.Column("customer_id", sa.String(32), sa.ForeignKey("customers.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("case_id", sa.String(64), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(64), nullable=True),
        sa.Column("created_by", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assignee_user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("priority", sa.String(32), nullable=False, server_default="عادی"),
        sa.Column("status", sa.String(32), nullable=False, server_default="جدید"),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("needs_manager", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("result", sa.Text(), nullable=True),
        sa.Column("next_action", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_tasks_customer_id", "tasks", ["customer_id"])
    op.create_index("ix_tasks_case_id", "tasks", ["case_id"])
    op.create_index("ix_tasks_assignee_user_id", "tasks", ["assignee_user_id"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_due_at", "tasks", ["due_at"])

    op.create_table(
        "task_messages",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("task_id", sa.String(64), sa.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("source", sa.String(32), nullable=False, server_default="api"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_task_messages_task_id", "task_messages", ["task_id"])
    op.create_index("ix_task_messages_created_at", "task_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_task_messages_created_at", table_name="task_messages")
    op.drop_index("ix_task_messages_task_id", table_name="task_messages")
    op.drop_table("task_messages")
    op.drop_index("ix_tasks_due_at", table_name="tasks")
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_assignee_user_id", table_name="tasks")
    op.drop_index("ix_tasks_case_id", table_name="tasks")
    op.drop_index("ix_tasks_customer_id", table_name="tasks")
    op.drop_table("tasks")
