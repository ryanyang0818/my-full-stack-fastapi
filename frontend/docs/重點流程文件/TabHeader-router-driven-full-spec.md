# Tab Header Router-driven 完整規格

**日期：** 2026-06-18  
**作者：** Codex GPT-5  
**狀態：** 整合版 v1，`TabPageHost` 技術方案待研究  
**來源文件：**

- `docs/重點流程文件/TabHeaderController + TabHeader-spec.md`
- `docs/執行計畫/2026-06-18-tab-header-router-driven-discussion.md`

---

## 一、規格目的

本文件是 `Tab Header` 架構的整合版規格。

它不是把兩份來源文件直接 append 在一起，而是依目前已確認的產品行為、元件責任、資料結構與待研究技術點，重新整理成後續討論與實作的單一基準。

本次開發主軸是登入後 Layout 內的多頁籤工作流：

- 使用者點 Sidebar 時，仍由 TanStack Router 導航。
- URL 永遠代表目前 active tab。
- `TabHeaderController` 監聽 route 變化，建立與同步 tabs。
- `TabHeader` 只負責頁籤 UI。
- `TabPageHost` 負責 keep-alive content layer，讓已開啟頁面不 unmount。

---

## 二、最終架構語意

```text
Authenticated Layout
├── AppMenuBar
├── UserHeader
├── Sidebar
└── TabHeaderController
    ├── TabHeader
    └── TabPageHost
```

`_layout.tsx` 第一版只放：

```tsx
<TabHeaderController />
```

不採用 Layout 分開放：

```tsx
<TabHeaderController />
<TabPageHost />
```

原因是第一版不獨立 `tabStore`，tabs state 集中在 `TabHeaderController`。如果 `TabPageHost` 和 Controller 分開放，會需要額外 `Context` / `Provider` 共享狀態，增加第一版複雜度。

---

## 三、核心決策總表

| 決策點 | 結論 |
|---|---|
| 導航主控者 | TanStack Router |
| active tab 來源 | 目前 URL 與 `tabId` |
| Sidebar 行為 | 保留 `RouterLink`，先改 URL，再由 `TabHeaderController` 偵測 |
| Sidebar 重複點同功能 | 每次開新的 tab instance |
| 頁面型態 | 頁面維持 route file，不抽成 `src/components/Pages/*` |
| 頁面內容 | 由 `TabPageHost` 保留已開啟 tabs 的 mounted route content |
| Tab Content | 不由 `TabHeader` UI 管理；由 `TabPageHost` 作為 keep-alive content layer |
| Tab metadata 來源 | 建立 `routeTabMap` |
| 權限守衛 | 由 Router `beforeLoad` 先處理 |
| Tab 狀態持久化 | 使用 `localStorage` |
| 同頁多實例 | 允許；`tabId = routeKey + '-' + globalSequence` |
| Tab 標題 | 只顯示功能名稱，不顯示流水號 |
| 關閉 tab | 只關閉該 `tabId` 對應的 instance |
| 關閉 active fallback | 優先左邊前一個；沒有左邊就右邊第一個 |
| Dashboard | 預設開啟，不可關閉 |
| 拖曳排序 | 使用 `@dnd-kit/sortable`，拖曳後立即寫回 `localStorage` |
| `TabPageHost` 技術方案 | 待研究，不先違反「頁面不抽 component」原則 |

---

## 四、與舊方案的差異

原本 `2026-06-18-tab-header-architecture.md` 偏向讓 tab 系統直接主導頁面。

目前已取消那些方向。

| 項目 | 舊方向 | 新共識 |
|---|---|---|
| 導航主控者 | 獨立 tab store | TanStack Router |
| Sidebar 點擊 | 直接 `openTab()` | `RouterLink` 導航，再由 `TabHeaderController` 偵測 |
| URL | 不反映 tab 狀態 | 永遠反映 active tab |
| Page component | 抽出成 `src/components/Pages/*` | 不抽出，維持 route file |
| Store 內容 | 存 component / ReactNode | 只存 tab metadata 與識別資訊 |
| 內容顯示 | Layout 直接 render 所有 component | `TabPageHost` 保留 mounted route content |
| Tab Header | 管內容與標籤 | `TabHeader` 只管 UI；Controller 和 Host 分工 |

---

## 五、模組責任

| 模組 | 責任 |
|---|---|
| `TabHeaderController` | 監聽 route、查 `routeTabMap`、管理 tabs state、產生 `tabId`、讀寫 `localStorage`、處理 select / close / reorder、協調 `TabHeader` 與 `TabPageHost` |
| `TabHeader` | 純 UI，顯示 tabs、點擊切換、關閉按鈕、拖曳排序互動 |
| `TabPageHost` | keep-alive content layer，保留已開啟 tabs 的 mounted route content，非 active 用 `hidden` |
| `routeTabMap` | 定義 route path 對應的 tab metadata |

建議第一版檔案：

| 檔案 | 用途 |
|---|---|
| `src/components/TabHeader/TabHeaderController.tsx` | 控制層 |
| `src/components/TabHeader/TabHeader.tsx` | 展示層 |
| `src/components/TabHeader/TabPageHost.tsx` | keep-alive content layer |
| `src/lib/routeTabMap.ts` | route metadata 設定 |

---

## 六、TabHeaderController 規格

`TabHeaderController` 是第一版的狀態與流程中心。

第一版暫不建立獨立 `tabStore`。

理由：

- 降低第一版開發複雜度。
- 目前 tab 操作集中在 `Tab Header` 模組內。
- `localStorage`、拖曳排序、同頁多實例都可先由 Controller 管理。
- 未來若出現全域開 tab、快捷鍵、跨 Layout 操作，再抽出 store。

責任範圍：

| 工作 | 是否由 Controller 負責 |
|---|---|
| 監聽 URL / pathname | 是 |
| 查找 `routeTabMap` | 是 |
| 建立 `TabItem` | 是 |
| 管理 tabs 陣列 | 是 |
| 管理 active tab | 是，由 URL / `tabId` 同步 |
| 管理 tab 順序 | 是 |
| 產生 `tabId` 與全域流水號 | 是 |
| 寫入 / 讀取 `localStorage` | 是 |
| 處理 close active tab fallback | 是 |
| 處理拖曳排序結果 | 是 |
| 協調頁面內容顯示 | 是，交給 `TabPageHost` 執行 |
| 管理 route page component | 否 |

---

## 七、TabHeader 規格

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

UI 行為：

| 行為 | 規則 |
|---|---|
| 顯示 tab | 顯示 `title`、`icon`、close button |
| 點 tab | 呼叫 `onTabSelect(tabId)` |
| 關閉 tab | 呼叫 `onTabClose(tabId)` |
| 拖曳排序 | 使用 `@dnd-kit/sortable`，排序結果交回 Controller |
| 是否顯示流水號 | 不顯示，標題只顯示功能名稱 |

---

## 八、TabPageHost 規格

`TabPageHost` 是 keep-alive content layer。

它不是 `TabHeader` UI，也不負責 tab bar 操作。

產品目標：

- 每個已開啟 tab 都保留一份 mounted route content。
- active tab 顯示。
- 非 active tabs 使用 `hidden` 隱藏。
- 頁面 local state 透過不 unmount 自然保留，不手動寫入 storage。

責任範圍：

| 工作 | 是否由 `TabPageHost` 負責 |
|---|---|
| 保留已開啟 tabs 的 mounted route content | 是 |
| 非 active tab 使用 `hidden` 隱藏 | 是 |
| 讓頁面 local state 自然保留 | 是，透過不 unmount |
| 管理 tabs 陣列 | 否 |
| 查找 `routeTabMap` | 否 |
| 管理 `localStorage` | 否 |
| 抽出或持有 page component | 否 |

技術注意：

一般單一 `<Outlet />` 只會顯示目前 route，不會自動保留多個 route page instance。`TabPageHost` 如何在「不抽 page component」的前提下保留 mounted route content，是目前最大的技術研究點。

---

## 九、TabItem 資料結構

第一版使用以下概念：

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

| 欄位 | 說明 |
|---|---|
| `id` | tab 唯一識別，與 `tabId` 對應 |
| `path` | 對應 Router path |
| `title` | tab 顯示名稱，只顯示功能名稱 |
| `icon` | tab icon |
| `closable` | 是否可關閉 |
| `instanceId` | 同頁多實例識別，與 `tabId` 對應 |

不存：

| 不存項目 | 原因 |
|---|---|
| component / ReactNode | 避免狀態與渲染耦合，也不利持久化 |
| 頁面 local state | 由 `TabPageHost` 不 unmount 自然保留 |
| API 資料 | 交給 React Query / 頁面原本資料層處理 |

---

## 十、同頁多實例規則

同頁多實例使用 URL query `tabId` 區分。

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

若使用者從 Sidebar 進入 tab route，但 URL 尚未帶 `tabId`，由 `TabHeaderController` 產生新的 `tabId`，並導向帶 `tabId` 的 URL。

---

## 十一、主要資料流

### Sidebar 開新 tab

```text
使用者點 Sidebar
→ RouterLink 導航
→ URL 改變
→ TabHeaderController 偵測 pathname
→ routeTabMap 查 metadata
→ 若 URL 沒有 tabId，產生新的 tabId 並導向帶 tabId 的 URL
→ 新增新的 tab instance
→ TabHeader 顯示 tabs
→ TabPageHost 顯示目前 active tab 的 route content
→ 其他已開啟 tabs 保持 mounted 並 hidden
```

### 點擊 TabHeader

```text
使用者點 tab
→ TabHeader 觸發 onTabSelect(tabId)
→ TabHeaderController 導航到該 tab 的 URL
→ URL 改變
→ TabPageHost 顯示該 tab 的 route content
→ 其他 tabs 保持 mounted 並 hidden
```

### 關閉 tab

```text
使用者關閉 tab
→ TabHeader 觸發 onTabClose(tabId)
→ TabHeaderController 移除該 tabId 對應 instance
→ 若關閉的是 active tab，執行 fallback 導航
→ URL 改變
→ TabPageHost 顯示新 active tab 的 route content
```

關閉 active fallback：

| 情境 | 行為 |
|---|---|
| 左邊有 tab | 切到左邊前一個 |
| 左邊沒有 tab | 切到右邊第一個 |
| Dashboard | 預設存在且不可關閉 |

---

## 十二、localStorage 規格

第一版使用 `localStorage` 保存 tabs。

保存內容：

| 資料 | 是否保存 |
|---|---|
| tabs 清單 | 是 |
| tab 順序 | 是 |
| tabId 全域流水號 | 是 |
| active tab | 是，或由最後 URL / `tabId` 推導 |
| 頁面 local state | 否；由 `TabPageHost` 不 unmount 自然保留 |

重整後行為：

```text
讀取 localStorage
→ 還原 tabs 與排序
→ 從已保存 tabs 找出最大流水號，下一個 tabId 繼續遞增
→ 停留在重整前 URL / tabId 對應的 active tab
→ 若 URL 找不到可配對 tab，則不做任何動作
```

拖曳排序後：

```text
使用者拖曳 tab 改變順序
→ TabHeader 回傳新 tabs 順序
→ TabHeaderController 更新 tabs state
→ 立即寫回 localStorage
```

---

## 十三、routeTabMap 規格

`routeTabMap` 是 tab metadata 的來源。

它只定義 route 與 tab 顯示資訊，不定義頁面 component。

概念資料：

```ts
type RouteTabMeta = {
  routeKey: string
  path: string
  title: string
  icon: LucideIcon
  closable: boolean
}
```

範例：

```ts
const routeTabMap = {
  '/': {
    routeKey: 'dashboard',
    path: '/',
    title: 'Dashboard',
    icon: Home,
    closable: false,
  },
  '/items': {
    routeKey: 'items',
    path: '/items',
    title: 'Items',
    icon: Briefcase,
    closable: true,
  },
}
```

---

## 十四、權限守衛與 beforeLoad

權限守衛由 Router `beforeLoad` 先處理。

如果使用者進入 `/admin`，但權限不足：

```text
使用者嘗試進入 /admin
→ beforeLoad 執行
→ 權限不通過
→ redirect 到其他 route，例如 /
→ TabHeaderController 只收到最後成功進入的 route
→ TabHeaderController 不開啟 Admin tab
→ TabPageHost 顯示 redirect 後的 route content
```

結論：

| 情境 | 規則 |
|---|---|
| `beforeLoad` 成功 | route 可進入 Tab 機制 |
| `beforeLoad` redirect | 只處理 redirect 後成功進入的 route |
| 權限不足頁面 | 不加入 tabs state |

---

## 十五、例外頁面規則

以下頁面不進 Tab 機制：

| 類型 | Route / 行為 | 規則 |
|---|---|---|
| Auth | `/login`、`/signup` | 不進 Tab |
| Auth recovery | `/recover-password`、`/reset-password` | 不進 Tab |
| User settings | `/settings` | 不進 Tab；進入前記住上一個 active tab，返回時回上一個 tab |
| Dev test | `/test-tab`、`/test-tab2` | 不進正式 Tab 機制 |
| Error | 404 / error page | 不進 Tab，照 Router 錯誤流程 |
| 外部連結 | external URL | 不進 Tab，另開新瀏覽器分頁 |

例外頁面返回規則：

| 類型 | 返回規則 |
|---|---|
| `/settings` | 同視窗開，返回時回上一個 active tab |
| 外部連結 | 另開新瀏覽器分頁，不打斷主 Tab 系統 |
| Auth | 不處理回 Tab 系統 |
| Error / 404 | 不處理回 Tab 系統 |
| Dev test | 不納入正式返回規則 |

---

## 十六、拖曳排序規格

| 項目 | 規則 |
|---|---|
| 套件 | `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` |
| 排序結果 | 由 `TabHeaderController` 接收 |
| 持久化 | 拖曳後立即寫回 `localStorage` |
| 重整後 | 維持拖曳後順序 |

預計依賴：

```bash
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 十七、目前不做的事

| 項目 | 原因 |
|---|---|
| 抽出 `src/components/Pages/*` | 違反頁面維持 route file 的決策 |
| Store 存 component / ReactNode | 會讓狀態與渲染耦合，且不利持久化 |
| `TabHeader` 自己 render page content | 頁面內容由 `TabPageHost` 負責，`TabHeader` 只管 UI |
| 第一版獨立 Zustand store | 目前需求可先由 Controller 管理 |
| 手動保存頁面 local state | `TabPageHost` 透過不 unmount 自然保留，不另外存頁面狀態 |
| 先違反「不抽 page component」原則 | `TabPageHost` 技術方案未研究前不採用 |

---

## 十八、待研究事項

目前唯一主要未決是 `TabPageHost` 的技術實作方式。

| 編號 | 問題 | 狀態 |
|---|---|---|
| T1 | TanStack Router 是否能在不抽 page component 的前提下保留多個 mounted route content？ | 待研究 |
| T2 | `TabPageHost` 是否能保存多個 route instance，並用 `hidden` 切換？ | 待研究 |
| T3 | 若無法直接做到，是否有不違反「頁面不抽 component」的替代方案？ | 待研究 |
| T4 | 若技術不可行，是否需要重新討論頁面 component 邊界？ | 待使用者確認 |

技術研究原則：

1. 先研究 TanStack Router 現有能力。
2. 不先假設一定要抽 page component。
3. 不先把 component / ReactNode 放進 tabs state。
4. 若不可行，再回到使用者確認替代方案。

---

## 十九、後續建議

下一步應先進行技術研究，而不是直接實作 UI。

建議順序：

1. 閱讀目前 `src/routes/_layout.tsx` 與 TanStack Router route 結構。
2. 研究 TanStack Router 是否能保留多個 route match / route content instance。
3. 驗證 `TabPageHost` 是否能在不抽頁面的前提下實作 hidden keep-alive。
4. 若可行，再撰寫正式實作計畫。
5. 若不可行，整理替代方案，回來重新決策。

