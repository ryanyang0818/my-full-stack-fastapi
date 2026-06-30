# AI-Model: Codex GPT-5

# Dodo Admin User Menu View Skill

## 目標

建立專案內 Skill：`dodo-admin-user-menu-view`。

此 Skill 每次執行時，會從目前 Docker Compose PostgreSQL `app` 資料庫重新讀取使用者、角色、選單與權限資料，並產生固定版型的 HTML snapshot。

## 放置位置

| 項目 | 路徑 |
|---|---|
| Skill | `.agents/skills/dodo-admin-user-menu-view/` |
| 預設輸出 | `docs/dodo-admin-user-menu-view.html` |

## 資料來源

| 資料 | 來源表 / View | 用途 |
|---|---|---|
| User 清單 | `"user"` | 帳號、啟用狀態、Superuser、建立時間、登入時間 |
| Role 清單 | `role` | 角色代碼、角色名稱、啟用狀態 |
| User 到 Role | `user_role` / `view_user_role` | 每個 User 被指派哪些 Role |
| Menu 清單 | `menu` | menu key、label、path、parent、排序、icon、啟用 / 可見 |
| Role 到 Menu | `role_menu` / `view_role_menu` | 每個 Role 授權哪些 Menu |
| User Menu Override | `user_menu_override` / `view_user_menu_override` | 個別 User 的 allow / deny 例外 |
| Final Visible Menu | `view_user_visible_menu` | 最終每個 User 可見的 Menu |

## 實作項目

- [x] 建立 Skill 骨架。
- [x] 建立 `SKILL.md`，定義執行流程、限制與輸出規則。
- [x] 建立 `references/data-contract.md`，規格化資料表、view 與欄位。
- [x] 建立 `references/output-layout.md`，規格化 HTML 版型與互動。
- [x] 建立 `assets/user-menu-view-template.html`，存放固定 HTML template。
- [x] 建立 `scripts/export_user_menu_view.py`，用 read-only SQL 匯出 HTML。
- [x] 修正 `agents/openai.yaml` metadata。
- [x] 執行 Skill 驗證。
- [x] 試跑產生 `docs/dodo-admin-user-menu-view.html`。

## 驗收項目

| 項目 | 標準 |
|---|---|
| Skill 結構 | `quick_validate.py` 通過 |
| 資料讀取 | 只執行 `SELECT`，不寫入資料庫 |
| HTML 輸出 | 成功產生 `docs/dodo-admin-user-menu-view.html` |
| 資料完整 | 包含 User、Role、Menu、UserRole、RoleMenu、Override、Final Visible Menu |
| UI 功能 | 有 User 搜尋 / 篩選、TreeView、Permission Matrix 搜尋 / 狀態篩選 |
| 可重複性 | 每次執行產生相同版型、更新資料 snapshot |
