# Codex 文件索引

這個資料夾存放 Codex 在本專案工作時要讀取的專案規則、SOP 與背景資料。

## 讀取順序

1. `AGENTS.md`
2. `.codex/README.md`
3. `.codex/SOP.md`
5. `.codex/WORKFLOW.md`

## 文件用途

| 檔案 | 用途 |
|---|---|
| `SOP.md` | 計畫、歸檔與使用者互動規則 |
| `WORKFLOW.md` | 實作、驗證、提交的工作流程 |

## 自動生效方式

Codex 不會天然讀取整個 `.codex` 資料夾。要讓這些文件自動生效，必須透過專案根目錄的 `AGENTS.md` 明確要求 Codex 先讀 `.codex/README.md`，再依索引讀取其他文件。

