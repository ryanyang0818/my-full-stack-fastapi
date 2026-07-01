# Sidebar 由 Backend Menu API 統一控制

## 背景

目前前端 Sidebar 分成兩套資料來源：

| 區塊 | 目前資料來源 | 問題 |
|---|---|---|
| Main | 前端 `baseItems` 與 `is_superuser` 判斷 | 權限與選單邏輯留在前端 |
| TreeMenu | 前端靜態 `TREE_DATA` | 與後端 `menu` 資料表、角色權限不一致 |

後端已經提供 `GET /api/v1/menus/tree`，回傳目前登入使用者可見的選單樹。後續 Sidebar 應以 Backend 為主要資料來源。

## 目標

將整個前端 Sidebar 的選單內容改由 Backend menu API 控制，包含原本的 `Main` 與 `TreeMenu`。

前端不再自行決定使用者可看到哪些主要功能，而是根據後端傳回的 `MenuTreeNodePublic[]` 渲染。

## Backend 資料模型

前端以 `MenuTreeNodePublic` 作為 Sidebar 的主要資料模型：

| 欄位 | 用途 |
|---|---|
| `id` | React key / 資料唯一識別 |
| `key` | 功能代碼 / 穩定識別 |
| `label` | Sidebar 顯示文字 |
| `path` | 導頁或開啟頁籤 |
| `icon` | Lucide React 元件名稱，例如 `FileText`、`Undo2` |
| `sortOrder` | 排序依據 |
| `children` | 子選單 |

## 前端設計原則

| 決策 | 規則 |
|---|---|
| Sidebar 資料來源 | 使用 `MenusService.readMyMenuTree()` |
| 前端主型別 | 使用 SDK 產生的 `MenuTreeNodePublic` |
| 固定選單 | 不再使用前端硬編碼 `baseItems` 作為主要選單來源 |
| TreeMenu | 改成通用遞迴選單，不再硬分 `Group / Folder / Leaf` |
| Icon | 後端傳 React 元件名稱，前端用 `lucide-react` 匯出物件解析 |
| Icon fallback | 後端傳空值或找不到元件時，使用 `FileText` |
| 無 `path` 節點 | 視為分類節點，可展開但不可導頁 |
| 有 `children` 節點 | 可展開 |
| 有 `path` 節點 | 可點擊；若前端尚不支援該 path，顯示禁用狀態 |
| 搜尋 | 以 `label`、`key`、`path` 做前端過濾 |

## 實作計畫

### 1. 調整 Sidebar 資料取得

在 `AppSidebar` 或專用 hook 中呼叫：

```ts
MenusService.readMyMenuTree()
```

取得目前登入者可見的完整 Sidebar menu tree。

### 2. 合併 Main 與 TreeMenu 的選單來源

移除 `AppSidebar` 中針對 `Dashboard / Items / Admin` 的前端硬編碼主要選單邏輯。

Sidebar 內容統一由後端回傳的樹狀資料決定。

### 3. 改造 TreeMenu 為通用遞迴元件

讓 `TreeMenu` 接收：

```ts
MenuTreeNodePublic[]
```

依據 `children` 是否存在決定是否可展開，不再依賴舊的 `TreeGroup / TreeFolder / TreeLeaf` 型別。

### 4. 建立 Icon 解析機制

前端從 `lucide-react` 取得元件：

```ts
import * as Icons from 'lucide-react'
```

用後端傳來的 `icon` 字串取得 React 元件。

若後端傳空值或不存在的名稱，使用 `FileText`。

### 5. 處理 path 與 Tab 的關係

目前前端已有 `keyForPath()` 與 `useOpenTab()`。

規則如下：

| 狀況 | 行為 |
|---|---|
| `path` 可對應既有 TabKey | 開啟對應頁籤 |
| `path` 存在但前端未支援 | 顯示禁用狀態 |
| `path` 不存在且有 children | 只作為分類節點 |
| `path` 不存在且沒有 children | 顯示禁用狀態 |

### 6. 處理載入與空資料狀態

| 狀態 | 畫面行為 |
|---|---|
| API 載入中 | 顯示 Sidebar skeleton |
| API 成功但沒有資料 | 顯示空狀態 |
| API 失敗 | 顯示空狀態，不讓 Sidebar 崩潰 |

### 7. 移除舊靜態選單依賴

確認 `TREE_DATA` 不再作為正式 Sidebar 資料來源。

若仍需保留，可以只作為 demo 或文件範例，不參與正式畫面。

## 驗收項目

| 項目 | 驗收方式 |
|---|---|
| Sidebar 選單資料來自後端 | `AppSidebar` 不再使用 `baseItems` 與 `TREE_DATA` 作為正式資料來源 |
| Dashboard / Items / Admin 也由後端控制 | 前端不再用 `is_superuser` 決定是否顯示 Admin |
| TreeMenu 可渲染任意層級 | 不依賴 `Group / Folder / Leaf` 固定三層型別 |
| Icon 可由後端控制 | 後端傳 `FileText`、`Undo2` 等 React 元件名稱時，前端能解析 |
| Icon 有 fallback | 無效 icon 不會造成畫面錯誤，會顯示 `FileText` |
| 無 path 節點可作為分類 | 有 children 的無 path 節點可展開 |
| 未支援 path 不會誤導頁 | 無法對應 `TabKey` 的 path 顯示禁用 |
| 搜尋仍可使用 | 可用 `label`、`key`、`path` 搜尋 Sidebar 節點 |
| API 異常不造成畫面崩潰 | 載入失敗時 Sidebar 顯示空狀態 |

## 暫不處理

| 項目 | 原因 |
|---|---|
| 新增測試情境 | 此階段只保存實作計畫 |
| 執行 build 指令 | 此階段不測試 |
| 調整後端 API schema | 目前 `MenuTreeNodePublic` 已足夠支撐 Sidebar |
| 新增 badge 欄位 | 後端目前沒有對應資料 |

## 完成紀錄

實作後依實際驗證結果調整為「固定工作區入口 + Backend Menu API TreeMenu」並存：

| 項目 | 完成狀態 |
|---|---|
| Backend menu API | `AppSidebar` 透過 `MenusService.readMyMenuTree()` 讀取後端選單樹 |
| TreeMenu | 改為接收 `MenuTreeNodePublic[]`，支援遞迴渲染、搜尋、排序、載入與錯誤狀態 |
| 固定入口 | 保留 `Dashboard / Items / Admin`，避免移除既有核心工作區入口 |
| 文件 | 更新 Sidebar 目錄說明，標明固定入口與後端樹狀選單的責任分工 |

驗證紀錄：

| 指令 | 結果 |
|---|---|
| `bunx biome check --write --unsafe --no-errors-on-unmatched --files-ignore-unknown=true src/components/Sidebar/AppSidebar.tsx src/components/Sidebar/docs/目錄說明.md` | 通過 |
| `bunx tsc -p tsconfig.build.json --noEmit` | 通過 |
| `bunx playwright test tests/user-settings.spec.ts -g "Selected mode is preserved across sessions" --project=chromium` | 通過 |
