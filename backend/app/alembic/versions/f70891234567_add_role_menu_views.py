"""Add role menu views

Revision ID: f70891234567
Revises: f60789123456
Create Date: 2026-06-02 15:16:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "f70891234567"
down_revision = "f60789123456"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE OR REPLACE VIEW view_role_menu AS
        SELECT
          r.id AS role_id,
          r.code AS role_code,
          r.name AS role_name,
          m.id AS menu_id,
          m.key AS menu_key,
          m.label AS menu_label,
          m.path AS menu_path,
          parent.key AS parent_menu_key,
          parent.label AS parent_menu_label,
          m.sort_order AS menu_sort_order,
          rm.created_at AS assigned_at
        FROM role r
        JOIN role_menu rm ON rm.role_id = r.id
        JOIN menu m ON m.id = rm.menu_id
        LEFT JOIN menu parent ON parent.id = m.parent_id
        """
    )
    op.execute(
        """
        CREATE OR REPLACE VIEW view_role_menus_summary AS
        SELECT
          r.id AS role_id,
          r.code AS role_code,
          r.name AS role_name,
          string_agg(m.key, ', ' ORDER BY COALESCE(parent.sort_order, m.sort_order), m.sort_order, m.key) AS menu_keys,
          string_agg(m.label, ', ' ORDER BY COALESCE(parent.sort_order, m.sort_order), m.sort_order, m.key) AS menu_labels,
          count(m.id) AS menu_count
        FROM role r
        LEFT JOIN role_menu rm ON rm.role_id = r.id
        LEFT JOIN menu m ON m.id = rm.menu_id
        LEFT JOIN menu parent ON parent.id = m.parent_id
        GROUP BY r.id, r.code, r.name
        """
    )


def downgrade():
    op.execute("DROP VIEW IF EXISTS view_role_menus_summary")
    op.execute("DROP VIEW IF EXISTS view_role_menu")
