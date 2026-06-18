# Tab Header 元件規格

**日期：** 2026-06-18  
**作者：** Codex GPT-5  
**狀態：** 規格草案，供後續討論沿用

---

## 一、元件定位

本次開發主軸是 `Tab Header`。

`Tab Header` 是登入後 Layout 的一部分，負責呈現目前已開啟的頁籤，並讓使用者可以切換、關閉、拖曳排序頁籤。

它不是一般頁面內部的 Tabs，也不是頁面內容的容器。

```text
Authenticated Layout
├── AppMenuBar
├── UserHeader
├── Sidebar
└── TabHeaderController
    ├── TabHeader
    └── TabPageHost
```

---

## 二、核心架構決策

| 決策點 | 結論 |
|---|---|
| 導航主控者 | TanStack Router |
| active tab 來源 | 目前 URL 與 `tabId` |
| Sidebar 行為 | 保留 `RouterLink`，先改 URL，再由 `TabHeaderController` 偵測 |
| 頁面型態 | 頁面維持 route file，不抽成 `src/components/Pages/*` |
| 頁面內容 | 由 `TabPageHost` 保留已開啟 tabs 的 mounted route content |
| Tab Content | 不由 `TabHeader` UI 管理；由 `TabPageHost` 作為 keep-alive content layer |
| Layout 放置方式 | `_layout.tsx` 只放 `<TabHeaderController />`，由 Controller 內部輸出 `TabHeader` 與 `TabPageHost` |
| Tab metadata 來源 | 建立 `routeTabMap` |
| 權限守衛 | 由 Router `beforeLoad` 先處理 |
| Tab 狀態持久化 | 使用 `localStorage` |
| 同頁多實例 | 允許；`tabId = routeKey + '-' + globalSequence` |
| Sidebar 重複點同功能 | 每次開新的 tab instance |
| Tab 標題 | 只顯示功能名稱，不顯示流水號 |
| Tab 排序 | 使用 `@dnd-kit/sortable`，拖曳後立即寫回 `localStorage` |

---

## 三、元件切分

接受將 `Tab Header` 拆成 `TabHeaderController` 與 `TabHeader`。

| 元件 | 責任 |
|---|---|
| `TabHeaderController` | 路由監聽、查找 metadata、管理 tabs state、處理持久化、處理 close / reorder / active 邏輯，並協調 `TabHeader` 與 `TabPageHost` |
| `TabHeader` | 純 UI，負責畫面呈現、點擊、關閉按鈕、拖曳排序互動 |
| `TabPageHost` | keep-alive content layer，保留已開啟 tabs 的 mounted route content，非 active 用 `hidden` |
| `routeTabMap` | 定義 route path 對應的 tab metadata |

建議第一版檔案：

| 檔案 | 用途 |
|---|---|
| `src/components/TabHeader/TabHeaderController.tsx` | 控制層 |
| `src/components/TabHeader/TabHeader.tsx` | 展示層 |
| `src/components/TabHeader/TabPageHost.tsx` | keep-alive content layer |
| `src/lib/routeTabMap.ts` | route metadata 設定 |

結構修正：
_layout.tsx
└── <TabHeaderController />

TabHeaderController
├── 監聽 pathname
├── 使用 routeTabMap 查 metadata
├── 管理 tabs state
├── 產生 tabId 與全域流水號
├── 讀寫 localStorage
├── 處理 select / close / reorder
├── 傳 props 給 TabHeader
└── 協調 TabPageHost 顯示 active route content

TabHeader
└── 純 UI：顯示、點擊、關閉、拖曳排序

TabPageHost
└── 保留已開啟 tabs 的頁面內容，非 active 用 hidden 隱藏

不採用 Layout 分開放：

```tsx
<TabHeaderController />
<TabPageHost />
```

原因是第一版不獨立 store，tabs state 集中在 `TabHeaderController`。如果 Layout 分開放，`TabPageHost` 需要額外 Context / Provider 才能取得同一份狀態，會增加第一版複雜度。

---

## 四、暫不獨立 tabStore

第一版不建立獨立 `tabStore`。

tabs state 先由 `TabHeaderController` 內部管理。

理由：

- 減少第一版開發複雜度。
- 目前 tab 操作都集中在 `Tab Header` 模組內。
- `localStorage`、拖曳排序、同頁多實例都可以先由 Controller 管理。
- 未來若出現全域開 tab、快捷鍵、跨 Layout 操作，再抽出 store。

| 狀態項目 | 第一版歸屬 |
|---|---|
| 已開啟 tabs | `TabHeaderController` |
| active tab | 由 URL 推導，Controller 同步 |
| tab 順序 | `TabHeaderController` |
| tab 持久化 | `TabHeaderController` 寫入 `localStorage` |
| tabId 全域流水號 | `TabHeaderController` 從 `localStorage` 最大號繼續遞增 |
| route metadata 查找 | `TabHeaderController` 使用 `routeTabMap` |
| mounted route content | `TabPageHost` 保留，`TabHeaderController` 協調 active 狀態 |

---

## 五、資料流

```text
使用者點 Sidebar
→ RouterLink 導航
→ URL 改變
→ TabHeaderController 偵測 pathname
→ routeTabMap 查 metadata
→ 若 URL 沒有 tabId，產生新的 tabId 並導向帶 tabId 的 URL
→ 新增新的 tab instance
→ TabHeader 顯示 tabs
→ TabPageHost 顯示目前 active tab 的 route content，其他已開啟 tabs 保持 mounted 並 hidden
```

點擊 Tab Header 的流程：

```text
使用者點 tab
→ TabHeader 觸發 onTabSelect(tab)
→ TabHeaderController 導航到該 tab 的 URL
→ URL 改變
→ TabPageHost 顯示該 tab 的 route content，其他 tabs 保持 mounted 並 hidden
```

關閉 tab 的流程：

```text
使用者關閉 active tab
→ 移除該 tab
→ 優先導向左邊前一個 tab
→ 若左邊沒有 tab，導向右邊第一個 tab
→ URL 改變
→ TabPageHost 顯示新 active tab 的 route content
```

---

## 六、TabHeaderController 責任範圍

`TabHeaderController` 可以負責以下工作：

| 工作 | 是否由 Controller 負責 |
|---|---|
| 監聽 URL / pathname | 是 |
| 查找 `routeTabMap` | 是 |
| 建立 tab item | 是 |
| 管理 tabs 陣列 | 是 |
| 管理 tab 順序 | 是 |
| 寫入 / 讀取 `localStorage` | 是 |
| 處理 close active tab fallback | 是 |
| 處理拖曳排序結果 | 是 |
| 產生 `tabId` 與全域流水號 | 是 |
| 協調頁面內容顯示 | 是，交給 `TabPageHost` 執行 |
| 管理 route page component | 否 |

---

## 七、TabHeader 責任範圍

`TabHeader` 是純展示與互動元件。

它不應該知道 Router、`routeTabMap`、`localStorage`。

建議 props：

```ts
type TabHeaderProps = {
  tabs: TabItem[]
  activeTabId: string
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabReorder: (tabs: TabItem[]) => void
}
```

---

## 八、TabItem 暫定資料結構

第一版可先用以下概念：

```ts
type TabItem = {
  id: string
  path: string
  title: string
  icon: LucideIcon
  closable: boolean
  instanceId: string
}
```

其中：

| 欄位 | 說明 |
|---|---|
| `id` | tab 唯一識別，需能支援同頁多實例 |
| `path` | 對應 Router path |
| `title` | tab 顯示名稱，只顯示功能名稱 |
| `icon` | tab icon |
| `closable` | 是否可關閉 |
| `instanceId` | 同頁多實例使用，與 `tabId` 對應 |

同頁多實例規則：

| 項目 | 規則 |
|---|---|
| URL query | 使用 `tabId` |
| `tabId` 格式 | `routeKey + '-' + globalSequence` |
| 流水號範圍 | 全功能共用遞增 |
| 關閉後是否重用流水號 | 不重用 |
| 重整後流水號 | 從 `localStorage` 中目前最大流水號繼續 |
| Sidebar 重複點同功能 | 每次開新的 tab instance |
| Tab 標題 | 只顯示功能名稱，例如 `Items`、`Admin`、`Items` |

範例：

```text
/items?tabId=items-1   → Items
/admin?tabId=admin-2   → Admin
/items?tabId=items-3   → Items
```

---

## 九、TabPageHost 責任範圍

`TabPageHost` 是 keep-alive content layer。

它不是 `TabHeader` UI，也不負責 tab bar 操作。

| 工作 | 是否由 TabPageHost 負責 |
|---|---|
| 保留已開啟 tabs 的 mounted route content | 是 |
| 非 active tab 使用 `hidden` 隱藏 | 是 |
| 讓頁面 local state 自然保留 | 是，透過不 unmount |
| 管理 tabs 陣列 | 否 |
| 查找 `routeTabMap` | 否 |
| 管理 `localStorage` | 否 |
| 抽出或持有 page component | 否 |

---

## 十、localStorage 規格

第一版使用 `localStorage` 保存 tabs。

保存內容：

| 資料 | 是否保存 |
|---|---|
| tabs 清單 | 是 |
| tab 順序 | 是 |
| tabId 全域流水號 | 是 |
| active tab | 是，或由最後 URL 推導 |
| 頁面 local state | 不寫入 storage；由 `TabPageHost` 不 unmount 自然保留 |

重整後行為：

```text
讀取 localStorage
→ 還原 tabs 與排序
→ 從已保存 tabs 找出最大流水號，下一個 tabId 繼續遞增
→ 停留在重整前 URL / tabId 對應的 active tab
→ 若 URL 找不到可配對 tab，則不做任何動作
```

---

## 十一、例外頁面規則

以下頁面不進 Tab 機制：

| 類型 | Route / 行為 | 規則 |
|---|---|---|
| Auth | `/login`、`/signup` | 不進 Tab |
| Auth recovery | `/recover-password`、`/reset-password` | 不進 Tab |
| User settings | `/settings` | 不進 Tab；進入前記住上一個 active tab，返回時回上一個 tab |
| Dev test | `/test-tab`、`/test-tab2` | 不進正式 Tab 機制 |
| Error | 404 / error page | 不進 Tab，照 Router 錯誤流程 |
| 外部連結 | external URL | 不進 Tab，另開新瀏覽器分頁 |

---

## 十二、拖曳排序規則

| 項目 | 規則 |
|---|---|
| 套件 | `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` |
| 排序結果 | 由 `TabHeaderController` 接收 |
| 持久化 | 拖曳後立即寫回 `localStorage` |
| 重整後 | 維持拖曳後順序 |

---

## 十三、決策狀態與待研究事項

| 編號 | 問題 | 狀態 |
|---|---|---|
| R1 | `TabItem.id` 與 `instanceId` 如何設計？ | 已決定：使用 `tabId = routeKey + '-' + globalSequence` |
| R2 | 同頁多實例的 URL 如何區分？ | 已決定：使用 URL query `tabId` |
| R3 | 同頁多實例的 tab title 如何命名？ | 已決定：只顯示功能名稱 |
| R4 | `TabPageHost` 如何在不抽 page component 的前提下保留 mounted route content？ | 待研究 |
| R5 | 哪些 route 是例外頁面，不受 Tab 機制控管？ | 已決定，見「例外頁面規則」 |
| R6 | 例外頁面如何回到 Tab 系統？ | 已決定：`/settings` 回上一個 active tab，外部連結另開 |
| R7 | 拖曳排序使用哪個套件或實作方式？ | 已決定：使用 `@dnd-kit/sortable` |

---

## 十四、目前不做的事

| 項目 | 原因 |
|---|---|
| 抽出 `src/components/Pages/*` | 違反頁面維持 route file 的決策 |
| Store 存 component / ReactNode | 會讓狀態與渲染耦合，且不利持久化 |
| `TabHeader` 自己 render page content | 頁面內容由 `TabPageHost` 負責，`TabHeader` 只管 UI |
| 第一版獨立 Zustand store | 目前需求可先由 Controller 管理 |
| 手動保存頁面 local state | `TabPageHost` 透過不 unmount 自然保留，不另外存頁面狀態 |
