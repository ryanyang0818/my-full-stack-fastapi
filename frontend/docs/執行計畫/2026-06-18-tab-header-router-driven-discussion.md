# Tab Header Router-driven 討論紀錄

**日期：** 2026-06-18  
**作者：** Codex GPT-5  
**狀態：** 第二輪決策已整理，`TabPageHost` 技術方案待研究

---

## 一、目前對齊的核心方向

本次討論已將原本「獨立 tab store 直接主導頁面」的方向，修正為「Router-driven Tab Header」。

也就是：

- 頁面維持 TanStack Router 的 route file，不為了 Tab 額外抽出成 `src/components/Pages/*`。
- Sidebar 點擊仍然走 `RouterLink`，先讓 URL 改變。
- `TabHeaderController` 放在 Layout 中，負責觀察目前 route，並同步已開啟的 tabs；`TabHeader` 只負責 UI。
- 頁面內容由 `TabPageHost` 作為 keep-alive content layer 協調；已開啟 tabs 的 route content 保持 mounted，非 active 用 `hidden`。
- `TabHeader` 不渲染 page component，也不管理頁面內容。

```text
Sidebar / Tab 點擊
→ TanStack Router 導航
→ URL 改變
→ TabHeaderController 監聽 pathname
→ TabHeaderController 使用 routeTabMap 查找 tab metadata
→ TabHeaderController 內部 tabs state 新增 / focus tab
→ TabPageHost 顯示 active tab 的 route content，其他已開啟 tabs 保持 mounted 並 hidden
```

---

## 二、已確定決策

| 編號 | 決策點 | 結論 |
|---|---|---|
| Q1 | URL 與 active tab | URL 永遠代表目前 active tab；點 Tab 也要改 URL |
| Q2 | Sidebar 行為 | 保留 `RouterLink`；先跳路由，再由 `TabHeaderController` 偵測 |
| Q3 | 頁面型態 | 不抽 page component，取消舊計畫的 `src/components/Pages/*` |
| Q7 | 關閉 active tab | 回到左邊前一個 tab |
| Q8 | Dashboard | 預設開啟，不可關閉 |
| Q10 | 權限守衛 | 由 Router `beforeLoad` 先擋；沒有通過就不進 Tab 機制 |
| Q11 | 重整頁面 | `TabHeaderController` 從 `localStorage` 還原 tabs，停在當時 active tab；頁面 local state 不寫入 storage，但透過 `TabPageHost` 不 unmount 自然保留 |
| Q12 | URL 找不到對應 tab | 不做任何動作 |
| Q13 | 同頁多實例 | 允許同一頁面開多個 tab instance |
| Q14 | 對應來源 | 建立 `routeTabMap` |
| Q15 | `TabHeader` | 作為純展示受控元件，不負責 `content`；`ClosableTabs` 可作為參考或後續改名 |
| 新增 | UI 行為 | Tab 可以拖曳改變順序 |
| 新增 | content layer | 建立 `TabPageHost`，負責 keep-alive route content |
| 新增 | `TabPageHost` 放置方式 | 放在 `TabHeaderController` 內部輸出，不採 Layout 分開放 |
| 新增 | `TabItem` 欄位 | `id`、`path`、`title`、`icon`、`closable`、`instanceId`；不存 component |
| 新增 | `tabId` 規則 | `tabId = routeKey + '-' + globalSequence`，全功能共用流水號 |
| 新增 | Sidebar 重複點同功能 | 每次開新的 tab instance |
| 新增 | Tab 標題 | 只顯示功能名稱，不顯示流水號 |
| 新增 | 關閉同頁多實例 | 只關閉該 `tabId` 對應的 instance |
| 新增 | 拖曳排序 | 使用 `@dnd-kit/sortable`，拖曳後立即寫回 `localStorage` |

---

## 三、修正舊計畫的地方

原本 `2026-06-18-tab-header-architecture.md` 偏向以下設計：

- Sidebar 直接呼叫 `openTab()`。
- URL 不反映頁籤狀態。
- Store 存 component。
- 將 route page 抽出為 `src/components/Pages/*`。
- Layout 直接渲染所有 tab component，非 active 用 `hidden`。

本次討論後，這些方向先取消。

新的方向是：

| 項目 | 舊方向 | 新共識 |
|---|---|---|
| 導航主控者 | 獨立 tab store | Router |
| Sidebar 點擊 | `openTab()` | `RouterLink` |
| URL | 不反映 tab | 永遠反映 active tab |
| Page component | 抽出 | 不抽出 |
| MainContent | Tab 自己渲染內容 | `TabPageHost` 保留已開啟 tabs 的 mounted route content |
| Tab Header 模組 | 管內容與標籤 | `TabHeaderController` 管 route 同步；`TabHeader` 管 tab bar UI；`TabPageHost` 管 keep-alive content |

---

## 四、關於 TabPageHost 的暫定理解

在目前採用的 Router-driven 設計中，`TabHeader` 仍然不負責 Tab Content。

但為了讓已開啟頁面不 unmount，需要新增 `TabPageHost` 作為 keep-alive content layer。

`TabHeaderController` 的職責是：

- 根據目前 URL 建立或 focus tab。
- 從 `localStorage` 還原與保存已開啟 tabs。
- 處理 tab 關閉、排序與 active fallback 邏輯。
- 產生 `tabId` 與全域流水號。
- 協調 `TabHeader` 與 `TabPageHost` 的 active 狀態。

`TabHeader` 的職責是：

- 顯示目前開啟的 tab 清單。
- 點 tab 時導向對應 URL。
- 關閉 tab 時導向左側前一個 tab。
- 支援拖曳排序。

`TabPageHost` 的職責是：

- 保留每個已開啟 tab 的 mounted route content。
- active tab 顯示，非 active tabs 使用 `hidden` 隱藏。
- 讓頁面 local state 透過不 unmount 自然保留。
- 不抽出 page component，不把 component 存進 tabs state。

也就是 Router 仍然是導航主控者，`TabHeaderController` 同步導航狀態，`TabHeader` 呈現頁籤 UI，`TabPageHost` 負責 keep-alive content。

元件放置方式採用：

```text
Authenticated Layout
├── AppMenuBar
├── UserHeader
├── Sidebar
└── TabHeaderController
    ├── TabHeader
    └── TabPageHost
```

不採用 Layout 分開放：

```tsx
<TabHeaderController />
<TabPageHost />
```

原因是第一版不獨立 store，tabs state 集中在 `TabHeaderController`。如果分開放，`TabPageHost` 需要額外 Context / Provider 才能取得同一份狀態，會增加第一版複雜度。

需要注意的是：一般單一 `<Outlet />` 只會顯示目前 route，不會自動保留多個 route page instance。`TabPageHost` 如何在「不抽 page component」的前提下保留 mounted route content，是後續需要研究的技術點。

---

## 五、同頁多實例規則

同頁多實例已決定使用 URL query `tabId` 區分。

| 項目 | 規則 |
|---|---|
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

關閉 tab 時，只關閉該 `tabId` 對應的 instance。若關閉的是 active tab：

| 情境 | 行為 |
|---|---|
| 左邊有 tab | 切到左邊前一個 |
| 左邊沒有 tab | 切到右邊第一個 |
| Dashboard | 預設存在且不可關閉 |

---

## 六、關於 Router beforeLoad 與 MainContent

目前共識是權限守衛由 Router `beforeLoad` 先處理。

如果使用者進入 `/admin`，但 `beforeLoad` 判斷沒有權限：

```text
使用者嘗試進入 /admin
→ beforeLoad 執行
→ 權限不通過
→ redirect 到其他 route，例如 /
→ TabHeaderController 只收到最後成功進入的 route
→ TabHeaderController 不開啟 Admin tab
→ TabPageHost 顯示 redirect 後的 route content
```

因此，沒有權限的頁面不應該被加入 `TabHeaderController` 內部 tabs state。

---

## 七、例外頁面問題

使用者提出：如果存在不受 Tab 機制控管的例外頁面，會出現「使用者如何回到頁簽系統」的問題。

目前已決定例外頁面規則如下。

| 類型 | Route / 行為 | 規則 |
|---|---|---|
| Auth | `/login`、`/signup` | 不進 Tab |
| Auth recovery | `/recover-password`、`/reset-password` | 不進 Tab |
| User settings | `/settings` | 不進 Tab；進入前記住上一個 active tab，返回時回上一個 tab |
| Dev test | `/test-tab`、`/test-tab2` | 不進正式 Tab 機制 |
| Error | 404 / error page | 不進 Tab，照 Router 錯誤流程 |
| 外部連結 | external URL | 不進 Tab，另開新瀏覽器分頁 |

---

## 八、拖曳排序規則

| 項目 | 規則 |
|---|---|
| 套件 | `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` |
| 排序結果 | 由 `TabHeaderController` 接收 |
| 持久化 | 拖曳後立即寫回 `localStorage` |
| 重整後 | 維持拖曳後順序 |

---

## 九、第二輪問題狀態

以下整理第二輪討論後的狀態。

| 編號 | 問題 | 狀態 |
|---|---|---|
| R1 | `TabHeaderController` 內部 `TabItem` 是否只存 metadata 與識別資訊，不存 component？ | 已決定：存 `id`、`path`、`title`、`icon`、`closable`、`instanceId`；不存 component |
| R2 | 同頁多實例的 URL 怎麼分辨？ | 已決定：使用 `tabId = routeKey + '-' + globalSequence` |
| R3 | 同頁多實例的標題怎麼顯示？ | 已決定：只顯示功能名稱 |
| R4 | `TabPageHost` 如何在不抽 page component 的前提下保留 mounted route content？ | 待研究，這是 hidden keep-alive 的核心技術問題 |
| R5 | `TabPageHost` 要放在 `TabHeaderController` 內部輸出，還是由 Layout 分開放置？ | 已決定：放在 `TabHeaderController` 內部輸出 |
| R6 | 哪些頁面是例外頁面？ | 已決定，見「例外頁面問題」 |
| R7 | 例外頁面是否用另開視窗 / 新分頁規避 Tab 系統？ | 已決定：外部連結另開新分頁；`/settings` 同視窗 |
| R8 | 從例外頁面回到 Tab 系統時，要回哪裡？ | 已決定：`/settings` 回上一個 active tab；Auth / Error 不處理 |
| R9 | 拖曳排序後是否要寫回 `localStorage`？ | 已決定：拖曳後立即寫回 |
| R10 | 關閉同頁多實例 tab 時，是否只關閉該 instance？ | 已決定：只關閉該 `tabId` instance |

---

## 十、目前建議的下一步

第二輪產品與互動規則已大致對齊。下一步應聚焦在技術研究：

1. 研究 TanStack Router 是否能在不抽 page component 的前提下支援多 route content keep-alive。
2. 確認 `TabPageHost` 是否能保存多個 mounted route instance。
3. 若不可行，再討論替代方案，但不先違反「頁面不抽 component」原則。
4. 研究完成後，再更新正式實作計畫。
