# Dodo Admin 技術棧

本文件整理 `README.md` 提到的主要技術，
並補充目前專案設定檔中可以確認的實際工具。

目標是讓工程師可以快速理解：

- 專案由哪些技術組成
- 每個技術負責哪一層
- 開發、測試與部署會碰到哪些工具

## 一句話總覽

Dodo Admin 以 `FastAPI` 作為後端 API，
以 `React` 作為前端管理介面，
使用 `PostgreSQL` 儲存資料，
並透過 `Docker Compose` 組合本機與部署環境。

```text
Browser
  ↓
React Frontend
  ↓
Generated API Client
  ↓
FastAPI Backend
  ↓
PostgreSQL
```

## 技術分層

| 層級 | 主要技術 | 負責內容 |
|---|---|---|
| 前端 | `React`、`TypeScript`、`Vite` | 管理後台畫面與互動 |
| UI | `Tailwind CSS`、`shadcn/ui`、`Radix UI` | 視覺樣式與基礎元件 |
| 狀態與資料 | `TanStack Query`、`TanStack Router` | API 資料同步與路由 |
| API Client | `@hey-api/openapi-ts` | 依後端規格產生前端呼叫程式 |
| 後端 | `FastAPI` | 提供 REST API 與系統邏輯 |
| 資料模型 | `SQLModel`、`Pydantic` | 資料表映射、驗證與設定 |
| 資料庫 | `PostgreSQL` | 儲存系統資料 |
| 認證 | `JWT`、安全密碼雜湊 | 登入、權杖與密碼保護 |
| 測試 | `Pytest`、`Playwright` | 後端測試與端對端測試 |
| 部署 | `Docker Compose`、`Traefik` | 容器編排、反向代理與 HTTPS |

## 後端技術

後端以 `FastAPI` 為核心，
主要負責 API、認證、資料存取與系統規則。

| 技術 | 用途 |
|---|---|
| `FastAPI` | 建立 Python 後端 API |
| `Pydantic` | 驗證請求、回應與設定資料 |
| `SQLModel` | 定義資料模型與資料庫操作 |
| `Alembic` | 管理資料庫 schema migration |
| `PostgreSQL` | 主要 SQL 資料庫 |
| `PyJWT` | 處理 JWT 登入權杖 |
| `pwdlib` | 提供密碼雜湊能力 |
| `emails`、`Jinja2` | 支援信件內容與模板 |
| `Sentry SDK` | 支援錯誤監控整合 |

後端開發與測試工具：

| 工具 | 用途 |
|---|---|
| `Pytest` | 後端測試 |
| `mypy` | Python 型別檢查 |
| `ruff` | Python lint 與格式規範 |
| `coverage` | 測試覆蓋率 |
| `ty` | Python 型別檢查輔助工具 |

## 前端技術

前端以 `React` 與 `TypeScript` 為核心，
透過 `Vite` 提供開發與建置流程。

| 技術 | 用途 |
|---|---|
| `React` | 建立管理後台 UI |
| `TypeScript` | 提供型別安全 |
| `Vite` | 前端開發伺服器與建置工具 |
| `Tailwind CSS` | Utility-first 樣式系統 |
| `shadcn/ui` | 管理介面常用元件基礎 |
| `Radix UI` | 無障礙互動元件 |
| `lucide-react` | 圖示系統 |
| `TanStack Router` | 前端路由 |
| `TanStack Query` | API 狀態與快取 |
| `TanStack Table` | 資料表格能力 |
| `React Hook Form` | 表單狀態管理 |
| `Zod` | 前端 schema 驗證 |
| `Zustand` | 輕量狀態管理 |
| `next-themes` | 明暗主題切換 |
| `Sonner` | Toast 通知 |

前端開發工具：

| 工具 | 用途 |
|---|---|
| `Bun` | repo root 的前端 workspace 指令入口 |
| `Biome` | 前端 lint 與格式檢查 |
| `Playwright` | 端對端測試 |
| `MSW` | 前端 API mock |
| `@hey-api/openapi-ts` | 產生前端 API client |

## API Client 產生流程

`README.md` 提到前端使用自動產生的 client。

目前前端設定中使用：

```text
@hey-api/openapi-ts
```

它的角色是：

1. 讀取後端 OpenAPI 規格
2. 產生前端可呼叫的 API client
3. 讓前後端共用同一份 API 契約
4. 減少手寫 API 呼叫造成的型別錯誤

## 資料庫與資料管理

系統使用 `PostgreSQL` 作為主要資料庫。

在 `compose.yml` 中可以看到：

| 服務 | 說明 |
|---|---|
| `db` | `PostgreSQL` 資料庫服務 |
| `adminer` | 資料庫管理介面 |
| `app-db-data` | 資料庫資料 volume |

後端透過資料模型與 migration 工具管理資料結構。

```text
SQLModel
  ↓
Alembic Migration
  ↓
PostgreSQL
```

## 認證與安全

`README.md` 提到系統預設包含安全認證能力。

| 能力 | 說明 |
|---|---|
| 安全密碼雜湊 | 密碼不以明文儲存 |
| `JWT` | 使用權杖維持登入狀態 |
| 密碼復原 | 支援 email based password recovery |
| `.env` 設定 | 敏感設定透過環境變數管理 |
| `SECRET_KEY` | 用於系統安全簽章 |

部署前需要更換的敏感設定包含：

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

## 本機開發環境

本機開發主要依靠 `Docker Compose`。

目前專案使用的 compose 檔案：

| 檔案 | 用途 |
|---|---|
| `compose.yml` | 主要服務定義 |
| `compose.override.yml` | 本機開發覆寫設定 |
| `compose.traefik.yml` | Traefik 與 HTTPS 相關設定 |

本機開發服務包含：

| 服務 | 預設用途 |
|---|---|
| `proxy` | 本機 Traefik proxy |
| `db` | PostgreSQL |
| `adminer` | 資料庫管理介面 |
| `backend` | FastAPI 後端 |
| `mailcatcher` | 本機信件測試 |
| `frontend` | 前端容器服務 |
| `playwright` | 端對端測試容器 |

## 測試

專案測試分成後端與前端兩層。

| 範圍 | 工具 | 目的 |
|---|---|---|
| 後端 | `Pytest` | 驗證 API 與後端邏輯 |
| 後端 | `coverage` | 產生測試覆蓋率 |
| 前端 | `Playwright` | 驗證瀏覽器端操作流程 |
| 前端 | `MSW` | 在前端測試中模擬 API |
| CI | `GitHub Actions` | 自動執行檢查流程 |

`README.md` 提到的測試與 CI 包含：

- `Test Docker Compose`
- `Test Backend`
- `Playwright`
- `GitHub Actions`

## 部署

`README.md` 提到部署使用 `Docker Compose`，
並透過 `Traefik` 作為反向代理與 load balancer。

部署相關能力包含：

| 能力 | 說明 |
|---|---|
| Docker image | 後端與前端分別建置映像 |
| Traefik routing | 依 domain 導向 frontend / backend |
| HTTPS | 透過 Let's Encrypt 自動憑證 |
| Healthcheck | 後端提供健康檢查 endpoint |
| GitHub Actions | 支援 CI/CD 流程 |

典型部署流向：

```text
User
  ↓
Traefik
  ↓
Frontend / Backend
  ↓
PostgreSQL
```

## 工程師閱讀順序

第一次理解專案時，建議依序閱讀：

1. `README.md`
2. `backend/README.md`
3. `frontend/README.md`
4. `development.md`
5. `deployment.md`
6. `compose.yml`
7. `compose.override.yml`
8. `frontend/package.json`
9. `backend/pyproject.toml`

## 目前重點

這個專案的技術棧不是單純前端或單純後端，
而是一個完整的 full-stack admin foundation。

它的核心價值在於：

- 後端有 API、資料庫、認證與 migration 基礎
- 前端有路由、資料表、表單、權限 UI 與元件系統
- 測試有後端單元測試與瀏覽器端測試
- 部署有 Docker Compose 與 Traefik 基礎
- API 契約可以透過 OpenAPI 自動同步到前端
