"""Private immutable corporate document versions and recipient notifications.
Revision ID: 0010_customer_documents
Revises: 0009_customer_profile
"""
from alembic import op
import sqlalchemy as sa

revision = '0010_customer_documents'
down_revision = '0009_customer_profile'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('corporate_documents',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('customer_id', sa.String(32), sa.ForeignKey('customers.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('document_type', sa.String(32), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('created_by', sa.String(64), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index('ix_corporate_documents_customer_id', 'corporate_documents', ['customer_id'])
    op.create_table('corporate_document_versions',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('document_id', sa.String(64), sa.ForeignKey('corporate_documents.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('object_key', sa.String(255), nullable=False, unique=True),
        sa.Column('file_name', sa.String(180), nullable=False),
        sa.Column('mime_type', sa.String(64), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('sha256', sa.String(64), nullable=False),
        sa.Column('starts_on', sa.Date()), sa.Column('expires_on', sa.Date()),
        sa.Column('remind_days', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.String(64), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('document_id', 'version'))
    op.create_index('ix_corporate_document_versions_document_id', 'corporate_document_versions', ['document_id'])
    op.create_index('ix_corporate_document_versions_expires_on', 'corporate_document_versions', ['expires_on'])
    op.create_table('document_notifications',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('recipient_user_id', sa.String(64), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('customer_id', sa.String(32), sa.ForeignKey('customers.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('version_id', sa.String(64), sa.ForeignKey('corporate_document_versions.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('threshold', sa.Integer(), nullable=False), sa.Column('title', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True)),
        sa.UniqueConstraint('recipient_user_id', 'version_id', 'threshold'))
    op.create_index('ix_document_notifications_recipient_user_id', 'document_notifications', ['recipient_user_id'])


def downgrade():
    op.drop_table('document_notifications')
    op.drop_table('corporate_document_versions')
    op.drop_table('corporate_documents')
