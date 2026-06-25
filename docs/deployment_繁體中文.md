# FastAPI Project - 部署

你可以使用 Docker Compose 將專案部署到遠端伺服器。

這個專案預期你會有一個 Traefik proxy，負責處理對外通訊與 HTTPS 憑證。

你可以使用 CI/CD（continuous integration and continuous deployment，持續整合與持續部署）系統自動部署，專案中已經有 GitHub Actions 的相關設定。

但你必須先設定幾件事。🤓

## 準備

* 準備一台可用的遠端伺服器。
* 設定你的 domain DNS records，讓它們指向你剛建立的伺服器 IP。
* 為你的 domain 設定 wildcard subdomain，讓不同服務可以使用多個 subdomains，例如 `*.fastapi-project.example.com`。這會用來存取不同元件，例如 `dashboard.fastapi-project.example.com`、`api.fastapi-project.example.com`、`traefik.fastapi-project.example.com`、`adminer.fastapi-project.example.com` 等。也會用於 `staging`，例如 `dashboard.staging.fastapi-project.example.com`、`adminer.staging.fastapi-project.example.com` 等。
* 在遠端伺服器安裝並設定 [Docker](https://docs.docker.com/engine/install/)（Docker Engine，不是 Docker Desktop）。

## Public Traefik

我們需要一個 Traefik proxy 來處理進來的連線與 HTTPS 憑證。

接下來這些步驟你只需要做一次。

### Traefik Docker Compose

* 建立一個遠端目錄，用來存放你的 Traefik Docker Compose 檔案：

```bash
mkdir -p /root/code/traefik-public/
```

將 Traefik Docker Compose 檔案複製到你的伺服器。你可以在本機 terminal 執行 `rsync` 指令：

```bash
rsync -a compose.traefik.yml root@your-server.example.com:/root/code/traefik-public/
```

### Traefik Public Network

這個 Traefik 會預期有一個名為 `traefik-public` 的 Docker "public network"，用來和你的 stack(s) 溝通。

如此一來，就會有一個單一的 public Traefik proxy 負責處理和外部世界的通訊（HTTP 與 HTTPS），而在它後面，你可以在同一台伺服器上放一個或多個 stack，並使用不同 domains。

若要建立名為 `traefik-public` 的 Docker "public network"，請在遠端伺服器執行以下指令：

```bash
docker network create traefik-public
```

### Traefik Environment Variables

Traefik Docker Compose 檔案預期你在啟動前，先在 terminal 中設定一些環境變數。你可以在遠端伺服器執行以下指令。

* 建立 HTTP Basic Auth 的 username，例如：

```bash
export USERNAME=admin
```

* 建立 HTTP Basic Auth password 的環境變數，例如：

```bash
export PASSWORD=changethis
```

* 使用 openssl 產生 HTTP Basic Auth password 的 "hashed" 版本，並存入環境變數：

```bash
export HASHED_PASSWORD=$(openssl passwd -apr1 $PASSWORD)
```

若要確認 hashed password 是否正確，可以印出來：

```bash
echo $HASHED_PASSWORD
```

* 建立伺服器 domain name 的環境變數，例如：

```bash
export DOMAIN=fastapi-project.example.com
```

* 建立 Let's Encrypt email 的環境變數，例如：

```bash
export EMAIL=admin@example.com
```

**注意**：你需要設定不同的 email，`@example.com` 的 email 無法使用。

### 啟動 Traefik Docker Compose

前往你在遠端伺服器上複製 Traefik Docker Compose 檔案的目錄：

```bash
cd /root/code/traefik-public/
```

現在環境變數已設定，`compose.traefik.yml` 也已放好，你可以執行以下指令啟動 Traefik Docker Compose：

```bash
docker compose -f compose.traefik.yml up -d
```

## 部署 FastAPI Project

現在 Traefik 已經就位，你可以使用 Docker Compose 部署你的 FastAPI project。

**注意**：你可能會想先跳到 GitHub Actions Continuous Deployment 的章節。

## 複製程式碼

```bash
rsync -av --filter=":- .gitignore" ./ root@your-server.example.com:/root/code/app/
```

注意：`--filter=":- .gitignore"` 會告訴 `rsync` 使用和 git 相同的規則，忽略 git 會忽略的檔案，例如 Python virtual environment。

## Environment Variables

你需要先設定一些環境變數。

### 產生 secret keys

`.env` 檔案中的某些環境變數預設值是 `changethis`。

你必須用 secret key 取代它們。若要產生 secret keys，可以執行以下指令：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

複製輸出內容，並將它作為 password / secret key。然後再次執行指令，產生另一組安全 key。

### 必要 Environment Variables

設定 `ENVIRONMENT`，預設是 `local`（用於開發），但部署到伺服器時，你會設定成類似 `staging` 或 `production`：

```bash
export ENVIRONMENT=production
```

設定 `DOMAIN`，預設是 `localhost`（用於開發），但部署時你會使用自己的 domain，例如：

```bash
export DOMAIN=fastapi-project.example.com
```

將 `POSTGRES_PASSWORD` 設定成不同於 `changethis` 的值：

```bash
export POSTGRES_PASSWORD="changethis"
```

設定 `SECRET_KEY`，用來簽署 tokens：

```bash
export SECRET_KEY="changethis"
```

注意：你可以使用上面的 Python 指令產生安全的 secret key。

將 `FIRST_SUPER_USER_PASSWORD` 設定成不同於 `changethis` 的值：

```bash
export FIRST_SUPERUSER_PASSWORD="changethis"
```

設定 `BACKEND_CORS_ORIGINS`，讓它包含你的 domain：

```bash
export BACKEND_CORS_ORIGINS="https://dashboard.${DOMAIN?Variable not set},https://api.${DOMAIN?Variable not set}"
```

你也可以設定其他幾個環境變數：

* `PROJECT_NAME`：專案名稱，會用於 API docs 與 emails。
* `STACK_NAME`：Docker Compose labels 與 project name 使用的 stack 名稱，`staging`、`production` 等環境應該使用不同名稱。你可以使用同一個 domain，將點號換成 dash，例如 `fastapi-project-example-com` 與 `staging-fastapi-project-example-com`。
* `BACKEND_CORS_ORIGINS`：允許的 CORS origins 清單，使用逗號分隔。
* `FIRST_SUPERUSER`：第一個 superuser 的 email，這個 superuser 可以建立新 users。
* `SMTP_HOST`：用來寄送 emails 的 SMTP server host，通常來自你的 email provider（例如 Mailgun、Sparkpost、Sendgrid 等）。
* `SMTP_USER`：用來寄送 emails 的 SMTP server user。
* `SMTP_PASSWORD`：用來寄送 emails 的 SMTP server password。
* `EMAILS_FROM_EMAIL`：寄送 emails 使用的 email 帳號。
* `POSTGRES_SERVER`：PostgreSQL server 的 hostname。你可以保留預設值 `db`，由同一個 Docker Compose 提供。除非你使用第三方 provider，通常不需要修改。
* `POSTGRES_PORT`：PostgreSQL server 的 port。你可以保留預設值。除非你使用第三方 provider，通常不需要修改。
* `POSTGRES_USER`：Postgres user，你可以保留預設值。
* `POSTGRES_DB`：這個 application 使用的 database name。你可以保留預設值 `app`。
* `SENTRY_DSN`：Sentry 的 DSN，如果你使用 Sentry。

## GitHub Actions Environment Variables

有一些環境變數只會被 GitHub Actions 使用，你可以設定它們：

* `LATEST_CHANGES`：由 GitHub Action [latest-changes](https://github.com/tiangolo/latest-changes) 使用，根據已 merge 的 PRs 自動加入 release notes。它是一個 personal access token，細節請閱讀文件。
* `SMOKESHOW_AUTH_KEY`：用來透過 [Smokeshow](https://github.com/samuelcolvin/smokeshow) 處理並發布 code coverage，請依照它們的說明建立一組（免費的）Smokeshow key。

### 使用 Docker Compose 部署

環境變數設定完成後，你可以使用 Docker Compose 部署：

```bash
cd /root/code/app/
docker compose -f compose.yml build
docker compose -f compose.yml up -d
```

正式環境中你不會想使用 `compose.override.yml` 的 overrides，所以這裡明確指定使用 `compose.yml`。

## Continuous Deployment（CD）

你可以使用 GitHub Actions 自動部署你的專案。😎

你可以有多個 environment deployments。

專案已經設定好兩個 environments：`staging` 與 `production`。🚀

### 安裝 GitHub Actions Runner

* 在遠端伺服器上，為 GitHub Actions 建立一個 user：

```bash
sudo adduser github
```

* 將 Docker 權限加入 `github` user：

```bash
sudo usermod -aG docker github
```

* 暫時切換到 `github` user：

```bash
sudo su - github
```

* 前往 `github` user 的 home directory：

```bash
cd
```

* [依照官方指南安裝 GitHub Action self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners#adding-a-self-hosted-runner-to-a-repository)。

* 當它詢問 labels 時，加入 environment 的 label，例如 `production`。你之後也可以再加入 labels。

安裝完成後，指南會告訴你執行一個指令來啟動 runner。不過，一旦你終止該 process，或本機和伺服器的連線中斷，它就會停止。

為了確保它在開機時啟動並持續執行，你可以將它安裝為 service。要這樣做，先離開 `github` user，回到 `root` user：

```bash
exit
```

完成後，你會回到前一個 user。你也會位於前一個 user 所屬的目錄。

在能前往 `github` user 目錄前，你需要成為 `root` user（你可能已經是）：

```bash
sudo su
```

* 以 `root` user 身分，前往 `github` user home directory 裡的 `actions-runner` 目錄：

```bash
cd /home/github/actions-runner
```

* 使用 `github` user 將 self-hosted runner 安裝為 service：

```bash
./svc.sh install github
```

* 啟動 service：

```bash
./svc.sh start
```

* 檢查 service 狀態：

```bash
./svc.sh status
```

你可以在官方指南閱讀更多內容：[Configuring the self-hosted runner application as a service](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service)。

### 設定 GitHub Environments

部署 workflows 會使用 [GitHub Environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) 管理 `staging` 與 `production`。這會啟用 environment-specific secrets、deployment protection rules（例如 required reviewers、wait timers），以及 deployment status tracking。

若要設定它們，請前往你的 repository **Settings** > **Environments**，並建立 `staging` 與 `production` environments。

### 設定 Secrets

針對每個 GitHub Environment（`staging` 與 `production`），將必要 secrets 設定為 [environment secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-an-environment)。Environment secrets 比 [repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-a-repository) 更推薦，因為它們的 scope 只限於特定 environment，可以降低暴露範圍，並符合你設定的任何 protection rules。

目前 Github Actions workflows 預期以下 secrets：

* `DOMAIN_PRODUCTION`
* `DOMAIN_STAGING`
* `STACK_NAME_PRODUCTION`
* `STACK_NAME_STAGING`
* `EMAILS_FROM_EMAIL`
* `FIRST_SUPERUSER`
* `FIRST_SUPERUSER_PASSWORD`
* `POSTGRES_PASSWORD`
* `SECRET_KEY`
* `LATEST_CHANGES`
* `SMOKESHOW_AUTH_KEY`

## GitHub Action Deployment Workflows

`.github/workflows` 目錄中已經有 GitHub Action workflows，用於部署到 environments（具有對應 labels 的 GitHub Actions runners）：

* `staging`：push（或 merge）到 `master` branch 後。
* `production`：發布 release 後。

兩個 workflows 都會關聯到各自的 GitHub Environments，所以 deployments 會顯示在 repository 的 **Environments** 區塊，並遵守你設定的任何 protection rules。

如果你需要新增額外 environments，可以用這些作為起點。

## URLs

將 `fastapi-project.example.com` 替換成你的 domain。

### Main Traefik Dashboard

Traefik UI：`https://traefik.fastapi-project.example.com`

### Production

Frontend：`https://dashboard.fastapi-project.example.com`

Backend API docs：`https://api.fastapi-project.example.com/docs`

Backend API base URL：`https://api.fastapi-project.example.com`

Adminer：`https://adminer.fastapi-project.example.com`

### Staging

Frontend：`https://dashboard.staging.fastapi-project.example.com`

Backend API docs：`https://api.staging.fastapi-project.example.com/docs`

Backend API base URL：`https://api.staging.fastapi-project.example.com`

Adminer：`https://adminer.staging.fastapi-project.example.com`
