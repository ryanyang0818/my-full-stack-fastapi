# DB Schema 版本管理與測試流程學習筆記

## 1. 透過文件建立版本

在正式專案中，**DB Schema 不應該直接手動修改資料庫**，而是透過「版本文件」來記錄每一次結構變更。

這類文件通常稱為：

```text
Migration file
```

在這個專案中使用的套件是：

```text
Alembic
```

Alembic 會把每一次資料庫結構異動記錄成一個 Python migration 檔案，例如：

```text
app/alembic/versions/xxxx_add_user_timestamps.py
```

這個檔案就是資料庫結構變更的「版本紀錄」。

| 目的 | 說明 |
|---|---|
| 記錄 schema 變更 | 例如新增欄位、修改欄位、建立資料表 |
| 讓 DB 變更可追蹤 | 每次異動都有版本號 |
| 讓團隊同步 DB 結構 | 其他人可以用同一份 migration 更新資料庫 |
| 讓環境可重建 | 新環境可以從 migration 還原完整 schema |

核心觀念：

```text
DB Schema 的來源不是手動操作資料庫，而是 migration 文件。
```

## 2. 藉由文件更新 DB Schema

建立 migration 文件後，還不代表資料庫已經改變。

真正更新 DB Schema 的動作，是透過 Alembic 讀取 migration 文件，然後套用到 PostgreSQL。

流程是：

```text
SQLModel model
  ↓
Alembic migration file
  ↓
Alembic upgrade
  ↓
PostgreSQL schema 更新
```

這個專案的主要相關套件是：

| 套件 | 用途 |
|---|---|
| `SQLModel` | 定義 Python model 與資料表結構 |
| `Alembic` | 管理 DB schema migration |
| `SQLAlchemy` | Alembic 底層操作 DB schema 的核心工具 |
| `PostgreSQL` | 實際資料庫 |

重要觀念：

```text
修改 models.py 是修改程式對資料表的理解。
套用 migration 才是實際修改資料庫。
```

正確流程是：

```text
先改 model
再產生 migration
檢查 migration
最後套用 migration
```

這樣可以避免：

| 問題 | 說明 |
|---|---|
| 程式和 DB 不一致 | model 有欄位，但 DB 沒欄位 |
| 新環境無法重建 | 因為手動改 DB 沒有留下紀錄 |
| 團隊不同步 | 每個人的 DB schema 可能不同 |
| 測試失準 | 測試環境和開發環境 schema 不一致 |

核心觀念：

```text
Migration file 是 DB Schema 的版本文件。
Alembic upgrade 是把版本文件套用到資料庫。
```

## 3. 藉由腳本進行測試並進行刪除

Schema 更新後，需要透過測試確認程式和資料庫可以正常合作。

這個專案使用：

```text
Pytest
```

測試會建立測試資料，例如：

```text
測試 user
測試 item
```

測試資料的目的不是正式資料，而是用來驗證功能是否正常。

常見測試流程是：

```text
setup
  建立測試需要的資料

test
  執行功能驗證

teardown
  測試結束後清理測試資料
```

相關套件與概念：

| 名稱 | 用途 |
|---|---|
| `Pytest` | Python 測試框架 |
| `fixture` | 測試前準備資料、測試後清理資料 |
| `setup` | 測試前準備 |
| `teardown` | 測試後清理 |
| `TestClient` | 模擬呼叫 FastAPI API |
| `coverage` | 檢查測試覆蓋率 |

重要風險：

```text
如果開發 DB 和測試 DB 共用，teardown 不能全表清空。
```

原本測試中有類似這種邏輯：

```text
刪除全部 User
刪除全部 Item
```

這在「專用測試 DB」可以接受，因為測試 DB 本來就可以丟掉。

但如果目前只有一個開發 DB，這樣會誤刪正式開發資料。

比較成熟的觀念是：

```text
測試只應該刪除自己建立的測試資料。
```

常見做法：

| 做法 | 說明 |
|---|---|
| 使用獨立測試 DB | 最乾淨，例如 `app_test` |
| 測試資料加明確識別 | 例如 email 使用 `@tests.local` |
| teardown 只刪測試資料 | 不碰正式開發資料 |
| seed script 可重複執行 | 即使資料被清掉，也能快速補回 |

核心觀念：

```text
測試腳本可以建立資料，也可以清理資料；
但清理範圍必須被控制。
```

## 總結

整套流程可以理解成：

```text
Model 定義結構
  ↓
Alembic 建立 migration 版本文件
  ↓
Alembic 套用 migration 更新 DB Schema
  ↓
Pytest 驗證功能
  ↓
Teardown 清理測試資料
```

最重要的觀念是：

```text
Schema 變更要版本化。
DB 更新要透過 migration。
測試資料要可識別、可清理、不可誤刪正式資料。
```
