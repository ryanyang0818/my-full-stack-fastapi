# Refine CRUD 模組研究待辦

## 背景

目前專案以 Full Stack Template 作為全端骨架。後續在開發 CRUD、資料列表、表單、權限與管理後台功能前，需要先了解 Refine 已經提供哪些成熟能力，避免重複造輪子。

## To Do

| 狀態 | 任務 | 目的 |
|---|---|---|
| ☐ | 瞭解 Refine 架構中已開發完成的 CRUD 功能 | 確認 Refine 對列表、建立、編輯、刪除、詳情頁、表單、資料請求的支援範圍 |
| ☐ | 盤點 Refine 內建的資料層能力 | 確認 `dataProvider`、API 串接、分頁、排序、篩選、快取等是否可直接使用 |
| ☐ | 確認 Refine 現成模組有哪些可以直接使用 | 例如 Auth、Access Control、Routing、Table、Form、Notification、Audit Log 等 |
| ☐ | 比對 Refine 與目前 Full Stack Template 的重疊功能 | 找出哪些功能已有現成解法，避免重複開發 |
| ☐ | 評估哪些 Refine 模組適合搬概念，不適合直接整合 | 避免破壞目前 FastAPI + React 專案骨架 |
| ☐ | 產出「可借用 / 不建議借用 / 需要自研」清單 | 作為後續開發決策依據 |

## 研究流程

```mermaid
flowchart LR
  A["研究 Refine CRUD"] --> B["盤點現成模組"]
  B --> C["比對目前專案"]
  C --> D["避免重複造輪子"]
  D --> E["決定自研或引用"]
```

## 預期產出

| 類型 | 說明 |
|---|---|
| 可直接使用 | 可以低成本接入或採用的 Refine 模組 |
| 可借用概念 | 不直接整合，但可參考其抽象與 API 設計 |
| 需要自研 | 因技術棧、產品定位或維護成本，應保留在目前專案內自行實作 |
