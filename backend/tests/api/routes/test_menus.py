import uuid

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import Menu, Role, RoleMenu, UserRole
from tests.utils.utils import random_lower_string


# 建立使用者可見的父子選單測試資料
def createVisibleMenuTree(db: Session) -> tuple[str, str, uuid.UUID, list[uuid.UUID]]:
    user = crud.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert user
    assert user.id

    role = Role(code=f"role-{random_lower_string()}", name="Menu test role")
    root = Menu(
        key=f"menu-{random_lower_string()}",
        label="測試根選單",
        icon="folder",
        sort_order=50,
    )
    child = Menu(
        key=f"menu-{random_lower_string()}",
        label="測試子選單",
        path="/test/menu",
        parent_id=root.id,
        icon="file",
        sort_order=1,
    )

    db.add(role)
    db.add(root)
    db.add(child)
    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.add(RoleMenu(role_id=role.id, menu_id=root.id))
    db.add(RoleMenu(role_id=role.id, menu_id=child.id))
    db.commit()

    return root.key, child.key, role.id, [root.id, child.id]


# 清除選單樹測試建立的資料
def deleteVisibleMenuTree(
    db: Session,
    role_id: uuid.UUID,
    menu_ids: list[uuid.UUID],
) -> None:
    db.execute(
        text("DELETE FROM role_menu WHERE role_id = :role_id OR menu_id = ANY(:menu_ids)"),
        {"role_id": role_id, "menu_ids": menu_ids},
    )
    db.execute(
        text("DELETE FROM user_role WHERE role_id = :role_id"),
        {"role_id": role_id},
    )
    db.execute(
        text("DELETE FROM role WHERE id = :role_id"),
        {"role_id": role_id},
    )
    db.execute(
        text("DELETE FROM menu WHERE id = ANY(:menu_ids)"),
        {"menu_ids": menu_ids},
    )
    db.commit()


# 未登入時不允許讀取選單樹
def test_read_menu_tree_without_token(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/menus/tree")

    assert response.status_code == 401


# 已登入時回傳目前使用者可見的階層選單
def test_read_menu_tree(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    root_key, child_key, role_id, menu_ids = createVisibleMenuTree(db)

    try:
        response = client.get(
            f"{settings.API_V1_STR}/menus/tree",
            headers=superuser_token_headers,
        )

        assert response.status_code == 200
        content = response.json()
        assert isinstance(content, list)

        root = next(menu for menu in content if menu["key"] == root_key)
        child = next(menu for menu in root["children"] if menu["key"] == child_key)

        assert root["label"] == "測試根選單"
        assert root["icon"] == "folder"
        assert root["sortOrder"] == 50
        assert child["label"] == "測試子選單"
        assert child["path"] == "/test/menu"
        assert child["icon"] == "file"
        assert child["sortOrder"] == 1
    finally:
        deleteVisibleMenuTree(db, role_id, menu_ids)
