"""Rename user role views

Revision ID: e5f709123456
Revises: d4e6f8023456
Create Date: 2026-06-02 15:08:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "e5f709123456"
down_revision = "d4e6f8023456"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER VIEW user_role_view RENAME TO view_user_role")
    op.execute(
        "ALTER VIEW user_roles_summary_view RENAME TO view_user_roles_summary"
    )


def downgrade():
    op.execute(
        "ALTER VIEW view_user_roles_summary RENAME TO user_roles_summary_view"
    )
    op.execute("ALTER VIEW view_user_role RENAME TO user_role_view")
