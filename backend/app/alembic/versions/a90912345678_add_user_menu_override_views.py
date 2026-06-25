"""Add user menu override views

Revision ID: a90912345678
Revises: a80912345678
Create Date: 2026-06-02 15:41:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "a90912345678"
down_revision = "a80912345678"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE OR REPLACE VIEW view_user_menu_override AS
        SELECT
          u.id AS user_id,
          u.email,
          u.full_name,
          m.id AS menu_id,
          m.key AS menu_key,
          m.label AS menu_label,
          parent.key AS parent_menu_key,
          parent.label AS parent_menu_label,
          umo.effect,
          umo.reason,
          umo.created_at AS assigned_at
        FROM user_menu_override umo
        JOIN "user" u ON u.id = umo.user_id
        JOIN menu m ON m.id = umo.menu_id
        LEFT JOIN menu parent ON parent.id = m.parent_id
        """
    )
    op.execute(
        """
        CREATE OR REPLACE VIEW view_user_visible_menu AS
        WITH role_visible_menu AS (
          SELECT DISTINCT
            u.id AS user_id,
            m.id AS menu_id
          FROM "user" u
          JOIN user_role ur ON ur.user_id = u.id
          JOIN role_menu rm ON rm.role_id = ur.role_id
          JOIN role r ON r.id = ur.role_id
          JOIN menu m ON m.id = rm.menu_id
          WHERE u.is_active = true
            AND r.is_active = true
            AND m.is_active = true
            AND m.is_visible = true
        ),
        user_allow_menu AS (
          SELECT DISTINCT
            umo.user_id,
            umo.menu_id
          FROM user_menu_override umo
          JOIN menu m ON m.id = umo.menu_id
          WHERE umo.effect = 'allow'
            AND m.is_active = true
            AND m.is_visible = true
        ),
        candidate_menu AS (
          SELECT user_id, menu_id FROM role_visible_menu
          UNION
          SELECT user_id, menu_id FROM user_allow_menu
        )
        SELECT
          u.id AS user_id,
          u.email,
          u.full_name,
          m.id AS menu_id,
          m.key AS menu_key,
          m.label AS menu_label,
          m.path AS menu_path,
          parent.key AS parent_menu_key,
          parent.label AS parent_menu_label,
          COALESCE(parent.sort_order, m.sort_order) AS root_sort_order,
          m.sort_order AS menu_sort_order
        FROM candidate_menu candidate
        JOIN "user" u ON u.id = candidate.user_id
        JOIN menu m ON m.id = candidate.menu_id
        LEFT JOIN menu parent ON parent.id = m.parent_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM user_menu_override deny
          WHERE deny.user_id = candidate.user_id
            AND deny.menu_id = candidate.menu_id
            AND deny.effect = 'deny'
        )
        """
    )


def downgrade():
    op.execute("DROP VIEW IF EXISTS view_user_visible_menu")
    op.execute("DROP VIEW IF EXISTS view_user_menu_override")
