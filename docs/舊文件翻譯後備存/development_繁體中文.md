# FastAPI Project - 開發

## Docker Compose

* 使用 Docker Compose 啟動本機 stack：

```bash
docker compose watch
```

* 現在你可以開啟 browser，並使用以下 URLs：

Frontend，由 Docker build，routes 會根據 path 處理：<http://localhost:5173>

Backend，基於 OpenAPI 的 JSON web API：<http://localhost:8000>

使用 Swagger UI 的自動互動式文件（來自 OpenAPI backend）：<http://localhost:8000/docs>

Adminer，database web administration：<http://localhost:8080>

Traefik UI，用來查看 proxy 如何處理 routes：<http://localhost:8090>

**注意**：第一次啟動 stack 時，可能需要一分鐘才會準備好。Backend 會等待 database 準備完成，並完成所有設定。你可以查看 logs 來監控狀態。

若要查看 logs，請在另一個 terminal 執行：

```bash
docker compose logs
```

若要查看特定 service 的 logs，請加上 service name，例如：

```bash
docker compose logs backend
```

## Mailcatcher

Mailcatcher 是一個簡單的 SMTP server，會攔截本機開發期間 backend 寄出的所有 emails。它不會真的寄出 emails，而是將它們捕捉下來並顯示在 web interface。

這對以下情境很有用：

* 開發期間測試 email 功能
* 驗證 email 內容與格式
* 不寄出真實 emails 的情況下 debug email 相關功能

在本機使用 Docker Compose 執行時，backend 會自動設定為使用 Mailcatcher（SMTP port 1025）。所有被捕捉的 emails 都可以在 <http://localhost:1080> 查看。

## Local Development

Docker Compose 檔案已設定好，讓每個 service 都可以透過 `localhost` 的不同 port 存取。

對 backend 與 frontend 來說，它們使用的 port 和各自本機 development server 會使用的 port 相同。因此 backend 位於 `http://localhost:8000`，frontend 位於 `http://localhost:5173`。

這樣你就可以關閉某個 Docker Compose service，改用該 service 的本機 development server 啟動，而其他部分仍然能正常運作，因為它們都使用相同 ports。

例如，你可以在 Docker Compose 中停止 `frontend` service，並在另一個 terminal 執行：

```bash
docker compose stop frontend
```

然後啟動本機 frontend development server：

```bash
bun run dev
```

或者你也可以停止 Docker Compose 的 `backend` service：

```bash
docker compose stop backend
```

然後執行 backend 的本機 development server：

```bash
cd backend
fastapi dev app/main.py
```

## `localhost.tiangolo.com` 中的 Docker Compose

當你啟動 Docker Compose stack 時，它預設使用 `localhost`，不同 service（backend、frontend、adminer 等）使用不同 ports。

當你將它部署到 production（或 staging）時，它會將每個 service 部署到不同 subdomain，例如 backend 使用 `api.example.com`，frontend 使用 `dashboard.example.com`。

在 [deployment](deployment.md) 指南中，你可以讀到 Traefik，也就是已設定好的 proxy。它負責根據 subdomain 將流量傳送到各個 service。

如果你想在本機測試整體是否正常，可以編輯本機 `.env` 檔案，並修改：

```dotenv
DOMAIN=localhost.tiangolo.com
```

Docker Compose 檔案會使用它來設定 services 的 base domain。

Traefik 會使用這個設定，將 `api.localhost.tiangolo.com` 的流量傳送到 backend，並將 `dashboard.localhost.tiangolo.com` 的流量傳送到 frontend。

`localhost.tiangolo.com` 是一個特殊 domain，它和所有 subdomains 都已設定為指向 `127.0.0.1`。因此你可以用它做本機開發。

更新後，請再次執行：

```bash
docker compose watch
```

部署時，例如 production，主要的 Traefik 會設定在 Docker Compose 檔案之外。對本機開發來說，`compose.override.yml` 中包含一個 Traefik，只是為了讓你測試 domains 是否如預期運作，例如 `api.localhost.tiangolo.com` 與 `dashboard.localhost.tiangolo.com`。

## Docker Compose files and env vars

主要的 `compose.yml` 檔案包含適用於整個 stack 的所有設定，`docker compose` 會自動使用它。

另外還有一個 `compose.override.yml`，包含開發用 overrides，例如將 source code 掛載為 volume。`docker compose` 會自動使用它，並套用在 `compose.yml` 之上。

這些 Docker Compose 檔案會使用 `.env` 檔案中的設定，將其注入 containers 作為環境變數。

它們也會使用一些額外設定，這些設定來自 scripts 在呼叫 `docker compose` 指令前設定的環境變數。

修改變數後，請確認重新啟動 stack：

```bash
docker compose watch
```

## `.env` 檔案

`.env` 檔案包含你的所有設定、產生的 keys、passwords 等。

依照你的 workflow，如果專案是公開的，你可能會想將它排除在 Git 之外。這種情況下，你需要確認 CI tools 在 build 或 deploy 專案時，仍然能取得這些設定。

一種做法是將每個環境變數加入 CI/CD 系統，並更新 `compose.yml` 檔案，讓它讀取特定 env var，而不是讀取 `.env` 檔案。

## Pre-commits and code linting

我們使用一個叫做 [prek](https://prek.j178.dev/) 的工具（[Pre-commit](https://pre-commit.com/) 的現代替代品）來做 code linting 與 formatting。

安裝後，它會在你進行 git commit 前執行。這樣可以確保 code 在 commit 前就已經一致且格式化。

你可以在專案 root 找到 `.pre-commit-config.yaml` 設定檔。

#### 安裝 prek 讓它自動執行

`prek` 已經是這個專案 dependencies 的一部分。

當你已經安裝 `prek` 工具並且可以使用後，你需要在本機 repository 中「安裝」它，讓它在每次 commit 前自動執行。

使用 `uv` 時，你可以這樣做（請確認你位於 `backend` folder）：

```bash
❯ uv run prek install -f
prek installed at `../.git/hooks/pre-commit`
```

`-f` flag 會強制安裝，以防之前已經安裝過 `pre-commit` hook。

現在每當你嘗試 commit，例如：

```bash
git commit
```

...`prek` 會執行並檢查、格式化你即將 commit 的 code，然後要求你再次用 git 加入（stage）那些 code。

接著你可以再次 `git add` 被修改 / 修正的檔案，然後就可以 commit。

#### 手動執行 prek hooks

你也可以手動對所有檔案執行 `prek`，可以透過 `uv` 這樣做：

```bash
❯ uv run prek run --all-files
check for added large files..............................................Passed
check toml...............................................................Passed
check yaml...............................................................Passed
fix end of files.........................................................Passed
trim trailing whitespace.................................................Passed
ruff.....................................................................Passed
ruff-format..............................................................Passed
biome check..............................................................Passed
```

## URLs

Production 或 staging URLs 會使用相同 paths，但會換成你自己的 domain。

### Development URLs

Development URLs，用於本機開發。

Frontend：<http://localhost:5173>

Backend：<http://localhost:8000>

Automatic Interactive Docs（Swagger UI）：<http://localhost:8000/docs>

Automatic Alternative Docs（ReDoc）：<http://localhost:8000/redoc>

Adminer：<http://localhost:8080>

Traefik UI：<http://localhost:8090>

MailCatcher：<http://localhost:1080>

### 已設定 `localhost.tiangolo.com` 的 Development URLs

Development URLs，用於本機開發。

Frontend：<http://dashboard.localhost.tiangolo.com>

Backend：<http://api.localhost.tiangolo.com>

Automatic Interactive Docs（Swagger UI）：<http://api.localhost.tiangolo.com/docs>

Automatic Alternative Docs（ReDoc）：<http://api.localhost.tiangolo.com/redoc>

Adminer：<http://localhost.tiangolo.com:8080>

Traefik UI：<http://localhost.tiangolo.com:8090>

MailCatcher：<http://localhost.tiangolo.com:1080>
