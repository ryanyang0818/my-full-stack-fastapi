"""Add user role table

Revision ID: c3d5e7f90123
Revises: b2c4d6e8f901
Create Date: 2026-06-02 14:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "c3d5e7f90123"
down_revision = "b2c4d6e8f901"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_role",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "role_id"),
    )
    op.create_index(op.f("ix_user_role_role_id"), "user_role", ["role_id"])
    op.create_index(op.f("ix_user_role_user_id"), "user_role", ["user_id"])


def downgrade():
    op.drop_index(op.f("ix_user_role_user_id"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_role_id"), table_name="user_role")
    op.drop_table("user_role")
