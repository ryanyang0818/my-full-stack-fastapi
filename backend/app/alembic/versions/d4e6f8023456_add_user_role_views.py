"""Add user role views

Revision ID: d4e6f8023456
Revises: c3d5e7f90123
Create Date: 2026-06-02 15:02:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "d4e6f8023456"
down_revision = "c3d5e7f90123"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE OR REPLACE VIEW user_role_view AS
        SELECT
          u.id AS user_id,
          u.email,
          u.full_name,
          u.is_active AS user_is_active,
          u.is_superuser,
          r.id AS role_id,
          r.code AS role_code,
          r.name AS role_name,
          r.description AS role_description,
          r.is_active AS role_is_active,
          ur.created_at AS assigned_at
        FROM "user" u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN role r ON r.id = ur.role_id
        """
    )
    op.execute(
        """
        CREATE OR REPLACE VIEW user_roles_summary_view AS
        SELECT
          u.id AS user_id,
          u.email,
          u.full_name,
          u.is_active AS user_is_active,
          u.is_superuser,
          string_agg(r.code, ', ' ORDER BY r.sort_order) AS role_codes,
          string_agg(r.name, ', ' ORDER BY r.sort_order) AS role_names,
          count(r.id) AS role_count
        FROM "user" u
        LEFT JOIN user_role ur ON ur.user_id = u.id
        LEFT JOIN role r ON r.id = ur.role_id
        GROUP BY
          u.id,
          u.email,
          u.full_name,
          u.is_active,
          u.is_superuser
        """
    )


def downgrade():
    op.execute("DROP VIEW IF EXISTS user_roles_summary_view")
    op.execute("DROP VIEW IF EXISTS user_role_view")
