# Dodo Admin API 文件

本文件不是 API endpoint 清單。

API 細節由 FastAPI 自動產生，
人工文件只保留：

- API 文件入口
- API 契約流
- 前端 client 產生結果
- 維護原則

## 01. API 文件入口

本機後端啟動後，可以開啟：

| 路徑 | 用途 |
|---|---|
| `http://localhost:8000/docs` | Swagger UI，可以直接在網頁上測 API |
| `http://localhost:8000/redoc` | ReDoc，偏閱讀型 API 文件 |
| `http://localhost:8000/api/v1/openapi.json` | OpenAPI JSON，給工具產生前端 client |

正式部署時，通常會變成：

| 路徑 | 用途 |
|---|---|
| `https://api.<domain>/docs` | 正式環境 Swagger UI |
| `https://api.<domain>/redoc` | 正式環境 ReDoc |
| `https://api.<domain>/api/v1/openapi.json` | 正式環境 OpenAPI JSON |

簡單理解：

```text
/docs   = 可以操作、可以測 API
/redoc  = 比較像 API 說明書
```

## 02. API 契約流

Dodo Admin 不應該由前端手動猜 API 格式。

正確流程是：

```text
Backend route / schema
  │
  ▼
FastAPI OpenAPI
  │
  ▼
openapi.json
  │
  ▼
openapi-ts
  │
  ▼
frontend/src/client
  │
  ├─ sdk.gen.ts
  ├─ types.gen.ts
  ├─ schemas.gen.ts
  ├─ index.ts
  └─ core/
        ├─ OpenAPI.ts
        ├─ request.ts
        ├─ ApiError.ts
        ├─ ApiRequestOptions.ts
        ├─ ApiResult.ts
        └─ CancelablePromise.ts
  │
  ▼
Frontend components / hooks
```

這條流的意思是：

| 階段 | 說明 |
|---|---|
| Backend route | 後端定義 API endpoint |
| Backend schema | 後端定義 request / response 型別 |
| OpenAPI JSON | FastAPI 自動輸出 API 契約 |
| openapi-ts | 讀取 `openapi.json` 並產生前端 client |
| frontend client | 前端用產生好的 service / type 呼叫 API |
| components / hooks | 前端功能畫面使用 client，不手刻底層 request |

## 03. 前端會產生哪些檔案

目前設定檔：

```text
frontend/openapi-ts.config.ts
```

設定重點：

| 設定 | 目前值 |
|---|---|
| input | `./openapi.json` |
| output | `./src/client` |
| SDK plugin | `@hey-api/sdk` |
| schemas plugin | `@hey-api/schemas` |
| request layer | `legacy/axios` |

目前產出的前端 client 檔案：

| 檔案 | 用途 |
|---|---|
| `frontend/src/client/sdk.gen.ts` | 產生 API service class / method |
| `frontend/src/client/types.gen.ts` | 產生 TypeScript 型別 |
| `frontend/src/client/schemas.gen.ts` | 產生 JSON schema |
| `frontend/src/client/index.ts` | 對外匯出 client 相關內容 |
| `frontend/src/client/core/OpenAPI.ts` | API base URL、token 等設定 |
| `frontend/src/client/core/request.ts` | 實際送出 request 的底層邏輯 |
| `frontend/src/client/core/ApiError.ts` | API 錯誤類型 |
| `frontend/src/client/core/CancelablePromise.ts` | 可取消的 request promise |

## 04. 什麼時候要更新前端 client

只要後端 API 契約改變，
就應該重新產生前端 client。

常見情境：

| 後端變更 | 是否更新 client |
|---|---|
| 新增 endpoint | 要 |
| 修改 request body | 要 |
| 修改 response schema | 要 |
| 修改 path 或 query 參數 | 要 |
| 只改後端內部實作 | 不一定 |
| 只改不影響 schema 的 bug | 不一定 |

## 05. 產生前端 client

前端 `package.json` 目前有：

```json
"generate-client": "openapi-ts"
```

手動流程：

```text
Start backend
  ↓
Download /api/v1/openapi.json
  ↓
Save to frontend/openapi.json
  ↓
Run bun run generate-client
  ↓
Check frontend/src/client changes
```

指令：

```bash
bun run generate-client
```

如果使用專案腳本，
可參考 `frontend/README.md` 提到的：

```bash
bash ./scripts/generate-client.sh
```

## 06. 維護原則

| 原則 | 說明 |
|---|---|
| 不手動列完整 endpoint | `/docs` 已經會列出 |
| 不手動複製 schema | OpenAPI 與產生檔才是準確來源 |
| 不手刻底層 request | 優先使用 `frontend/src/client` |
| 後端契約改了就更新 client | 避免前後端型別不同步 |
| client 產生檔要一起檢查 | `sdk.gen.ts`、`types.gen.ts` 等可能同時改 |

## 07. 和其他文件的分工

| 文件 | 回答問題 |
|---|---|
| `02-architecture-架構` | API 在系統中怎麼流動 |
| `03-development-開發流程` | 改 API 時工程流程怎麼跑 |
| `05-testing-測試` | API 怎麼測 |
| 本文件 | API 文件去哪看、契約怎麼同步 |
