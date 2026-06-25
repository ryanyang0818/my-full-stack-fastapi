# Full Stack FastAPI Template

<a href="https://github.com/fastapi/full-stack-fastapi-template/actions?query=workflow%3A%22Test+Docker+Compose%22" target="_blank"><img src="https://github.com/fastapi/full-stack-fastapi-template/workflows/Test%20Docker%20Compose/badge.svg" alt="Test Docker Compose"></a>
<a href="https://github.com/fastapi/full-stack-fastapi-template/actions?query=workflow%3A%22Test+Backend%22" target="_blank"><img src="https://github.com/fastapi/full-stack-fastapi-template/workflows/Test%20Backend/badge.svg" alt="Test Backend"></a>
<a href="https://coverage-badge.samuelcolvin.workers.dev/redirect/fastapi/full-stack-fastapi-template" target="_blank"><img src="https://coverage-badge.samuelcolvin.workers.dev/fastapi/full-stack-fastapi-template.svg" alt="Coverage"></a>

## 技術堆疊與功能

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) 作為 Python 後端 API。
  - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) 用於 Python SQL 資料庫互動（ORM）。
  - 🔍 [Pydantic](https://docs.pydantic.dev) 由 FastAPI 使用，負責資料驗證與設定管理。
  - 💾 [PostgreSQL](https://www.postgresql.org) 作為 SQL 資料庫。
- 🚀 [React](https://react.dev) 作為前端。
  - 💃 使用 TypeScript、hooks、[Vite](https://vitejs.dev)，以及現代前端堆疊的其他部分。
  - 🎨 [Tailwind CSS](https://tailwindcss.com) 與 [shadcn/ui](https://ui.shadcn.com) 作為前端元件。
  - 🤖 自動產生的前端 client。
  - 🧪 [Playwright](https://playwright.dev) 用於端對端測試。
  - 🦇 支援深色模式。
- 🐋 [Docker Compose](https://www.docker.com) 用於開發與正式環境。
- 🔒 預設提供安全的密碼雜湊。
- 🔑 JWT（JSON Web Token）驗證。
- 📫 基於 email 的密碼復原。
- 📬 [Mailcatcher](https://mailcatcher.me) 用於開發期間的本機 email 測試。
- ✅ 使用 [Pytest](https://pytest.org) 測試。
- 📞 [Traefik](https://traefik.io) 作為反向代理 / 負載平衡器。
- 🚢 使用 Docker Compose 的部署說明，包含如何設定前端 Traefik proxy 來處理自動 HTTPS 憑證。
- 🏭 基於 GitHub Actions 的 CI（continuous integration，持續整合）與 CD（continuous deployment，持續部署）。

### Dashboard 登入

[![API docs](img/login.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Admin

[![API docs](img/dashboard.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Items

[![API docs](img/dashboard-items.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - 深色模式

[![API docs](img/dashboard-dark.png)](https://github.com/fastapi/full-stack-fastapi-template)

### 互動式 API 文件

[![API docs](img/docs.png)](https://github.com/fastapi/full-stack-fastapi-template)

## 如何使用

你可以**直接 fork 或 clone** 這個 repository，並直接使用。

✨ 它可以直接運作。✨

### 如何使用私人 Repository

如果你想要使用私人 repository，GitHub 不允許你直接 fork 後改成私人，因為它不允許修改 fork 的可見性。

但你可以這樣做：

- 建立一個新的 GitHub repo，例如 `my-full-stack`。
- 手動 clone 這個 repository，並使用你想要的專案名稱作為目錄名稱，例如 `my-full-stack`：

```bash
git clone git@github.com:fastapi/full-stack-fastapi-template.git my-full-stack
```

- 進入新的目錄：

```bash
cd my-full-stack
```

- 將新的 origin 設定為你的新 repository，從 GitHub 介面複製，例如：

```bash
git remote set-url origin git@github.com:octocat/my-full-stack.git
```

- 將這個 repo 加為另一個 `remote`，讓你之後可以取得更新：

```bash
git remote add upstream git@github.com:fastapi/full-stack-fastapi-template.git
```

- 將程式碼推送到你的新 repository：

```bash
git push -u origin master
```

### 從原始 Template 更新

在 clone repository 並做了修改之後，你可能會想從這個原始 template 取得最新變更。

- 確認你已經將原始 repository 加為 remote，可以用以下指令檢查：

```bash
git remote -v

origin    git@github.com:octocat/my-full-stack.git (fetch)
origin    git@github.com:octocat/my-full-stack.git (push)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (fetch)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (push)
```

- 下載最新變更，但先不要 merge：

```bash
git pull --no-commit upstream master
```

這會從這個 template 下載最新變更，但不會提交，這樣你可以在 commit 前先檢查一切是否正確。

- 如果有衝突，請在 editor 中解決。

- 完成後，提交變更：

```bash
git merge --continue
```

### 設定

接著你可以更新 `.env` 檔案中的設定，以自訂你的配置。

部署前，請至少確認你已修改以下值：

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

你可以（也應該）透過 secrets 將這些值作為環境變數傳入。

更多細節請閱讀 [deployment.md](./deployment.md) 文件。

### 產生 Secret Keys

`.env` 檔案中的某些環境變數預設值是 `changethis`。

你必須用 secret key 取代它們。若要產生 secret keys，可以執行以下指令：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

複製輸出內容，並將它作為 password / secret key。然後再次執行指令，產生另一組安全 key。

## 如何使用 - Copier 替代方案

這個 repository 也支援使用 [Copier](https://copier.readthedocs.io) 產生新專案。

它會複製所有檔案、詢問你設定問題，並用你的回答更新 `.env` 檔案。

### 安裝 Copier

你可以用以下方式安裝 Copier：

```bash
pip install copier
```

或者更好的方式是，如果你有 [`pipx`](https://pipx.pypa.io/)，可以這樣執行：

```bash
pipx install copier
```

**注意**：如果你有 `pipx`，安裝 copier 是選用的，你也可以直接執行它。

### 使用 Copier 產生專案

決定新專案目錄的名稱，下面會用到。舉例來說，`my-awesome-project`。

前往你想放置專案的父層目錄，然後使用你的專案名稱執行指令：

```bash
copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

如果你有 `pipx`，而且你沒有安裝 `copier`，可以直接執行：

```bash
pipx run copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

**注意**：`--trust` 選項是必要的，因為它需要執行一個 [post-creation script](https://github.com/fastapi/full-stack-fastapi-template/blob/master/.copier/update_dotenv.py)，用來更新你的 `.env` 檔案。

### 輸入變數

Copier 會詢問你一些資料，你可能會想在產生專案前先準備好。

但不用擔心，之後你也可以直接在 `.env` 檔案中更新任何設定。

輸入變數及其預設值（有些會自動產生）如下：

- `project_name`：（預設：`"FastAPI Project"`）專案名稱，會顯示給 API 使用者（在 .env 中）。
- `stack_name`：（預設：`"fastapi-project"`）Docker Compose labels 與 project name 使用的 stack 名稱（不能有空白、不能有句點）（在 .env 中）。
- `secret_key`：（預設：`"changethis"`）專案的 secret key，用於安全性，儲存在 .env 中，你可以用上面的方法產生。
- `first_superuser`：（預設：`"admin@example.com"`）第一個 superuser 的 email（在 .env 中）。
- `first_superuser_password`：（預設：`"changethis"`）第一個 superuser 的 password（在 .env 中）。
- `smtp_host`：（預設：""）用來寄送 email 的 SMTP server host，你可以之後在 .env 中設定。
- `smtp_user`：（預設：""）用來寄送 email 的 SMTP server user，你可以之後在 .env 中設定。
- `smtp_password`：（預設：""）用來寄送 email 的 SMTP server password，你可以之後在 .env 中設定。
- `emails_from_email`：（預設：`"info@example.com"`）寄送 email 使用的 email 帳號，你可以之後在 .env 中設定。
- `postgres_password`：（預設：`"changethis"`）PostgreSQL 資料庫密碼，儲存在 .env 中，你可以用上面的方法產生。
- `sentry_dsn`：（預設：""）Sentry 的 DSN，如果你使用 Sentry，可以之後在 .env 中設定。

## 後端開發

後端文件：[backend/README.md](./backend/README.md)。

## 前端開發

前端文件：[frontend/README.md](./frontend/README.md)。

## 部署

部署文件：[deployment.md](./deployment.md)。

## 開發

一般開發文件：[development.md](./development.md)。

其中包含使用 Docker Compose、自訂本機 domains、`.env` 設定等內容。

## Release Notes

查看 [release-notes.md](./release-notes.md) 檔案。

## License

Full Stack FastAPI Template 採用 MIT license 授權。
