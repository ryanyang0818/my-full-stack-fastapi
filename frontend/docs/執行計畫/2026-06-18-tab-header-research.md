# Tab Header 架構研究紀錄

**日期：** 2026-06-18
**作者：** Claude Sonnet 4.6
**狀態：** 研究完成，待實作

---

## 一、問題起源

在 `/test-tab` 頁面實作 `ClosableTabs` 元件後，發現頁籤系統作為「單一頁面的元件」有根本上的局限性：

- AppMenuBar、UserHeader、Sidebar 是 Layout 層的持久元素，不受路由切換影響
- 但 ClosableTabs 只存在於特定路由，無法跨頁面持久存在
- 使用者提問：**「我的 Tab 是不是也應該變成一種 Tab Header，而不是把它當作單一頁面的元件來使用？」**

這個問題引發了架構層面的重要討論。

---

## 二、兩種架構的根本差異

### 架構 A：Tab 作為頁面元件（現況）

```
Layout
├── AppMenuBar    ← 持久
├── UserHeader    ← 持久
├── Sidebar       ← 持久
└── MainContent（p-6 p-8）
    └── <Outlet />
        └── TestTab（ClosableTabs 在這裡）← 只存在於 /test-tab 路由
```

### 架構 B：Tab 作為 Layout Header（目標）

```
Layout
├── AppMenuBar    ← 持久
├── UserHeader    ← 持久
├── Sidebar       ← 持久
├── TabHeader     ← 持久（新層級）
└── MainContent
    ├── <DashboardPage hidden />
    ├── <AdminPage />           ← active，顯示
    └── <ItemsPage hidden />
```

### 對比表

| 面向 | 架構 A（頁面元件） | 架構 B（Layout Header） |
|------|-----------------|----------------------|
| 頁籤何時存在 | 只在特定路由 | 全程持久 |
| 點選 Sidebar | 整頁換內容 | 開新頁籤 |
| 對應的產品 | 一般 SPA | IDE、ERP 多文件介面 |
| 適用情境 | 設定頁分頁、表單分區 | 多文件並存、ERP 作業流 |

---

## 三、架構決策（使用者確立）

| 決策項目 | 決定 | 理由 |
|---------|------|------|
| URL 是否反映頁籤 | **否** | 頁籤切來切去反映 URL 太麻煩 |
| 點擊 Sidebar 行為 | **開新頁籤** | 頁籤系統主導導航 |
| 同一頁面開兩個頁籤 | **暫不討論** | 後續再定義 |
| 與頁籤無關的功能 | **走路由** | 例如登入頁、外部連結 |

---

## 四、參考實作分析

**來源：** `R:\001.工作日誌\06-w25\react-antd-multi-tabs-admin`
**核心元件：** `src/components/common/tabPanes/index.tsx`
**架構方式：** 路由主導（Router-driven）

### 4.1 他的運作流程

```
使用者點 Sidebar
  → history.push('/admin')          ← URL 改變
  → container/index.tsx 偵測 useLocation()
  → getKeyName(pathname) 查元件
  → setPanesItem() 通知 TabPanes
  → TabPanes 新增頁籤並渲染
```

### 4.2 關鍵設計：`getKeyName(path)`

Store 只存路徑字串，不存元件。需要渲染時才動態查找：

```ts
export const getKeyName = (path: string) => {
  const curRoute = flattenRoutes(routes).filter(
    item => item.path.includes(path)
  )
  const { name, key, component } = curRoute[0]
  return { title: name, tabKey: key, component }
}
```

**優點：** 元件不被序列化進 store，路由設定是唯一真實來源。

### 4.3 狀態保留機制：DOM 不 unmount

```jsx
<Tabs
  // destroyInactiveTabPane   ← 這行被「註解掉」= false
>
  {panes.map(pane => (
    <TabPane key={pane.key}>
      <pane.content />   ← 全部同時在 DOM，非 active 的被 CSS 隱藏
    </TabPane>
  ))}
</Tabs>
```

`destroyInactiveTabPane` 預設為 `false`，代表非 active 的頁籤內容不被 unmount，只是 CSS 隱藏。

### 4.4 Redux 狀態管理

```ts
// tabSlice.ts — 只存路徑陣列
{
  curTab: ['/home', '/admin', '/items'],  // 開著哪些頁籤
  reloadPath: 'null'                      // 需要刷新的路徑
}
```

### 4.5 額外功能

- **右鍵選單：** 重新整理、關閉、關閉其他、全部關閉
- **刷新機制：** 設定 `reloadPath`，該頁籤暫時顯示「刷新中...」
- **路由過濾：**
  ```ts
  const noNewTab = ['/login']           // 不開新頁籤的路由
  const noCheckAuth = ['/', '/403']     // 不檢查權限的路由
  ```

---

## 五、兩種實作方式完整對比

| 面向 | 參考實作（他） | 我們的計畫 |
|------|--------------|-----------|
| **主控者** | Router（URL 驅動） | Zustand Store（直接驅動） |
| **URL 變化** | 是（history.push） | 否 |
| **元件查找** | `getKeyName(path)` 從路由設定動態查 | Sidebar item 直接綁定 component |
| **頁籤 UI** | Ant Design Tabs | 我們的 ClosableTabs |
| **非 active 處理** | Ant Design 內建 show/hide | 我們自己用 `hidden` class |
| **狀態管理** | Redux Toolkit | Zustand |
| **權限守衛** | URL 變化觸發 `checkAuth()` | 需要另外處理 |
| **頁面定義** | 頁面仍是路由元件（共用） | 需抽出為獨立元件 |
| **持久化** | Redux Persist（可跨重整） | 未計畫 |

---

## 六、使用者最終偏好方向

> 「我比較喜歡對方的設計。我希望讓頁面維持是頁面，但是在點擊頁面的過程中，我們會去偵測路由，然後藉由這個路由的狀態去製造 Tab。」

**採用方向：路由主導（Router-driven）**

- 頁面維持是路由頁面，不需要抽出為獨立元件
- 偵測路由變化 → 自動建立/切換頁籤
- 路由設定檔是元件的唯一來源

---

## 七、核心技術問題：如何保留頁面狀態

### 問題

當頁籤切換時，暫時不顯示的頁面內容，狀態是否會消失？

### 答案

**不會消失**，前提是使用「CSS 隱藏」而非「條件渲染」。

```tsx
// ❌ 這樣會消失 — 每次切換都 unmount/remount，state 歸零
{activeTab === 'admin' && <AdminPage />}

// ✅ 這樣不會消失 — 全部都在 DOM，state 永遠保留
<div hidden={activeTab !== 'admin'}><AdminPage /></div>
<div hidden={activeTab !== 'items'}><ItemsPage /></div>
```

| 情況 | React state | API 資料（React Query） |
|------|------------|----------------------|
| `hidden` 隱藏（未 unmount） | ✅ 保留 | ✅ 快取保留 |
| 條件渲染移除（unmount） | ❌ 消失 | ✅ 快取保留（React Query） |

**結論：只要用 `hidden` 而非條件渲染，React state 從來沒消失過，不需要「恢復」。**

---

## 八、更新後的實作計畫

### Phase 1：安裝依賴
- [ ] 安裝 Zustand：`bun add zustand`

### Phase 2：建立 Tab Store（路由主導版）

```ts
type TabItem = {
  id: string          // 對應路由 path
  title: string
  icon: LucideIcon
  closable: boolean
}

type TabStore = {
  tabs: TabItem[]
  activeTab: string
  openOrFocusTab: (tab: TabItem) => void  // 已存在則只切換
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
}
```

### Phase 3：路由對應表

建立 `src/lib/routeTabMap.ts`，定義路由路徑 → 頁籤資訊的對應：

```ts
const routeTabMap = {
  '/': { title: 'Dashboard', icon: Home, closable: false },
  '/admin': { title: 'Admin', icon: Users, closable: true },
  '/items': { title: 'Items', icon: Briefcase, closable: true },
}
```

### Phase 4：改造 Layout

- `_layout.tsx` 偵測路由變化 → 呼叫 `openOrFocusTab()`
- 加入 TabHeader（ClosableTabs bar，從 store 讀取）
- MainContent 渲染所有路由的 `<Outlet />` 對應元件，用 `hidden` 切換

### Phase 5：改造 ClosableTabs 為受控元件

- 移除內部 `useState`，改為 props 驅動
- 連接 Zustand store

### Phase 6：Sidebar 調整

- 可選：Sidebar 仍用 RouterLink（URL 改變 → 自動觸發 Phase 4 的偵測）

---

## 九、待釐清事項

| 問題 | 狀態 |
|------|------|
| 同一頁面可以開兩個頁籤嗎？ | 暫緩，後續討論 |
| Settings 頁面是否納入頁籤系統？ | 暫緩 |
| 頁籤是否需要跨重整持久化？ | 未定 |
| 路由 `beforeLoad` 守衛與頁籤系統的協作 | 需設計 |

---

## 十、參考資料

- 參考實作：`R:\001.工作日誌\06-w25\react-antd-multi-tabs-admin`
- 現有計畫：`docs/執行計畫/2026-06-18-tab-header-architecture.md`
- Radix UI Tabs 文件：https://www.radix-ui.com/primitives/docs/components/tabs
