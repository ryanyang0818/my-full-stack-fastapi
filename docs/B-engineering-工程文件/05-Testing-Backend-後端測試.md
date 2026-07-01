# Dodo Admin 後端測試

後端測試負責驗證：

- API 是否符合預期
- 資料庫讀寫是否正確
- 登入與權限是否可靠
- migration 後的 schema 是否可用
- 測試資料是否被安全建立與清理

## 測試範圍

| 類型 | 內容 |
|---|---|
| API 測試 | 呼叫後端 route，確認 status code 與 response |
| CRUD 測試 | 確認 create / read / update / delete 行為 |
| 登入測試 | 確認 token、密碼、身份驗證 |
| 權限測試 | 確認無權限時被拒絕 |
| DB 測試 | 確認資料寫入、查詢與關聯正確 |
| migration 檢查 | 確認 DB schema 版本可套用 |
| prestart 測試 | 確認初始化腳本可以正常執行 |

## 測試檔案位置

目前後端測試集中在：

```text
backend/tests/
```

主要結構：

```text
backend/tests/
  conftest.py
  api/
    routes/
      test_hello.py
      test_items.py
      test_login.py
      test_menus.py
      test_private.py
      test_users.py
  crud/
    test_user.py
  scripts/
    test_backend_pre_start.py
    test_test_pre_start.py
  utils/
    item.py
    user.py
    utils.py
```

## 目前測試角色

| 檔案 | 用途 |
|---|---|
| `conftest.py` | 建立測試共用 fixtures |
| `test_items.py` | 驗證 Items API |
| `test_login.py` | 驗證登入與 token |
| `test_menus.py` | 驗證 menu tree 與權限相關行為 |
| `test_users.py` | 驗證使用者管理 |
| `test_private.py` | 驗證受保護 API |
| `crud/test_user.py` | 驗證 user CRUD 相關邏輯 |
| `scripts/*` | 驗證啟動前檢查腳本 |

## 共用測試基礎

`backend/tests/conftest.py` 目前提供：

| fixture | 用途 |
|---|---|
| `db` | 建立共用 DB session，並初始化資料 |
| `client` | 建立 FastAPI `TestClient` |
| `superuser_token_headers` | 取得 superuser token header |
| `normal_user_token_headers` | 取得一般使用者 token header |

目前 `db` fixture 有一個重要保護：

```text
暫時不清空開發資料庫，
避免測試結束後刪除既有 User / Item 資料。
```

這代表後端測試要特別注意測試資料的建立與清理範圍。

## 執行後端測試

常用方式：

```bash
docker compose exec backend pytest
```

如果 stack 已經啟動，也可以使用專案腳本：

```bash
docker compose exec backend bash scripts/tests-start.sh
```

停止在第一個錯誤：

```bash
docker compose exec backend bash scripts/tests-start.sh -x
```

進入 backend container：

```bash
docker compose exec backend bash
```

## 測試前檢查

| 檢查 | 指令 |
|---|---|
| Compose 服務狀態 | `docker compose ps -a` |
| Backend 是否啟動 | `curl http://localhost:8000/api/v1/utils/health-check/` |
| Backend logs | `docker compose logs backend` |
| DB logs | `docker compose logs db` |
| 進入 backend | `docker compose exec backend bash` |

## Migration 檢查

後端測試常會碰到 DB schema。

正確觀念：

```text
Model 定義結構
  ↓
Alembic migration file 記錄版本
  ↓
Alembic upgrade 套用到 PostgreSQL
  ↓
Pytest 驗證功能
```

常用指令：

```bash
docker compose exec backend alembic history
docker compose exec backend alembic upgrade head
```

注意：

- 只改 model 不代表 DB 已更新
- migration file 是 schema 版本紀錄
- 正式或共享 DB 不應手動改 schema
- 測試資料清理不能全表清空

## 測試資料原則

後端測試資料要可識別、可清理、不可誤刪。

| 原則 | 說明 |
|---|---|
| 測試資料有明確標記 | 例如 email 使用測試 domain |
| 只清自己建立的資料 | 不清全表 |
| 避免共用正式資料 | 測試不依賴人手建立的資料 |
| migration 可重跑 | 新環境可重建 schema |
| seed script 可重複執行 | 初始化資料應可冪等 |

## 新增後端測試時機

| 變更類型 | 建議測試 |
|---|---|
| 新增 API route | 測 status code、response schema、錯誤情境 |
| 新增 CRUD | 測 create / read / update / delete |
| 新增權限 | 測允許與拒絕情境 |
| 修改 model | 測 migration 與 API 行為 |
| 修改登入 | 測 token、錯誤密碼、停用帳號 |
| 修改 menu | 測 menu tree 與 role / override |

## 後端測試完成標準

| 項目 | 說明 |
|---|---|
| 相關 API 測試通過 | 功能 route 行為正確 |
| DB schema 已同步 | migration 可套用 |
| 權限情境有覆蓋 | 至少包含允許與拒絕 |
| 測試資料安全 | 不會清掉既有開發資料 |
| 錯誤情境有測 | 不只測 happy path |

