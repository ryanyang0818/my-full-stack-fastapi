"""Add role menu table

Revision ID: f60789123456
Revises: e5f709123456
Create Date: 2026-06-02 15:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "f60789123456"
down_revision = "e5f709123456"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS menu (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key VARCHAR(100) NOT NULL UNIQUE,
          label VARCHAR(100) NOT NULL,
          path VARCHAR(255),
          parent_id UUID REFERENCES menu(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          icon VARCHAR(100),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_visible BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_menu_parent_id ON menu(parent_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_menu_sort_order ON menu(sort_order)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_menu_key ON menu(key)")

    op.create_table(
        "role_menu",
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("menu_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["menu_id"], ["menu.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("role_id", "menu_id"),
    )
    op.create_index(op.f("ix_role_menu_menu_id"), "role_menu", ["menu_id"])
    op.create_index(op.f("ix_role_menu_role_id"), "role_menu", ["role_id"])


def downgrade():
    op.drop_index(op.f("ix_role_menu_role_id"), table_name="role_menu")
    op.drop_index(op.f("ix_role_menu_menu_id"), table_name="role_menu")
    op.drop_table("role_menu")
