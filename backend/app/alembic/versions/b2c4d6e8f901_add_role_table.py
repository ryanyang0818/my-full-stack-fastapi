"""Add role table

Revision ID: b2c4d6e8f901
Revises: 7f3a2c9d4b10
Create Date: 2026-06-02 12:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "b2c4d6e8f901"
down_revision = "7f3a2c9d4b10"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "role",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_role_code"), "role", ["code"], unique=True)


def downgrade():
    op.drop_index(op.f("ix_role_code"), table_name="role")
    op.drop_table("role")
