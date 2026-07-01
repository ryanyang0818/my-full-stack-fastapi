# Dodo Admin 前端測試

前端測試負責驗證：

- 使用者是否能完成畫面操作
- 登入後流程是否正常
- 表單、按鈕、Dialog、Side Panel 是否可用
- Sidebar 與 Tab 工作區是否正確互動
- 前端是否能透過 API client 與後端協作

## 測試範圍

| 類型 | 內容 |
|---|---|
| 登入流程 | 使用帳密登入並保存 storage state |
| 頁面可用性 | 確認主要頁面可開啟 |
| CRUD 畫面 | 新增、編輯、刪除、空狀態 |
| Admin 畫面 | 使用者管理流程 |
| User Settings | 使用者設定、密碼、刪除帳號 |
| Tab 工作區 | 開啟、切換、關閉、拖曳或數量限制 |
| Header / Sidebar | 主版面互動與可見性 |
| Controller | `window.dodo.controller` 類型的前端控制入口 |

## 測試檔案位置

目前前端測試集中在：

```text
frontend/tests/
```

主要結構：

```text
frontend/tests/
  auth.setup.ts
  config.ts
  login.spec.ts
  sign-up.spec.ts
  reset-password.spec.ts
  items.spec.ts
  admin.spec.ts
  user-settings.spec.ts
  tab-header.spec.ts
  header-visibility.spec.ts
  dodo-controller.spec.ts
  utils/
    mailcatcher.ts
    privateApi.ts
    random.ts
    user.ts
```

## 目前測試角色

| 檔案 | 用途 |
|---|---|
| `auth.setup.ts` | 登入一次並保存 `playwright/.auth/user.json` |
| `login.spec.ts` | 驗證登入頁 |
| `sign-up.spec.ts` | 驗證註冊流程 |
| `reset-password.spec.ts` | 驗證密碼重設流程 |
| `items.spec.ts` | 驗證 Items 頁籤與 CRUD 畫面 |
| `admin.spec.ts` | 驗證管理者功能 |
| `user-settings.spec.ts` | 驗證使用者設定 |
| `tab-header.spec.ts` | 驗證頁籤工作區 |
| `header-visibility.spec.ts` | 驗證 header 顯示控制 |
| `dodo-controller.spec.ts` | 驗證前端 controller 入口 |

## Playwright 設定

前端使用：

```text
frontend/playwright.config.ts
```

目前重點設定：

| 設定 | 說明 |
|---|---|
| `testDir` | `./tests` |
| `baseURL` | `http://localhost:5173` |
| `reporter` | local 使用 `html`，CI 使用 `blob` |
| `trace` | retry 時保留 trace |
| `webServer` | 測試前執行 `bun run dev` |
| `storageState` | 使用 `playwright/.auth/user.json` |

測試會先跑 `setup` project，
由 `auth.setup.ts` 登入並保存登入狀態。

```text
auth.setup.ts
  ↓
playwright/.auth/user.json
  ↓
chromium tests
```

## 執行前端測試

常用方式：

```bash
bun run test
```

或直接使用 Playwright：

```bash
bunx playwright test
```

開啟 Playwright UI：

```bash
bunx playwright test --ui
```

可見瀏覽器模式：

```bash
bun run test -- --headed
```

在 Windows PowerShell 中開 CMD 跑 headed 測試：

```powershell
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', 'bun run test -- --headed' -WorkingDirectory 'R:\001.工作日誌\05-w23\my-full-stack-fastapi\frontend'
```

## 測試前檢查

前端測試通常需要後端服務可用。

```bash
docker compose up -d --wait backend
```

或確認目前服務狀態：

```bash
docker compose ps -a
```

確認 backend health check：

```bash
curl http://localhost:8000/api/v1/utils/health-check/
```

## 本機開發伺服器

前端測試設定會自動啟動：

```bash
bun run dev
```

預設 URL：

```text
http://localhost:5173
```

如果需要指定 port 測 worktree 版本：

```bash
bun run --filter frontend dev -- --host 127.0.0.1 --port 5174
```

## 測試資料與登入狀態

前端測試依賴：

- `frontend/tests/config.ts`
- `auth.setup.ts`
- `playwright/.auth/user.json`
- 後端可用的 superuser 帳號

流程是：

```text
Open /login
  ↓
Fill email / password
  ↓
Click Log In
  ↓
Wait for /
  ↓
Save storage state
  ↓
Reuse in later tests
```

如果登入測試失敗，
優先檢查：

| 項目 | 說明 |
|---|---|
| backend 是否啟動 | API 無法連線會導致登入失敗 |
| `.env` 帳號密碼 | superuser 設定是否正確 |
| `playwright/.auth/user.json` | 舊登入狀態是否需要重建 |
| frontend baseURL | 是否仍是 `http://localhost:5173` |

## 新增前端測試時機

| 變更類型 | 建議測試 |
|---|---|
| 新增頁面 | 測頁面可進入、標題、主要區塊 |
| 新增表單 | 測填寫、送出、錯誤提示 |
| 新增 CRUD UI | 測新增、編輯、刪除、空狀態 |
| 新增 Sidebar 功能 | 測選單可見與點擊結果 |
| 新增 Tab 行為 | 測開啟、切換、關閉、限制 |
| 新增權限 UI | 測有權限可見、無權限不可見 |
| 修改 Header / Layout | 測主要區塊不重疊、不消失 |

## 前端測試完成標準

| 項目 | 說明 |
|---|---|
| 使用者流程可完成 | 不是只檢查元素存在 |
| 登入狀態可重用 | `auth.setup.ts` 正常產生 storage state |
| 關鍵互動有驗證 | click、fill、submit、close 等 |
| 錯誤狀態有覆蓋 | 表單錯誤、權限不足、空資料 |
| 不依賴不穩定文字 | locator 應盡量穩定 |
| 測試資料可清理 | 不污染後續測試 |

## 常見問題

| 問題 | 檢查方向 |
|---|---|
| 測試卡在登入 | backend、帳密、storage state |
| 找不到元素 | UI 文案或角色改變，locator 需更新 |
| port 被占用 | 檢查 `5173` 是否已有 dev server |
| API 失敗 | backend 或 `VITE_API_URL` 設定 |
| headed 測試沒看到視窗 | 確認是否真的使用 `--headed` |

