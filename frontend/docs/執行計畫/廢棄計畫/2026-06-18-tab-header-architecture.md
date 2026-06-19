# Tab Header 架構重構計畫

**日期：** 2026-06-18
**狀態：** 待實作
**作者：** Claude Sonnet 4.6

## 架構目標

將頁籤系統從「單一頁面的元件」升級為「Layout 層的持久 Header」。
頁籤系統成為主導者，Sidebar 點擊不再觸發路由跳轉，改為開啟頁籤。
所有頁籤內容同時 mount 在 DOM，非 active 的用 CSS `hidden` 隱藏，切換時 state 完全保留。

## 架構對比

### 現況
```
Layout
├── AppMenuBar
├── UserHeader
├── Sidebar（RouterLink 跳路由）
└── MainContent
    └── <Outlet />（路由決定內容）
```

### 目標
```
Layout
├── AppMenuBar
├── UserHeader
├── Sidebar（openTab() 開頁籤）
├── TabHeader（ClosableTabs bar，從 store 讀取）
└── MainContent
    ├── <DashboardPage hidden />
    ├── <AdminPage />           ← active，顯示
    └── <ItemsPage hidden />
```

## 架構原則

- 頁籤系統主導導航，路由退居次要
- Sidebar 點擊 → openTab()，不跳路由
- URL 不反映頁籤狀態
- 與頁籤無關的功能（登入、外部連結）仍走路由
- Dashboard 為預設第一個頁籤，`closable: false`

---

## 任務清單

### Phase 1：安裝依賴
- [ ] 安裝 Zustand：`bun add zustand`

### Phase 2：建立 Tab Store
- [ ] 新增 `src/store/tabStore.ts`
  - `TabItem` 型別（id, label, icon, closable, component）
  - `tabs` state（初始值：Dashboard）
  - `activeTab` state
  - `openTab(tab)` — 若已存在則只切換 active，不重複開啟
  - `closeTab(id)` — 關閉後切到前一個或第一個
  - `setActiveTab(id)`

### Phase 3：抽出頁面元件
- [ ] 新增 `src/components/Pages/DashboardPage.tsx`（從 `routes/_layout/index.tsx` 抽出）
- [ ] 新增 `src/components/Pages/AdminPage.tsx`（從 `routes/_layout/admin.tsx` 抽出）
- [ ] 新增 `src/components/Pages/ItemsPage.tsx`（從 `routes/_layout/items.tsx` 抽出）

### Phase 4：改造 ClosableTabs 為受控元件
- [ ] 修改 `src/components/Common/ClosableTabs.tsx`
  - 移除內部 `useState`
  - 改為 props 驅動：`tabs`, `activeTab`, `onTabChange`, `onTabClose`
  - 純展示元件，不持有狀態

### Phase 5：改造 Layout
- [ ] 修改 `src/routes/_layout.tsx`
  - 加入 `TabHeader`（`ClosableTabs` bar，從 store 讀取）
  - `MainContent` 改為渲染所有 tab 的 component，非 active 加 `hidden`
  - 移除 `<Outlet />`（或保留給登入等特殊路由）

### Phase 6：改造 Sidebar
- [ ] 修改 `src/components/Sidebar/AppSidebar.tsx`
  - sidebar item 新增 `component` 欄位，指向對應的 Page 元件
- [ ] 修改 `src/components/Sidebar/Main.tsx`
  - 用 `useTabStore().openTab()` 取代 `<RouterLink>`

---

## 影響檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/store/tabStore.ts` | 新增 | Zustand tab 狀態管理 |
| `src/components/Pages/DashboardPage.tsx` | 新增 | 抽出的 Dashboard 頁面元件 |
| `src/components/Pages/AdminPage.tsx` | 新增 | 抽出的 Admin 頁面元件 |
| `src/components/Pages/ItemsPage.tsx` | 新增 | 抽出的 Items 頁面元件 |
| `src/components/Common/ClosableTabs.tsx` | 修改 | 改為受控元件（props 驅動） |
| `src/routes/_layout.tsx` | 修改 | 加入 TabHeader、改造 MainContent |
| `src/components/Sidebar/AppSidebar.tsx` | 修改 | sidebar items 加 component 欄位 |
| `src/components/Sidebar/Main.tsx` | 修改 | RouterLink → openTab() |
| `src/routes/_layout/index.tsx` | 修改 | 保留路由殼，內容移至 Pages |
| `src/routes/_layout/admin.tsx` | 修改 | 保留路由殼，內容移至 Pages |
| `src/routes/_layout/items.tsx` | 修改 | 保留路由殼，內容移至 Pages |

## 注意事項

- `settings.tsx` 暫不納入頁籤系統（使用者設定頁維持原路由）
- 路由殼保留，確保 `beforeLoad` 守衛（登入驗證）仍然有效
- `ClosableTabs` 改為受控元件後，`test-tab.tsx` 需同步更新，自行管理 state
