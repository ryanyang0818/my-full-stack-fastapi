# Dodo Admin 部署

本文件整理 `docs/` 目錄內與部署相關的知識，
作為 Dodo Admin 的部署入口文件。

它不是完整逐字教學。
完整原始說明可回頭查：

| 來源文件 | 用途 |
|---|---|
| `docs/deployment_繁體中文.md` | 遠端伺服器、Traefik、DNS、GitHub Actions CD |
| `docs/development_繁體中文.md` | 本機 Docker Compose、localhost URL、logs |
| `docs/專案檔案說明_繁體中文.md` | 根目錄檔案與部署設定檔用途 |
| `docs/常用指令.md` | 常用 Docker、Backend、migration 指令 |
| `docs/DB_Schema_Migration_測試流程_學習筆記.md` | DB schema 與 migration 觀念 |

## 01. 部署定位

Dodo Admin 的部署目標是：

> 將本機可運作的 full-stack admin 系統，
> 放到遠端伺服器上，
> 讓 frontend、backend、database、proxy 可以穩定協作。

部署不是單純啟動一個服務。

它至少包含：

- 遠端伺服器
- Docker Engine
- Docker Compose
- Traefik proxy
- Domain / DNS
- HTTPS 憑證
- `.env` 與 secrets
- PostgreSQL volume
- DB migration
- GitHub Actions CD

## 02. 部署角色總覽

```text
User
  ↓
Domain / DNS
  ↓
Traefik
  ├─ dashboard.<domain> → frontend
  ├─ api.<domain>       → backend
  ├─ adminer.<domain>   → adminer
  └─ traefik.<domain>   → Traefik dashboard
        ↓
PostgreSQL
```

| 角色 | 責任 |
|---|---|
| DNS | 將 domain 與 subdomain 指到伺服器 IP |
| Traefik | 對外接收 HTTP / HTTPS，轉發到各服務 |
| Frontend | 提供後台管理介面 |
| Backend | 提供 API、登入、權限、資料操作 |
| PostgreSQL | 儲存系統資料 |
| Adminer | 提供資料庫管理介面 |
| GitHub Actions | 自動執行 staging / production 部署 |

## 03. 本機與正式環境差異

本機開發與正式部署使用同一套概念，
但 compose 檔案與 domain 行為不同。

| 項目 | 本機開發 | 正式部署 |
|---|---|---|
| 主要指令 | `docker compose watch` | `docker compose -f compose.yml up -d` |
| 主要 compose | `compose.yml` + `compose.override.yml` | 明確指定 `compose.yml` |
| Proxy | `compose.override.yml` 內的 local Traefik | 獨立的 public Traefik |
| Domain | `localhost` 或 `localhost.tiangolo.com` | 自己的正式 domain |
| HTTPS | 本機通常不需要正式憑證 | 透過 Traefik + Let's Encrypt |
| Email | Mailcatcher 攔截 | 需要正式 SMTP 設定 |

正式環境中，不應使用 `compose.override.yml` 的開發覆寫設定。

## 04. Compose 檔案分工

| 檔案 | 用途 |
|---|---|
| `compose.yml` | 主要 stack，定義 `db`、`backend`、`frontend`、`adminer`、`prestart` |
| `compose.override.yml` | 本機開發覆寫，包含 ports、reload、Mailcatcher、local proxy |
| `compose.traefik.yml` | 遠端 public Traefik，處理 HTTPS 與 routing |

部署時的基本關係：

```text
compose.traefik.yml
  ↓
建立 public Traefik
  ↓
compose.yml
  ↓
部署 Dodo Admin stack
```

## 05. 遠端伺服器準備

部署前需要先準備：

| 項目 | 說明 |
|---|---|
| 遠端伺服器 | 可被外部連線的主機 |
| DNS record | domain 指向伺服器 IP |
| wildcard subdomain | 讓 `dashboard`、`api`、`adminer` 等子網域可用 |
| Docker Engine | 遠端伺服器使用 Docker Engine，不是 Docker Desktop |
| Traefik public network | 讓 Traefik 與 stack 服務可以互通 |

建立 Traefik public network：

```bash
docker network create traefik-public
```

## 06. Public Traefik

Traefik 是正式部署的入口。

它負責：

- 接收外部 HTTP / HTTPS 流量
- 根據 subdomain 導向不同服務
- 透過 Let's Encrypt 自動處理 HTTPS 憑證
- 提供 Traefik dashboard

Traefik 需要先設定幾個環境變數：

| 變數 | 用途 |
|---|---|
| `USERNAME` | Traefik dashboard Basic Auth 帳號 |
| `PASSWORD` | Traefik dashboard Basic Auth 密碼 |
| `HASHED_PASSWORD` | Basic Auth 密碼雜湊後的值 |
| `DOMAIN` | 對外 domain |
| `EMAIL` | Let's Encrypt 使用的 email |

啟動 Traefik：

```bash
cd /root/code/traefik-public/
docker compose -f compose.traefik.yml up -d
```

## 07. 環境變數與 Secret

`.env` 是部署最重要的設定來源之一。

它會被 Docker Compose 注入 container，
用來設定 domain、資料庫、登入、email、secret key 等。

部署前至少要確認以下值不是預設的 `changethis`：

| 變數 | 用途 |
|---|---|
| `SECRET_KEY` | 簽署 token 與安全相關資料 |
| `FIRST_SUPERUSER_PASSWORD` | 第一個 superuser 的密碼 |
| `POSTGRES_PASSWORD` | PostgreSQL 密碼 |

建議使用以下方式產生 secret：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

正式部署常見必要設定：

| 變數 | 用途 |
|---|---|
| `ENVIRONMENT` | `staging` 或 `production` |
| `DOMAIN` | 正式 domain |
| `STACK_NAME` | Docker Compose project / labels 使用 |
| `BACKEND_CORS_ORIGINS` | 允許 frontend 呼叫 backend 的 origin |
| `FIRST_SUPERUSER` | 第一個 superuser email |
| `SMTP_HOST` | 正式 email server |
| `SMTP_USER` | email server 帳號 |
| `SMTP_PASSWORD` | email server 密碼 |
| `EMAILS_FROM_EMAIL` | 寄信來源 email |
| `POSTGRES_SERVER` | 預設通常保留 `db` |
| `POSTGRES_DB` | 預設通常保留 `app` |
| `SENTRY_DSN` | 錯誤監控，可選 |

## 08. 正式部署指令

手動部署時，先將程式碼同步到遠端伺服器。

```bash
rsync -av --filter=":- .gitignore" ./ root@your-server.example.com:/root/code/app/
```

進入遠端專案目錄後執行：

```bash
cd /root/code/app/
docker compose -f compose.yml build
docker compose -f compose.yml up -d
```

這裡明確使用 `compose.yml`，
避免自動套用本機開發用的 `compose.override.yml`。

## 09. 資料庫與 Migration

部署時要特別注意 DB schema。

核心觀念：

```text
Model 定義結構
  ↓
Alembic migration file 記錄版本
  ↓
Alembic upgrade 套用到 PostgreSQL
```

重要原則：

| 原則 | 說明 |
|---|---|
| 不手動改正式 DB schema | schema 變更要透過 migration |
| migration file 是版本紀錄 | 可追蹤、可重建、可同步 |
| upgrade 才會真正改 DB | 只改 model 不會改資料庫 |
| 測試資料要可識別 | 避免 teardown 誤刪正式資料 |
| volume 不可亂刪 | PostgreSQL 資料存在 volume 中 |

常用指令：

```bash
docker compose exec backend alembic history
docker compose exec backend alembic upgrade head
```

## 10. 本機部署模擬

本機可以用 Docker Compose 模擬接近正式環境的 domain 行為。

將 `.env` 設定成：

```dotenv
DOMAIN=localhost.tiangolo.com
```

再啟動：

```bash
docker compose watch
```

此時可以使用：

| 服務 | URL |
|---|---|
| Frontend | `http://dashboard.localhost.tiangolo.com` |
| Backend | `http://api.localhost.tiangolo.com` |
| Swagger | `http://api.localhost.tiangolo.com/docs` |
| ReDoc | `http://api.localhost.tiangolo.com/redoc` |
| Adminer | `http://localhost.tiangolo.com:8080` |
| Traefik UI | `http://localhost.tiangolo.com:8090` |
| Mailcatcher | `http://localhost.tiangolo.com:1080` |

一般本機開發也可以直接使用：

| 服務 | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8000` |
| Swagger | `http://localhost:8000/docs` |
| Adminer | `http://localhost:8080` |
| Traefik UI | `http://localhost:8090` |
| Mailcatcher | `http://localhost:1080` |

## 11. GitHub Actions CD

專案文件提到可用 GitHub Actions 進行自動部署。

目前概念上分成：

| Environment | 觸發方式 |
|---|---|
| `staging` | push 或 merge 到 `master` |
| `production` | 發布 release |

遠端伺服器需要安裝 self-hosted runner，
並依 environment 加上對應 label。

GitHub Environments 建議設定：

- environment-specific secrets
- required reviewers
- wait timers
- deployment status tracking

GitHub Actions secrets 包含：

| Secret | 用途 |
|---|---|
| `DOMAIN_PRODUCTION` | production domain |
| `DOMAIN_STAGING` | staging domain |
| `STACK_NAME_PRODUCTION` | production stack name |
| `STACK_NAME_STAGING` | staging stack name |
| `EMAILS_FROM_EMAIL` | 寄信來源 |
| `FIRST_SUPERUSER` | 第一個 superuser |
| `FIRST_SUPERUSER_PASSWORD` | 第一個 superuser 密碼 |
| `POSTGRES_PASSWORD` | PostgreSQL 密碼 |
| `SECRET_KEY` | 系統 secret key |
| `LATEST_CHANGES` | release notes 相關 token |
| `SMOKESHOW_AUTH_KEY` | coverage 發布相關 key |

## 12. 部署前檢查清單

| 檢查 | 狀態 |
|---|---|
| 遠端伺服器可連線 | 待確認 |
| DNS 指向正確 IP | 待確認 |
| wildcard subdomain 生效 | 待確認 |
| Docker Engine 已安裝 | 待確認 |
| `traefik-public` network 已建立 | 待確認 |
| Traefik 已啟動 | 待確認 |
| `.env` 已替換所有 `changethis` | 待確認 |
| `SECRET_KEY` 已重新產生 | 待確認 |
| `POSTGRES_PASSWORD` 已重新設定 | 待確認 |
| `FIRST_SUPERUSER_PASSWORD` 已重新設定 | 待確認 |
| `BACKEND_CORS_ORIGINS` 包含正式 frontend | 待確認 |
| SMTP 設定已準備 | 待確認 |
| migration 已確認 | 待確認 |
| 不使用 `compose.override.yml` 部署正式環境 | 待確認 |

## 13. 部署後檢查清單

| 檢查 | 指令或 URL |
|---|---|
| Compose 專案狀態 | `docker compose ps -a` |
| Backend log | `docker compose logs backend` |
| DB log | `docker compose logs db` |
| Backend health check | `/api/v1/utils/health-check/` |
| Frontend 可開啟 | `https://dashboard.<domain>` |
| API docs 可開啟 | `https://api.<domain>/docs` |
| Adminer 可開啟 | `https://adminer.<domain>` |
| Traefik dashboard 可開啟 | `https://traefik.<domain>` |
| migration 狀態 | `docker compose exec backend alembic history` |

## 14. 常用除錯指令

| 情境 | 指令 |
|---|---|
| 查看 Compose 專案 | `docker compose ls --all` |
| 查看服務狀態 | `docker compose ps -a` |
| 查看所有 container | `docker container ls -a` |
| 看 backend log | `docker compose logs backend` |
| 看 DB log | `docker compose logs db` |
| 進 backend container | `docker compose exec backend bash` |
| 後端健康檢查 | `curl http://localhost:8000/api/v1/utils/health-check/` |
| 套用 migration | `docker compose exec backend alembic upgrade head` |
| `.env` 改後重建 backend | `docker compose up -d --force-recreate backend` |

注意：

```text
不要從 Docker Images 直接按 backend image 的 Play。
那會建立裸 container，
不會吃到 Compose 注入的 .env 與 service network。
```

也不要隨意刪除：

```text
db container
PostgreSQL volume
app-db-data
```

這些會影響資料庫資料。

## 15. 回滾與異常處理

部署異常時，先不要急著刪資料或重建 volume。

建議順序：

```text
確認服務狀態
  ↓
查看 logs
  ↓
確認 env / domain / CORS
  ↓
確認 migration
  ↓
確認 Traefik routing
  ↓
再決定是否回滾 image 或程式碼
```

常見異常方向：

| 問題 | 可能原因 |
|---|---|
| Frontend 開不起來 | frontend container、domain、Traefik routing |
| API 無法呼叫 | backend container、CORS、API domain |
| 登入失敗 | `SECRET_KEY`、DB、第一個 superuser、token |
| DB 連不上 | `POSTGRES_*`、container network、volume |
| HTTPS 失敗 | DNS、Traefik、Let's Encrypt email、443 port |
| migration 錯誤 | migration 未套用、schema 與 model 不一致 |

若涉及正式資料庫，
先備份再做破壞性操作。
