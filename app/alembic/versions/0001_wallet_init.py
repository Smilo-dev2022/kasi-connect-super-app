"""
wallet initial tables

Revision ID: 0001_wallet_init
Revises: 
Create Date: 2025-09-14 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = '0001_wallet_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'walletrequest',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('group_id', sa.String(), nullable=False, index=True),
        sa.Column('requester_id', sa.String(), nullable=False, index=True),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('accepted_by', sa.String(), nullable=True, index=True),
        sa.Column('paid_by', sa.String(), nullable=True, index=True),
        sa.Column('canceled_by', sa.String(), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'groupledger',
        sa.Column('group_id', sa.String(), nullable=False),
        sa.Column('member_id', sa.String(), nullable=False),
        sa.Column('balance_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('group_id', 'member_id'),
    )

    op.create_table(
        'ledgerentry',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('group_id', sa.String(), nullable=False),
        sa.Column('member_id', sa.String(), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('related_request_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('ledgerentry')
    op.drop_table('groupledger')
    op.drop_table('walletrequest')

