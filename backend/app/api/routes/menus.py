from collections.abc import Sequence
from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.engine import RowMapping
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models import (
    Menu,
    MenuCreate,
    MenuPublic,
    MenusPublic,
    MenuTreeNodePublic,
    MenuUpdate,
    Message,
    RoleMenu,
    UserMenuOverride,
)

router = APIRouter(prefix="/menus", tags=["menus"])


# 確認 menu key 沒有被其他資料使用
def ensureMenuKeyAvailable(
    session: SessionDep,
    key: str,
    exclude_id: uuid.UUID | None = None,
) -> None:
    statement = select(Menu).where(Menu.key == key)
    existing_menu = session.exec(statement).first()

    if existing_menu and existing_menu.id != exclude_id:
        raise HTTPException(status_code=409, detail="Menu key already exists")


# 取得 menu，找不到時回傳 404
def getMenuOr404(session: SessionDep, id: uuid.UUID) -> Menu:
    menu = session.get(Menu, id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


# 驗證 parent_id 存在且不會形成循環
def ensureValidParentId(
    session: SessionDep,
    parent_id: uuid.UUID | None,
    current_id: uuid.UUID | None = None,
) -> None:
    if parent_id is None:
        return

    if current_id and parent_id == current_id:
        raise HTTPException(status_code=400, detail="Menu cannot be its own parent")

    parent = session.get(Menu, parent_id)
    if not parent:
        raise HTTPException(status_code=400, detail="Parent menu not found")

    visited_ids: set[uuid.UUID] = set()
    ancestor = parent

    while ancestor.parent_id:
        if ancestor.id in visited_ids:
            raise HTTPException(status_code=400, detail="Menu parent cycle detected")
        visited_ids.add(ancestor.id)

        if current_id and ancestor.parent_id == current_id:
            raise HTTPException(status_code=400, detail="Menu parent cycle detected")

        next_ancestor = session.get(Menu, ancestor.parent_id)
        if not next_ancestor:
            return
        ancestor = next_ancestor


# 確認 menu 沒有其他資料關聯，避免刪除時連帶破壞權限設定
def ensureMenuCanBeDeleted(session: SessionDep, id: uuid.UUID) -> None:
    child_count = session.exec(
        select(func.count()).select_from(Menu).where(Menu.parent_id == id)
    ).one()
    if child_count > 0:
        raise HTTPException(status_code=409, detail="Menu has child menus")

    role_menu_count = session.exec(
        select(func.count()).select_from(RoleMenu).where(RoleMenu.menu_id == id)
    ).one()
    if role_menu_count > 0:
        raise HTTPException(status_code=409, detail="Menu is assigned to roles")

    override_count = session.exec(
        select(func.count())
        .select_from(UserMenuOverride)
        .where(UserMenuOverride.menu_id == id)
    ).one()
    if override_count > 0:
        raise HTTPException(status_code=409, detail="Menu has user overrides")


# 讀取目前登入者可見的樹狀選單
@router.get("/tree", response_model=list[MenuTreeNodePublic])
def readMyMenuTree(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[MenuTreeNodePublic]:
    rows = session.execute(
        text(
            """
            SELECT
              v.menu_id,
              v.menu_key,
              v.menu_label,
              v.menu_path,
              v.menu_sort_order,
              m.parent_id,
              m.icon
            FROM view_user_visible_menu v
            JOIN menu m ON m.id = v.menu_id
            WHERE v.user_id = :user_id
            ORDER BY
              v.root_sort_order,
              v.menu_sort_order,
              v.menu_key
            """
        ),
        {"user_id": current_user.id},
    ).mappings()

    return buildMenuTree(list(rows))


# 將平面選單資料組成階層結構
def buildMenuTree(rows: Sequence[RowMapping]) -> list[MenuTreeNodePublic]:
    nodes: dict[Any, MenuTreeNodePublic] = {}
    parent_ids: dict[Any, Any] = {}

    for row in rows:
        menu_id = row["menu_id"]
        nodes[menu_id] = MenuTreeNodePublic(
            id=menu_id,
            key=row["menu_key"],
            label=row["menu_label"],
            path=row["menu_path"],
            icon=row["icon"],
            sortOrder=row["menu_sort_order"],
        )
        parent_ids[menu_id] = row["parent_id"]

    roots: list[MenuTreeNodePublic] = []

    for menu_id, node in nodes.items():
        parent_id = parent_ids[menu_id]
        parent = nodes.get(parent_id)

        if parent:
            parent.children.append(node)
        else:
            roots.append(node)

    return roots


# 讀取管理用 menu 清單
@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MenusPublic,
)
def read_menus(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    count_statement = select(func.count()).select_from(Menu)
    count = session.exec(count_statement).one()
    statement = (
        select(Menu).order_by(col(Menu.parent_id), col(Menu.sort_order), col(Menu.key))
        .offset(skip)
        .limit(limit)
    )
    menus = session.exec(statement).all()
    menus_public = [MenuPublic.model_validate(menu) for menu in menus]

    return MenusPublic(data=menus_public, count=count)


# 新增 menu
@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MenuPublic,
)
def create_menu(*, session: SessionDep, menu_in: MenuCreate) -> Any:
    ensureMenuKeyAvailable(session=session, key=menu_in.key)
    ensureValidParentId(session=session, parent_id=menu_in.parent_id)

    menu = Menu.model_validate(menu_in)
    session.add(menu)
    session.commit()
    session.refresh(menu)

    return menu


# 讀取單筆 menu
@router.get(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MenuPublic,
)
def read_menu(session: SessionDep, id: uuid.UUID) -> Any:
    return getMenuOr404(session=session, id=id)


# 更新 menu
@router.patch(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=MenuPublic,
)
def update_menu(
    *,
    session: SessionDep,
    id: uuid.UUID,
    menu_in: MenuUpdate,
) -> Any:
    menu = getMenuOr404(session=session, id=id)
    update_dict = menu_in.model_dump(exclude_unset=True)

    if "key" in update_dict:
        ensureMenuKeyAvailable(session=session, key=update_dict["key"], exclude_id=id)

    if "parent_id" in update_dict:
        ensureValidParentId(
            session=session,
            parent_id=update_dict["parent_id"],
            current_id=id,
        )

    menu.sqlmodel_update(update_dict)
    session.add(menu)
    session.commit()
    session.refresh(menu)

    return menu


# 刪除 menu
@router.delete(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_menu(session: SessionDep, id: uuid.UUID) -> Message:
    menu = getMenuOr404(session=session, id=id)
    ensureMenuCanBeDeleted(session=session, id=id)

    session.delete(menu)
    session.commit()

    return Message(message="Menu deleted successfully")
