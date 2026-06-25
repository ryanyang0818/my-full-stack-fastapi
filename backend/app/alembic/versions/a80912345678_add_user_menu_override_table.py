"""Add user menu override table

Revision ID: a80912345678
Revises: f70891234567
Create Date: 2026-06-02 15:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "a80912345678"
down_revision = "f70891234567"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_menu_override",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("menu_id", sa.UUID(), nullable=False),
        sa.Column("effect", sa.String(length=10), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "effect IN ('allow', 'deny')",
            name="ck_user_menu_override_effect",
        ),
        sa.ForeignKeyConstraint(["menu_id"], ["menu.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "menu_id"),
    )
    op.create_index(
        op.f("ix_user_menu_override_menu_id"),
        "user_menu_override",
        ["menu_id"],
    )
    op.create_index(
        op.f("ix_user_menu_override_user_id"),
        "user_menu_override",
        ["user_id"],
    )


def downgrade():
    op.drop_index(
        op.f("ix_user_menu_override_user_id"),
        table_name="user_menu_override",
    )
    op.drop_index(
        op.f("ix_user_menu_override_menu_id"),
        table_name="user_menu_override",
    )
    op.drop_table("user_menu_override")
