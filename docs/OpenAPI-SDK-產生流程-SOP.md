# OpenAPI SDK 產生流程 SOP

> 適用範圍：本專案後端 API 變更後，更新前端 `src/client/` SDK 的標準流程。

## 1. 這個流程在解決什麼

後端新增或修改 API 後，前端不應該手寫對應的 API 型別與 request function。正確流程是讓 FastAPI 產生 OpenAPI schema，再交給 `@hey-api/openapi-ts` 產生前端 SDK。

```text
backend route / model
→ FastAPI app.openapi()
→ openapi.json
→ @hey-api/openapi-ts
→ frontend/src/client
→ React hook / component 使用 SDK
```

## 2. 關鍵檔案

| 階段 | 檔案 | 責任 |
|---|---|---|
| 後端 app 建立 | `backend/app/main.py` | 建立 FastAPI app，設定 `openapi_url` 與 `generate_unique_id_function` |
| 後端 router 彙整 | `backend/app/api/main.py` | 把各 route module include 進 `api_router` |
| 單一 API route | `backend/app/api/routes/*.py` | 定義 endpoint、request / response model、tag |
| 後端 schema model | `backend/app/models.py` | 定義會進 OpenAPI 的 Pydantic / SQLModel schema |
| OpenAPI 匯出腳本 | `scripts/generate-client.sh` | 用 `app.main.app.openapi()` 匯出 schema，並觸發前端 codegen |
| 前端 codegen 設定 | `frontend/openapi-ts.config.ts` | 指定 input、output、SDK plugin 與命名規則 |
| 前端 codegen 指令 | `frontend/package.json` | `generate-client` script 實際執行 `openapi-ts` |
| 前端 SDK 產物 | `frontend/src/client/` | 自動產生的 API client，不要手改 |

## 3. 後端如何產生 OpenAPI

FastAPI 會從 app 上註冊的 routes 與 response model 產生 OpenAPI schema。

本專案入口在：

```text
backend/app/main.py
```

重點設定：

```python
app = FastAPI(
  title=settings.PROJECT_NAME,
  openapi_url=f'{settings.API_V1_STR}/openapi.json',
  generate_unique_id_function=custom_generate_unique_id,
)
```

其中：

| 設定 | 作用 |
|---|---|
| `openapi_url` | 決定瀏覽器可讀的 OpenAPI JSON 路徑，目前是 `/api/v1/openapi.json` |
| `generate_unique_id_function` | 決定 operationId，例如 `menus-readMyMenuTree` |
| `app.include_router(api_router, prefix=settings.API_V1_STR)` | 把所有 API 加到 `/api/v1` 底下 |

router 彙整在：

```text
backend/app/api/main.py
```

例如選單 API 是這裡被註冊：

```python
from app.api.routes import menus

api_router.include_router(menus.router)
```

## 4. `openapi.json` 的兩種來源

### 4.1 執行中的後端服務

當 backend container 或本機 backend 啟動後，可以在瀏覽器或指令列讀：

```text
http://localhost:8000/api/v1/openapi.json
```

Swagger UI 則是：

```text
http://localhost:8000/docs
```

### 4.2 本機直接呼叫 FastAPI app

專案腳本使用的是這種方式，不是從 HTTP 下載：

```bash
cd backend
uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
cd ..
mv openapi.json frontend/
```

這會直接 import `app.main`，呼叫：

```python
app.main.app.openapi()
```

然後把結果存成：

```text
frontend/openapi.json
```

## 5. 前端如何把 OpenAPI 寫成 SDK

前端 codegen 設定在：

```text
frontend/openapi-ts.config.ts
```

核心設定：

```ts
export default defineConfig({
  input: './openapi.json',
  output: './src/client',
  plugins: [
    'legacy/axios',
    {
      name: '@hey-api/sdk',
      asClass: true,
      operationId: true,
      classNameBuilder: '{{name}}Service',
    },
    {
      name: '@hey-api/schemas',
      type: 'json',
    },
  ],
})
```

意思是：

| 設定 | 作用 |
|---|---|
| `input: './openapi.json'` | 讀 `frontend/openapi.json` |
| `output: './src/client'` | 產物寫到 `frontend/src/client/` |
| `legacy/axios` | 產生 axios 風格的底層 request client |
| `@hey-api/sdk` | 依 OpenAPI operation 產生 `XxxService` |
| `@hey-api/schemas` | 產生 JSON schema |

前端指令在：

```text
frontend/package.json
```

```json
"generate-client": "openapi-ts"
```

所以在 `frontend` 目錄內執行：

```bash
bun run generate-client
```

就會讀 `frontend/openapi.json`，然後覆蓋更新：

```text
frontend/src/client/
```

## 6. 產物說明

| 產物 | 作用 | 是否手改 |
|---|---|---|
| `frontend/src/client/index.ts` | SDK 統一出口 | 否 |
| `frontend/src/client/sdk.gen.ts` | API service class 與 method | 否 |
| `frontend/src/client/types.gen.ts` | 後端 schema 對應的 TypeScript type | 否 |
| `frontend/src/client/schemas.gen.ts` | JSON schema | 否 |
| `frontend/src/client/core/` | axios request、OpenAPI config、錯誤類別 | 否 |

前端業務程式應該從統一出口 import：

```ts
import { MenusService, type MenuTreeNodePublic } from '@/client'
```

不要直接改 `sdk.gen.ts`、`types.gen.ts` 或 `core/` 裡的檔案。下一次 codegen 會覆蓋它們。

## 7. 新增 API 後的標準流程

以 `GET /api/v1/menus/tree` 為例：

| 步驟 | 動作 | 驗證點 |
|---|---|---|
| 1 | 後端新增或修改 route / model | `backend/app/api/routes/menus.py` 與 `backend/app/models.py` 正確 |
| 2 | 確認 route 被 include | `backend/app/api/main.py` 有 `api_router.include_router(menus.router)` |
| 3 | 確認 OpenAPI 看得到 endpoint | `http://localhost:8000/api/v1/openapi.json` 內有 `/api/v1/menus/tree` |
| 4 | 更新 `frontend/openapi.json` | 使用腳本或手動下載 |
| 5 | 重新產生 SDK | 執行 `bun run generate-client` |
| 6 | 檢查 SDK 是否產生 | `frontend/src/client/sdk.gen.ts` 有 `MenusService` |
| 7 | 前端 hook / component 使用 SDK | 例如 `useMenuTree.ts` 呼叫 `MenusService.readMyMenuTree()` |

## 8. 建議執行方式

### 8.1 Bash / Git Bash / WSL 可用時

在 repo root 執行：

```bash
bash ./scripts/generate-client.sh
```

這支腳本會做：

```text
1. 進入 backend
2. 用 uv run python 呼叫 app.openapi()
3. 產生 openapi.json
4. 移到 frontend/openapi.json
5. 執行 bun run --filter frontend generate-client
6. 執行 bun run lint
```

### 8.2 Windows PowerShell 手動流程

如果 Bash 不可用，可用分段方式做：

```powershell
Set-Location backend
uv run python -c "from pathlib import Path; import app.main, json; Path('../frontend/openapi.json').write_text(json.dumps(app.main.app.openapi()), encoding='utf-8')"
Set-Location ..
bun run --filter frontend generate-client
```

不要在 PowerShell 用 `>` 產生 `openapi.json`；舊版 PowerShell 可能寫出非 UTF-8 編碼，導致 `openapi-ts` 解析時出現 `null byte is not allowed in input`。

需要 lint 時再執行：

```powershell
bun run lint
```

## 9. 常見檢查指令

確認 OpenAPI live endpoint：

```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/openapi.json'
```

確認某個 API 是否已進 OpenAPI：

```powershell
(Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/openapi.json').paths.PSObject.Properties.Name |
  Select-String -Pattern 'menus'
```

確認 SDK 是否已產生 menu service：

```powershell
rg -n "MenusService|MenuTreeNodePublic|readMyMenuTree" frontend/src/client
```

## 10. 常見問題

| 問題 | 原因 | 處理 |
|---|---|---|
| Swagger UI 看得到 API，但 SDK 沒有 | `frontend/openapi.json` 還是舊的 | 重新產生 `frontend/openapi.json` 後跑 codegen |
| `MenusService` 不存在 | OpenAPI 沒更新或 codegen 沒跑 | 查 `/api/v1/openapi.json`，再跑 `bun run generate-client` |
| 手改 `src/client` 後消失 | generated files 被覆蓋 | 自訂邏輯放 `src/hooks/`、`src/api/` 或 component，不放 `src/client/` |
| Bash 腳本在 Windows 失敗 | PowerShell 沒有 Bash heredoc / Bash 環境 | 改用 PowerShell 手動流程 |
| route 寫了但 OpenAPI 沒有 | router 沒 include，或 app 沒載入該 router | 檢查 `backend/app/api/main.py` |

## 11. 本專案目前的選單 API 對應

| 項目 | 值 |
|---|---|
| API | `GET /api/v1/menus/tree` |
| Backend route | `backend/app/api/routes/menus.py` |
| Response model | `MenuTreeNodePublic[]` |
| Schema 定義 | `backend/app/models.py` |
| 權限來源 | `view_user_visible_menu` + `menu` |
| 前端待接位置 | `frontend/src/components/Sidebar/AppSidebar.tsx`、`frontend/src/components/Sidebar/TreeMenu.tsx` |

後續 Sidebar 接 API 時，建議保持這個方向：

```text
MenusService.readMyMenuTree()
→ useMenuTree.ts
→ API menu node 轉 Sidebar tree item
→ AppSidebar / TreeMenu render
```

`frontend/src/client/` 只放 generated SDK；轉換、fallback、icon mapping 都放在前端自訂程式碼中。

## 12. 實戰範例：補齊 `MenusService`

### 12.1 任務背景

這次要把後端已存在的選單 API 補進前端 SDK。

| 項目 | 狀態 |
|---|---|
| 後端 API | `GET /api/v1/menus/tree` 已存在 |
| Swagger / OpenAPI | live endpoint 可在 `/api/v1/openapi.json` 查到 `/api/v1/menus/tree` |
| 前端 SDK | `frontend/src/client` 尚未產生 `MenusService` |
| 目標 | 重新產生 SDK，讓前端能從 `@/client` import `MenusService` 與 `MenuTreeNodePublic` |

### 12.2 實際執行順序

先確認工具與工作區狀態：

```powershell
git -c core.quotePath=false status --short --branch
uv --version
bun --version
```

接著從 backend app 直接匯出 OpenAPI schema，並用 UTF-8 寫到 `frontend/openapi.json`：

```powershell
Set-Location backend
uv run python -c "from pathlib import Path; import app.main, json; Path('../frontend/openapi.json').write_text(json.dumps(app.main.app.openapi()), encoding='utf-8')"
Set-Location ..
```

然後重新產生前端 SDK：

```powershell
bun run --filter frontend generate-client
```

驗證 menu SDK 是否產生：

```powershell
rg -n "MenusService|MenuTreeNodePublic|readMyMenuTree" frontend/src/client
```

最後做 build 驗證：

```powershell
bun run --filter frontend build
```

### 12.3 這次成功產生的 SDK 內容

| 檔案 | 新增重點 |
|---|---|
| `frontend/src/client/sdk.gen.ts` | `MenusService.readMyMenuTree()` |
| `frontend/src/client/types.gen.ts` | `MenuTreeNodePublic`、`MenusReadMyMenuTreeResponse` |
| `frontend/src/client/schemas.gen.ts` | `MenuTreeNodePublicSchema` |

產生後可從前端自訂 hook 或 component 這樣使用：

```ts
import { MenusService, type MenuTreeNodePublic } from '@/client'

const menuTree: MenuTreeNodePublic[] = await MenusService.readMyMenuTree()
```

### 12.4 這次遇到的錯誤與修正

第一次用 PowerShell 的 `>` 重新導向產生 `frontend/openapi.json`：

```powershell
uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
```

後續 `openapi-ts` 失敗：

```text
Error parsing frontend/openapi.json: null byte is not allowed in input
```

原因是 PowerShell 重新導向可能寫出非 UTF-8 或帶 null byte 的內容。修正方式是改用 Python 直接寫檔並指定 UTF-8：

```powershell
uv run python -c "from pathlib import Path; import app.main, json; Path('../frontend/openapi.json').write_text(json.dumps(app.main.app.openapi()), encoding='utf-8')"
```

### 12.5 Codegen 副作用處理

`openapi-ts` 會清理 `output: './src/client'`，因此如果 `frontend/src/client/` 底下放了手寫文件或自訂程式，有可能被刪掉。

這次觀察到：

| 被影響項目 | 處理 |
|---|---|
| `frontend/src/client/docs/目錄說明.md` | 還原 |
| `frontend/src/client/core/docs/目錄說明.md` | 還原 |
| `frontend/openapi-ts-error-*.log` | 刪除 crash log |

因此規則是：

```text
src/client/ 應視為 generated output
自訂 hook、轉換器、fallback、icon mapping 不要放進 src/client/
```

### 12.6 完成判定

這次完成時的判定條件：

| 檢查 | 結果 |
|---|---|
| `bun run --filter frontend generate-client` | 成功 |
| `rg "MenusService|MenuTreeNodePublic|readMyMenuTree" frontend/src/client` | 找得到 |
| `bun run --filter frontend build` | 成功 |
| `frontend/src/client` 非 SDK 文件 | 不留下非必要差異 |

這個案例可以作為之後新增 API 後更新前端 SDK 的標準範例。
