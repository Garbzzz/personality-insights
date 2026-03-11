"""add candidate description and photo

Revision ID: b3c4d5e6f7a8
Revises: cc9dcbddc30d
Create Date: 2026-03-11 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'cc9dcbddc30d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('candidates', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('candidates', sa.Column('photo', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('candidates', 'photo')
    op.drop_column('candidates', 'description')
