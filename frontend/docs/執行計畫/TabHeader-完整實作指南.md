# 狀態驅動多頁籤系統｜完整實作重現指南（TabHeader v2）

> **文件性質**：教學 / 重現指南（學徒可照抄重現）
> **狀態**：設計定案，程式碼待落地驗證
> **本次改版說明**：本版已將舊的 **Router-driven + display:none keep-alive** 架構**全面改為狀態驅動**——頁籤完全脫離 TanStack Router，唯一真相收斂到單一 Zustand store，內容不做 keep-alive、切走即卸載，登入成功時主動 `reset()` 為唯一重置點。

---

## 章節地圖與建議閱讀順序

| # | 章節 | 交付物 | 相依前章 |
| --- | --- | --- | --- |
| 0 | 總覽：心法、架構、衝突對照、驗證、Checklist、API 契約骨架 | （無程式碼，定義契約） | — |
| 1 | 狀態核心：Zustand `tabStore` + 型別 + 持久化 | `types.ts`、`stores/tabStore.ts` | 0 |
| 2 | 頁籤內容：`tabRegistry` + `TabPageHost` + 內容元件抽取 | `DashboardView.tsx`、`ItemsView.tsx`、`tabRegistry.tsx`、`TabPageHost.tsx` | 0, 1 |
| 3 | 頁籤列 UI：`TabHeader` + 右鍵選單 + dnd 水平排序 | `ui/context-menu.tsx`、`TabHeader.tsx` | 0, 1 |
| 4 | 控制層：`TabHeaderController` + `_layout` 接線 | `TabHeaderController.tsx` | 1, 2, 3 |
| 5 | Items 轉頁籤 + `/items` 失效 + 側邊欄改 `openTab` | `items.tsx` 改寫、`useOpenTab.ts`、`Main.tsx`、`TreeMenu.tsx`、`tabKeyMap.ts` | 1, 2 |
| 6 | 生命週期：localStorage + 登入重置 + F5 還原 + 上限 toast | `useAuth.ts` diff、`useOpenTab.ts` | 1, 5 |

**建議閱讀順序**：嚴格按 0 → 6 順序。第 0 章是「契約守則」，所有後續章節的型別、常數、簽名都以它為唯一準據；先讀完第 0 章再動手，可避免跨章漂移。第 1 章建立唯一真相來源（store），是其餘所有章節的地基。

---

## 改版衝突對照表（最重要，務必先看）

| # | 議題 | 舊作法（Router-driven） | 新作法（狀態驅動） | 影響 / 為什麼 |
| --- | --- | --- | --- | --- |
| 1 | 導航主控 | TanStack Router 主控，開頁籤 = `navigate` 改網址 | Router 完全退場；頁籤只動 store | 網址不再被頁籤污染，上一頁/下一頁與頁籤無關 |
| 2 | 開頁籤 | `<RouterLink to>` / `navigate` 觸發路由 | `useOpenTab(key)` → `store.openTab(key)` | 側邊欄改呼叫 hook；不再依賴路由表 |
| 3 | 狀態來源 | URL `search` 參數 | 唯一真相 = `useTabStore` | 單一控管點，型別與序列化複雜度大降 |
| 4 | keep-alive | `display:none` 多頁常駐 DOM | 移除；`TabPageHost` 只渲染 active 頁 | 記憶體可控；內部狀態不留（路線 B） |
| 5 | Items | 獨立路由 `/_layout/items`（`ItemsRoute` 殼 → `ItemsPage`，內用 `DataTable` + `columns`） | 移除路由，抽成 `ItemsView` 純元件，由 `openTab("items")` 開啟 | `/items` 失效並 redirect 回首頁；舊 `<RouterLink to="/items">` 逐一改 |
| 6 | 持久化 / 登入重置 | 靠 URL + mount 行為 | persist 到 localStorage；**唯一重置點 = 登入成功** | 登入 = 全新（reset）、F5 = 沿用舊清單（rehydrate）；只有一個控管點 |
| 7 | 關閉 fallback 方向 | （舊版多為往左遞補） | **關 active → 右邊遞補，沒右邊才往左** | 方向相反，需在 `closeTab` 嚴格實作 |
| 8 | 去重 | 同功能傾向去重/聚焦既有頁 | **不去重**，一律可重複開（同名不編號） | 同功能可多開、各帶各自狀態 |
| 9 | 固定頁籤鎖定 | 無明確固定頁概念 | `dashboard` 永久最左、無 X、不可關、不可拖、不可被插到前面 | `reorder` 目標 index clamp `>= 1`；`close*` 一律略過固定頁 |
| 10 | tabId 入網址 | 頁籤識別碼出現在 URL | **tabId 不入網址**，`crypto.randomUUID()` / 遞增 counter 產生 | 識別碼純內部，不可被使用者操控或分享 |
| 11 | 上限 | 無硬上限 | `MAX_TABS = 20`，第 21 個硬擋 + toast「已達上限（20），請先關閉再開」 | 不自動關閉舊頁；`openTab` 回傳 `false` 表示未開 |
| 12 | 右鍵選單 | 無 / 不一致 | 三項：① 關閉本頁籤 ② 關閉右側 ③ 關閉全部（固定頁不受影響） | 需 `bun add @radix-ui/react-context-menu` 並新增 `context-menu.tsx` |
| 13 | URL search 型別議題 | 需為頁籤清單設計 search schema + 校驗 | **議題消失** | search 不再承載頁籤狀態，無需 schema |
| 14 | Activity / 上一頁下一頁議題 | 頁籤開關混進瀏覽器歷史 | **議題消失** | 歷史只反映真實路由頁導航 |
| 15 | settings / test-tab 誤開 | 打網址或點路由會莫名多一個頁籤 | **自然消解** | 路由頁與頁籤系統徹底分離，路由頁不會生成頁籤 |

---

## 第 0 章｜總覽：心法、架構與 API 契約

### 0.1 一句話心法

> **Store 管狀態、Controller 管組合、TabHeader 管 UI、TabPageHost 管當前渲染、Router 完全退場。**

| 角色 | 唯一職責 | 紅線（絕不做的事） |
| --- | --- | --- |
| `useTabStore`（Zustand） | 唯一真相：誰開著、什麼順序、誰 active；persist 到 localStorage | 不碰 DOM、不碰 Router、不渲染 JSX |
| `TabHeaderController` | 極薄組合器：把 store 狀態接到 `TabHeader` + `TabPageHost` | 不放業務邏輯、不自己管狀態 |
| `TabHeader` | 純 UI：頁籤列、dnd 水平排序、右鍵選單 | 不決定「渲染哪一頁」、不持有資料來源 |
| `TabPageHost` | 只渲染 `activeId` 對應的那一頁（讀 store + `tabRegistry`） | 不做 keep-alive、不快取非 active 頁 |
| TanStack Router | 只負責「路由頁」（會改網址的既有頁） | **完全不參與**頁籤的顯示、active 標記、開關 |

### 0.2 為什麼從 Router-driven 改為狀態驅動

舊架構前提是「頁籤 = 路由」，帶來四個結構性負擔：

1. **網址被頁籤狀態綁架** — 上一頁/下一頁、分享連結、瀏覽器歷史全被頁籤開關污染；同功能多開（兩個 Items）時 URL 無法表達。
2. **keep-alive 記憶體不可控** — `display:none` 讓所有開過的頁常駐 DOM 與記憶體，頁數一多就拖垮效能。
3. **URL search 型別地獄** — 開了哪些頁、順序、active 都要編碼進 search，型別校驗與序列化成持續維護成本。
4. **誤開路由頁** — 直接打網址或點到 `settings`、`test-tab` 就會莫名多一個頁籤，邊界模糊。

新架構一次拆掉這些前提：**頁籤完全脫離 Router，唯一真相收斂到一個 Zustand store**。網址走「路線 A：完全不碰」，生命週期走「路線 B：只存輕量清單、內容各自重載」。

### 0.3 架構與資料流（單向）

```
            點側邊欄選單
                 │
                 ▼
        useOpenTab(key)  ──(上限則 toast)──►  sonner
                 │
                 ▼
        ┌─────────────────────────────┐
        │   useTabStore (Zustand)      │  ◄── 唯一真相
        │   tabs[] / activeId          │      persist → localStorage
        │   open/close/closeRight/...  │      key = "dodo.tabs.v2"
        └─────────────────────────────┘
                 │ subscribe (狀態)
                 ▼
        ┌─────────────────────────────┐
        │   TabHeaderController         │  極薄組合器
        │   讀 store → 傳給下面兩個      │
        └──────────┬──────────┬────────┘
                   │          │
        狀態+動作   │          │  activeId + tabs
                   ▼          ▼
        ┌────────────────┐  ┌────────────────────────┐
        │  TabHeader      │  │  TabPageHost            │
        │  純 UI：        │  │  讀 activeId            │
        │  - 頁籤列       │  │  → tabRegistry[key]     │
        │  - dnd 水平排序 │  │  → 渲染 component       │
        │  - 右鍵選單     │  │  (不 keep-alive)        │
        └────────────────┘  └───────────┬────────────┘
                                         │
                                         ▼
                              ┌────────────────────┐
                              │  tabRegistry        │
                              │  key → {title,      │
                              │  icon, component}   │
                              └────────────────────┘
        ───────────────────────────────────────────────
        Router 在這張圖上「沒有任何一條線」連到頁籤系統。
        它只負責路由頁（/、/settings 等既有會改網址的頁）。
```

**掛載位置**：`_layout.tsx` 的 `MainContentController > div.mx-auto.max-w-7xl`（第 110 行）已掛載 `<TabHeaderController />`。Controller 隨「登入後版型」（`AuthenticatedLayout`）常駐，**不會因 SPA 內導航卸載**。兩個關鍵推論：

- 登入不會重新 mount Controller → **登入重置必須主動呼叫 `reset()`**，不能靠「重新掛載清空」。
- F5（整頁重載）才會重新 mount → 此時由 persist `rehydrate` 從 localStorage 還原。

### 0.4 型別與 API 契約骨架（唯一準據，全章不得改名）

```ts
// src/components/TabHeader/types.ts

// 對應 tabRegistry 的 key，例如 "dashboard" | "items"
export type TabKey = string

// 頁籤實例：標題/icon 一律於 render 時由 tabRegistry[key] 取得；持久化只存 {id,key}
export type TabItem = {
  id: string
  key: TabKey
}
```

```ts
// 常數（定義於 src/stores/tabStore.ts，全章共用同一處 import）

export const MAX_TABS = 20            // 頁籤總量上限，第 21 個硬擋
export const FIXED_TAB_ID = 'dashboard'   // 固定頁籤的 id（永遠最左、不可關/拖/移）
export const TAB_STORAGE_KEY = 'dodo.tabs.v2'  // localStorage 持久化 key（v2 = 狀態驅動版）
```

```ts
// useTabStore 動作簽名（固定，全章一致）

interface TabStore {
  tabs: TabItem[]                  // tabs[0] 永遠是固定 dashboard（id=FIXED_TAB_ID, key="dashboard"）
  activeId: string

  openTab(key: TabKey): boolean    // 回傳 false=已達上限未開；dashboard key→聚焦固定頁籤不新增；其餘一律新增實例(不去重)並設 active
  setActive(id: string): void      // 切換目前 active 頁籤
  closeTab(id: string): void       // 固定頁籤忽略；若關的是 active→右遞補、無右則左；更新 activeId
  closeRight(id: string): void     // 關閉該頁籤右側全部（不含固定頁籤）
  closeAll(): void                 // 關閉除固定頁籤外全部；active 設回固定頁籤
  reorder(activeId2: string, overId: string): void  // 水平重排；index 0 固定，clamp 目標 index >= 1
  reset(): void                    // 還原成只有固定頁籤 + activeId=FIXED_TAB_ID（persist 會寫回；登入時呼叫）
}
```

```ts
// tabRegistry 形狀（實作見第 2 章，副檔名 .tsx 因含 icon/component）
// Record<TabKey, { title: string; icon: LucideIcon; component: React.ComponentType }>
// tabRegistry["dashboard"] = { title:"Dashboard", icon: Home,      component: DashboardView }
// tabRegistry["items"]     = { title:"Items",     icon: Briefcase, component: ItemsView }
```

> **⚠️ Dashboard 內容元件契約缺口（重要）**：`src/routes/_layout/index.tsx` 內的 `Dashboard` 是**未 export 的區域函式**（僅作 route `component`，第 7 行 `component: Dashboard`、第 18 行 `function Dashboard()`）。`tabRegistry["dashboard"].component` 無法直接 import 它。第 2 章採做法 (B)：**新增獨立的 `DashboardView` 純元件**供頁籤使用。

```ts
// src/hooks/useOpenTab.ts 契約（實作見第 5/6 章）
// useOpenTab(): (key: TabKey) => void
//   呼叫 store.openTab(key)，若回傳 false 則 toast.error「已達上限（20），請先關閉再開」（sonner）
```

```ts
// src/hooks/useAuth.ts 登入重置插入點（實作見第 6 章）
// loginMutation.onSuccess（現況第 50-52 行，navigate 第 51 行）：
//   onSuccess: () => {
//     useTabStore.getState().reset()   // ← 在 navigate 之前主動清空（Controller 常駐不卸載，必須主動）
//     navigate({ to: "/" })
//   }
```

### 0.5 學徒重現 Checklist

```bash
cd frontend
bun add zustand
bun add @radix-ui/react-context-menu
```

- [ ] **步驟 0**：`bun add zustand`、`bun add @radix-ui/react-context-menu`
- [ ] **步驟 1**：新增 `src/stores/tabStore.ts`（第 1 章）
- [ ] **步驟 2**：改寫 `src/components/TabHeader/types.ts`（第 1 章）
- [ ] **步驟 3**：新增 `src/components/Dashboard/DashboardView.tsx`、`src/components/Items/ItemsView.tsx`（第 2 章）
- [ ] **步驟 4**：新增 `src/components/TabHeader/tabRegistry.tsx`（第 2 章）
- [ ] **步驟 5**：新增 `src/components/ui/context-menu.tsx`（第 3 章）
- [ ] **步驟 6**：改寫 `TabHeader.tsx`（第 3 章）
- [ ] **步驟 7**：改寫 `TabPageHost.tsx`（第 2 章）
- [ ] **步驟 8**：改寫 `TabHeaderController.tsx`（第 4 章）
- [ ] **步驟 9**：新增 `src/hooks/useOpenTab.ts`（第 5/6 章）
- [ ] **步驟 10**：新增 `src/components/Sidebar/tabKeyMap.ts`；改 `Main.tsx`、`TreeMenu.tsx`（第 5 章）
- [ ] **步驟 11**：改寫 `src/routes/_layout/items.tsx`（`/items` redirect 回首頁，第 5 章）
- [ ] **步驟 12**：改 `src/hooks/useAuth.ts`（登入重置，第 6 章）
- [ ] **步驟 13**：刪舊 `src/components/TabHeader/pageRegistry.ts`
- [ ] **步驟 14**：`bun run lint`、`bun run build`、`bun run test`
- [ ] **步驟 15**：手動逐條跑 0.6 的八項驗證

### 0.6 驗證方法

| # | 驗證項目 | 操作步驟 | 預期結果 |
| --- | --- | --- | --- |
| 1 | 開頁籤不變網址 | 側邊欄點 Items 開頁籤 | 內容切到 Items，**網址列完全不變** |
| 2 | 同功能多開各自獨立 | 連點 Items 三次 | 出現三個「Items」頁籤，皆可獨立切換/關閉，互不影響 |
| 3 | 固定頁籤鎖定 | 觀察第一個 Dashboard 頁籤 | **無 X**、拖不動、其他頁籤無法插到它左邊 |
| 4 | 右鍵三功能 | 在某頁籤上按右鍵 | 顯示三項；分別測「關本頁/關右側/關全部」，固定頁皆不受影響 |
| 5 | 關閉 active 右遞補 | active 在中段，按其 X | active **跳到右邊那個**；若無右邊才跳左邊 |
| 6 | 上限 20 硬擋 | 連開到第 21 個 | 第 21 個**開不出來**，跳 toast「已達上限（20），請先關閉再開」 |
| 7 | 登入清空 | 登出後重新登入 | 頁籤只剩 Dashboard、`activeId = "dashboard"` |
| 8 | F5 還原 | 開數個頁籤後按 F5 | 清單、順序、active **照原樣還原**（內容各自重載）；`tabs[0]` 仍為固定 Dashboard |

---

## 第 1 章｜狀態核心：Zustand `tabStore` + 型別 + 持久化

本章建立整個系統的**唯一真相來源**。動手前需先安裝（專案尚未安裝 Zustand）：

```bash
bun add zustand
```

### 1.1 型別定義 `src/components/TabHeader/types.ts`（改寫）

標題與 icon **不存進 `TabItem`**，一律 render 時由 `tabRegistry[key]` 取得；持久化因此只需 `{ id, key }`。舊 `types.ts` 內含 `path / title / icon / closable / instanceId`（Router-driven 時代欄位），全數移除。

```ts
// src/components/TabHeader/types.ts

// 頁籤註冊表的 key，例如 "dashboard" | "items"；對應 tabRegistry 的索引
export type TabKey = string

// 頁籤實例：只持有識別資訊；title/icon/component 一律在 render 時由 tabRegistry[key] 取得
// 不把 title/icon 存進來，是為了讓持久化只需序列化純資料 {id,key}，不碰 React 元件
export type TabItem = {
  id: string
  key: TabKey
}
```

### 1.2 狀態核心 `src/stores/tabStore.ts`（新增）

```ts
// src/stores/tabStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TabItem, TabKey } from '@/components/TabHeader/types'

// 頁籤總量上限；達到後 openTab 直接回傳 false，由呼叫端 toast 提示，不自動關閉舊頁籤
export const MAX_TABS = 20

// 固定頁籤的 id 與 key：Dashboard 永久存在、無法關閉/拖移，且永遠位於最左 (index 0)
export const FIXED_TAB_ID = 'dashboard'
const FIXED_TAB_KEY: TabKey = 'dashboard'

// localStorage 的 key；v2 代表本次「狀態驅動」架構，與舊 Router-driven 版本隔離
export const TAB_STORAGE_KEY = 'dodo.tabs.v2'

// 產生固定頁籤實例的工廠：reset / rehydrate 補位共用，避免散落的字面量不一致
// 固定頁籤 id 必為常數 FIXED_TAB_ID，這樣 closeTab / reorder 才能用 id 比對鎖定它
const createFixedTab = (): TabItem => ({ id: FIXED_TAB_ID, key: FIXED_TAB_KEY })

// 遞增計數器：給非固定頁籤產生唯一 id。tab id 不顯示於網址、使用者看不到
let idCounter = 0

// 產生新頁籤 id：以時間戳為主、遞增 counter 為輔，確保跨 rehydrate 不撞號（id 不外露，格式不重要）
const nextTabId = (): string => {
  idCounter += 1
  return `tab-${Date.now().toString(36)}-${idCounter}`
}

// store 的完整型別：狀態 + 全部動作（簽名與 API 契約一字不差）
type TabStore = {
  tabs: TabItem[]
  activeId: string
  openTab: (key: TabKey) => boolean
  setActive: (id: string) => void
  closeTab: (id: string) => void
  closeRight: (id: string) => void
  closeAll: () => void
  reorder: (activeId2: string, overId: string) => void
  reset: () => void
}

// 計算「初始狀態」：只有固定頁籤、active 指向固定頁籤。reset 與 store 初值都用它
const initialState = (): Pick<TabStore, 'tabs' | 'activeId'> => ({
  tabs: [createFixedTab()],
  activeId: FIXED_TAB_ID,
})

// 唯一真相來源：所有頁籤顯示、active 標記、排序都讀這個 store；Router 完全不參與
export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // 開啟頁籤：一律「不去重」，同一 key 可重複開、各自帶獨立狀態（同名不編號）
      // dashboard key → 不新增，只聚焦既有固定頁籤；達上限 (>=20) → 回傳 false（硬擋，不自動關）
      openTab: (key) => {
        // 固定頁籤特例：永遠存在且唯一，重複「開啟」只是把焦點移回它
        if (key === FIXED_TAB_KEY) {
          set({ activeId: FIXED_TAB_ID })
          return true
        }

        const { tabs } = get()
        // 上限硬擋：第 21 個直接拒絕。回傳 false 讓 useOpenTab 跳 toast
        if (tabs.length >= MAX_TABS) {
          return false
        }

        // 不去重：無論是否已有相同 key，都新增一個全新實例並設為 active
        const tab: TabItem = { id: nextTabId(), key }
        set({ tabs: [...tabs, tab], activeId: tab.id })
        return true
      },

      // 切換 active：純粹更新 activeId；目標不存在則靜默忽略，避免 active 指向幽靈 id
      setActive: (id) => {
        const { tabs, activeId } = get()
        if (id === activeId) return
        if (!tabs.some((t) => t.id === id)) return
        set({ activeId: id })
      },

      // 關閉頁籤：固定頁籤忽略（無 X、不可關）
      // 若關掉的是當前 active → 優先遞補「右邊」，沒有右邊才往「左邊」
      closeTab: (id) => {
        if (id === FIXED_TAB_ID) return

        const { tabs, activeId } = get()
        const index = tabs.findIndex((t) => t.id === id)
        if (index === -1) return

        const nextTabs = tabs.filter((t) => t.id !== id)

        let nextActiveId = activeId
        if (activeId === id) {
          // filter 後同 index 已被右側元素遞補到此位置；沒有右邊才退取左邊 (index-1)
          const fallback = nextTabs[index] ?? nextTabs[index - 1]
          nextActiveId = fallback ? fallback.id : FIXED_TAB_ID
        }

        set({ tabs: nextTabs, activeId: nextActiveId })
      },

      // 關閉右側全部：保留指定頁籤及其左側（固定頁籤永遠在最左，不受影響）
      closeRight: (id) => {
        const { tabs, activeId } = get()
        const index = tabs.findIndex((t) => t.id === id)
        if (index === -1) return

        const nextTabs = tabs.slice(0, index + 1)
        // 無變化 (本來就沒有右側) 則略過 set，避免多餘渲染
        if (nextTabs.length === tabs.length) return

        const stillExists = nextTabs.some((t) => t.id === activeId)
        set({ tabs: nextTabs, activeId: stillExists ? activeId : id })
      },

      // 關閉全部：清掉除固定頁籤以外的所有頁籤，active 設回固定頁籤
      closeAll: () => set(initialState()),

      // 水平重排（dnd-kit 拖拉結束時呼叫）：把 activeId2 移到 overId 的位置
      // 鐵律：固定頁籤鎖在 index 0，不可被移動、也不可被別人插到它前面 → 目標 index clamp >= 1
      reorder: (activeId2, overId) => {
        if (activeId2 === FIXED_TAB_ID) return

        const { tabs } = get()
        const fromIndex = tabs.findIndex((t) => t.id === activeId2)
        let toIndex = tabs.findIndex((t) => t.id === overId)
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

        // clamp 下界為 1：即使拖到固定頁籤上 (index 0)，目標也被夾到 1
        if (toIndex < 1) toIndex = 1

        const nextTabs = [...tabs]
        const [moved] = nextTabs.splice(fromIndex, 1)
        nextTabs.splice(toIndex, 0, moved)
        set({ tabs: nextTabs })
      },

      // 重置：還原成「只有固定頁籤 + active=固定頁籤」。唯一呼叫點 = 登入成功時
      reset: () => set(initialState()),
    }),
    {
      name: TAB_STORAGE_KEY,
      // partialize：只持久化純資料 {id,key} 與 activeId；不存 title/icon/component
      partialize: (state) => ({
        tabs: state.tabs.map((t) => ({ id: t.id, key: t.key })),
        activeId: state.activeId,
      }),
      // rehydrate (F5 還原) 後修復：保證 tabs[0] 永遠是固定 dashboard，否則整套鎖定規則失效
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // 防衛 1：localStorage 壞掉/為空 → 重建成初始狀態
        if (!Array.isArray(state.tabs) || state.tabs.length === 0) {
          state.tabs = [createFixedTab()]
          state.activeId = FIXED_TAB_ID
          return
        }

        // 防衛 2：固定頁籤可能不在最前或被竄改 key → 濾掉任何 FIXED_TAB_ID 舊項，強制以工廠補回 index 0
        const others = state.tabs.filter((t) => t.id !== FIXED_TAB_ID)
        state.tabs = [createFixedTab(), ...others]

        // 防衛 3：activeId 指向的頁籤若已不存在 → 收斂回固定頁籤
        if (!state.tabs.some((t) => t.id === state.activeId)) {
          state.activeId = FIXED_TAB_ID
        }
      },
    },
  ),
)
```

### 1.3 設計要點對照表

| 行為 | 規則 | 實作關鍵 |
|------|------|----------|
| 不去重 | 同 key 一律新增實例 | `openTab` 不查找既有，直接 push 新 id |
| 上限 20 | 第 21 個硬擋、不自動關 | `tabs.length >= MAX_TABS` → `return false` |
| dashboard 聚焦 | 重開固定頁籤只移焦點 | `openTab` 對 `FIXED_TAB_KEY` 只 `set activeId` |
| 固定頁籤 | 永久、不可關/拖/移、永遠最左 | id 鎖 `FIXED_TAB_ID`；`closeTab`/`reorder` 比對忽略；`reorder` clamp `toIndex >= 1` |
| 關 active fallback | 右遞補，無右才往左 | `nextTabs[index] ?? nextTabs[index - 1]` |
| 關右側 | 砍 index 右側全部 | `tabs.slice(0, index + 1)` |
| 關全部 | 只留固定頁籤 | `set(initialState())` |
| 持久化 | 只存 `{id,key}` + `activeId` | `partialize` 過濾 |
| F5 還原 | 保證固定頁籤在最前 | `onRehydrateStorage` 重建 index 0 |
| 重置 | 登入時清空 | `reset()` = `set(initialState())` |

> `idCounter` 不持久化（F5 後從 0 重起），但 `nextTabId` 以 `Date.now()` 為主鍵、counter 為次鍵，跨 rehydrate 不會與既有 `tab-...-n` id 撞號。

---

## 第 2 章｜頁籤內容：`tabRegistry` + `TabPageHost`（無 keep-alive）

| 檔案 | 動作 | 責任 |
| --- | --- | --- |
| `src/components/Dashboard/DashboardView.tsx` | 新增 | 從 `routes/_layout/index.tsx` 抽出的 Dashboard 純內容元件 |
| `src/components/Items/ItemsView.tsx` | 新增 | Items 純內容元件（移除 keepalive-probe） |
| `src/components/TabHeader/tabRegistry.tsx` | 新增 | `TabKey` → `{ title, icon, component }`（取代舊 `pageRegistry.ts`） |
| `src/components/TabHeader/TabPageHost.tsx` | 改寫 | 只渲染 `activeId` 對應的那一頁，切走即卸載 |

### 2.1 抽出 Dashboard 內容元件 `src/components/Dashboard/DashboardView.tsx`（新增）

`routes/_layout/index.tsx` 內的 `Dashboard()` 純粹是畫面（只用 `useAuth` 與 `Megaphone`，無任何 Router API），且**未 export**。複製內容到新檔，命名 `DashboardView`，解決契約缺口。

```tsx
import { Megaphone } from "lucide-react"

import useAuth from "@/hooks/useAuth"

// 顯示首頁公告與目前登入使用者的歡迎訊息（頁籤可重用的純內容元件）
export function DashboardView() {
  const { user: currentUser } = useAuth()

  return (
    <div className="space-y-6">
      <section className="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Megaphone className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">歡迎使用管理平台</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            你可以從左側選單開始管理 Items、帳號與個人設定。
          </p>
        </div>
      </section>

      <div>
        <h1 className="max-w-sm truncate text-2xl">
          Hello, {currentUser?.full_name || currentUser?.email} 👋
        </h1>
        <p className="text-muted-foreground">
          Welcome back, nice to see you again!!!
        </p>
      </div>
    </div>
  )
}
```

### 2.2 抽出 Items 內容元件 `src/components/Items/ItemsView.tsx`（新增）

從 `routes/_layout/items.tsx` 的 `ItemsPage` 抽出畫面，**移除 amber 邊框的 `keepalive-probe` input 與其 `useState`**（連帶移除 `react` 的 `useState` import）。資料查詢、Suspense、`AddItem`、`columns` 全部保留。`AddItem` / `PendingItems` 為 default export、`columns` / `DataTable` 為 named export。

```tsx
import { useSuspenseQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Suspense } from "react"

import { ItemsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/Items/AddItem"
import { columns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"

// 取得 Items 列表查詢設定
function getItemsQueryOptions() {
  return {
    queryFn: () => ItemsService.readItems({ skip: 0, limit: 100 }),
    queryKey: ["items"],
  }
}

// 顯示 Items 資料表，空資料時顯示提示
function ItemsTableContent() {
  const { data: items } = useSuspenseQuery(getItemsQueryOptions())

  if (items.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">You don't have any items yet</h3>
        <p className="text-muted-foreground">Add a new item to get started</p>
      </div>
    )
  }

  return <DataTable columns={columns} data={items.data} />
}

// 以 Suspense 包裹 Items 資料表
function ItemsTable() {
  return (
    <Suspense fallback={<PendingItems />}>
      <ItemsTableContent />
    </Suspense>
  )
}

// Items 純內容元件（狀態驅動頁籤直接 render，無 keep-alive 探針）
export function ItemsView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">Create and manage your items</p>
        </div>
        <AddItem />
      </div>

      <ItemsTable />
    </div>
  )
}
```

### 2.3 `src/components/TabHeader/tabRegistry.tsx`（新增，取代 `pageRegistry.ts`）

唯一的「頁籤種類定義表」。`icon` 與 `component` 都存**元件型別**，不在此實例化/渲染。

```tsx
import { Briefcase, Home, type LucideIcon } from "lucide-react"
import type { ComponentType } from "react"

import { DashboardView } from "@/components/Dashboard/DashboardView"
import { ItemsView } from "@/components/Items/ItemsView"
import type { TabKey } from "@/components/TabHeader/types"

// 單一頁籤種類的定義：標題、icon、內容元件
type TabDefinition = {
  title: string
  icon: LucideIcon
  component: ComponentType
}

// 頁籤種類對照表：key → 定義；新增頁籤種類只需在此補一筆
export const tabRegistry: Record<TabKey, TabDefinition> = {
  dashboard: {
    title: "Dashboard",
    icon: Home,
    component: DashboardView,
  },
  items: {
    title: "Items",
    icon: Briefcase,
    component: ItemsView,
  },
}

// 以 key 取得頁籤定義；查無對應時回傳 undefined（呼叫端需自行防呆）
export function getTabDefinition(key: TabKey): TabDefinition | undefined {
  return tabRegistry[key]
}
```

> 型別備註：契約定義 `type TabKey = string`，`tabRegistry` 是字串鍵字典。本專案 `tsconfig` 只開 `strict`、**未開 `noUncheckedIndexedAccess`**，故 `tabRegistry[key]` 型別上不會自動變 `T | undefined`，但執行期仍可能拿到 `undefined`（持久化殘留已移除的 key）。`getTabDefinition` 主動把回傳標為 `| undefined`，逼呼叫端顯式防呆。**一律透過 `getTabDefinition` 取用。**

### 2.4 `src/components/TabHeader/TabPageHost.tsx`（改寫）

| 項目 | 舊版（Router-driven keep-alive） | 本版（狀態驅動、無 keep-alive） |
| --- | --- | --- |
| 渲染策略 | 全部頁籤同時掛載，非 active 用 `display:none` | 只掛載 active 一個，其餘不存在於 DOM |
| 切換行為 | 切走只是隱藏，元件仍存活 | 切走即卸載，回來重新掛載 |
| 內部狀態 | 保留 | **不保留**（重載） |

```tsx
import { getTabDefinition } from "@/components/TabHeader/tabRegistry"
import { useTabStore } from "@/stores/tabStore"

// 只渲染目前 active 頁籤的內容；切走即卸載、內部狀態不保留（無 keep-alive）
export function TabPageHost() {
  const tabs = useTabStore((s) => s.tabs)
  const activeId = useTabStore((s) => s.activeId)

  const activeTab = tabs.find((t) => t.id === activeId)
  const definition = activeTab ? getTabDefinition(activeTab.key) : undefined

  // 防呆：activeId 對不到頁籤、或 key 不在 registry 時不渲染內容
  if (!activeTab || !definition) {
    return null
  }

  const ActiveComponent = definition.component

  // key 綁定 activeTab.id：切換 active 必定卸載舊元件、掛載新元件（不沿用既有實例狀態）
  return <ActiveComponent key={activeTab.id} />
}
```

> 為什麼 `key={activeTab.id}`？兩個都叫 Items 的頁籤共用同一個 `component`（`ItemsView`）。若不綁 `key`，React 切換時會當成「同元件、props 變了」而**重用實例**，舊頁 local state 殘留到新頁。綁各自 `id` 當 `key`，保證每個頁籤實例獨立、切換必重掛，與「不去重、可多開、各帶狀態」「內部狀態不留」一致。

> **本章 `TabPageHost` 不接收 props**（自行讀 store）。第 4 章 Controller 渲染時直接 `<TabPageHost />`，不傳 `tabs`/`activeId`——以本章版本為準。

---

## 第 3 章｜頁籤列 UI：`TabHeader` + 右鍵選單 + dnd 水平排序

| 檔案 | 動作 | 職責 |
| --- | --- | --- |
| `src/components/ui/context-menu.tsx` | 新增 | shadcn 風格右鍵選單，包 `@radix-ui/react-context-menu` |
| `src/components/TabHeader/TabHeader.tsx` | 改寫 | 純 UI 受控元件：頁籤列 + dnd 水平排序 + 右鍵選單 + 固定頁籤鎖定 |

> **編碼慣例（biome 實況）**：`biome.json` 設 `quoteStyle: "double"`、`semicolons: "asNeeded"`，且 `includes` 排除 `src/components/ui/**`。因此 `context-menu.tsx` 屬被忽略路徑（沿用雙引號），`TabHeader.tsx` **不在忽略清單內**，biome 會強制雙引號、無分號。本章一律用雙引號。

### 3.1 安裝相依

```bash
bun add @radix-ui/react-context-menu
```

`@radix-ui/react-context-menu` 尚未安裝；右鍵情境要用它（由原生 `onContextMenu` 觸發、自動定位在游標處），不可用已安裝的 `dropdown-menu`。

### 3.2 `src/components/ui/context-menu.tsx`（新增）

```tsx
"use client"

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import * as React from "react"

import { cn } from "@/lib/utils"

// 右鍵選單根元件，包住觸發區與選單內容
function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

// 觸發區：在其上按右鍵會開啟選單
function ContextMenuTrigger({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  )
}

// 選單內容容器，透過 Portal 渲染並定位於游標處
function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

// 單一選單項，支援 destructive 變體與 disabled 狀態
function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

// 選單分隔線
function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
}
```

### 3.3 `src/components/TabHeader/TabHeader.tsx`（改寫）

純 UI 受控元件。props 由 Controller 注入；`tabs` 已是含 `title`/`icon` 的 **render 形態**。固定與否一律以 `id === FIXED_TAB_ID` 判斷。

**三道固定頁籤鎖定**：

| 鎖 | 手段 |
| --- | --- |
| 不可拖 | `useSortable({ id, disabled: isFixed })`，固定頁籤不掛 `attributes`/`listeners` |
| 無 X | `!isFixed && <CloseButton/>` |
| 不可被插到前面 | `handleDragEnd` 擋掉 `over.id === FIXED_TAB_ID` 落點；最終 index clamp（`>= 1`）由 store 的 `reorder` 負責 |

```tsx
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { LucideIcon } from "lucide-react"
import { X } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FIXED_TAB_ID } from "@/stores/tabStore"
import type { TabKey } from "./types"

// Controller 注入的 render 形態：store 的 {id,key} 併入 tabRegistry 的 {title,icon}
export type RenderTab = {
  id: string
  key: TabKey
  title: string
  icon: LucideIcon
}

type TabHeaderProps = {
  tabs: RenderTab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onCloseRight: (id: string) => void
  onCloseAll: () => void
  onReorder: (activeId: string, overId: string) => void
}

// 純展示頁籤列：水平排序 + 右鍵選單 + 固定頁籤鎖定，狀態全由 props 控制
export function TabHeader({
  tabs,
  activeId,
  onSelect,
  onClose,
  onCloseRight,
  onCloseAll,
  onReorder,
}: TabHeaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // 拖曳結束：擋掉拖曳源為固定頁籤、以及落到固定頁籤之前的無效落點，其餘交回 store
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    if (active.id === FIXED_TAB_ID) return
    if (over.id === FIXED_TAB_ID) return
    onReorder(String(active.id), String(over.id))
  }

  return (
    <ScrollArea className="border-b border-border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex items-stretch gap-1 bg-background px-2 pt-1.5">
            {tabs.map((tab) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeId}
                onSelect={onSelect}
                onClose={onClose}
                onCloseRight={onCloseRight}
                onCloseAll={onCloseAll}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

type SortableTabProps = {
  tab: RenderTab
  isActive: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onCloseRight: (id: string) => void
  onCloseAll: () => void
}

// 單一頁籤：固定頁籤不可拖、無 X；外包右鍵選單三項
function SortableTab({
  tab,
  isActive,
  onSelect,
  onClose,
  onCloseRight,
  onCloseAll,
}: SortableTabProps) {
  const isFixed = tab.id === FIXED_TAB_ID
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, disabled: isFixed })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const Icon = tab.icon
  // 固定頁籤不掛拖曳 attributes/listeners，徹底擋住拖曳
  const dragProps = isFixed ? {} : { ...attributes, ...listeners }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "relative flex shrink-0 items-stretch overflow-hidden rounded-t border border-border transition-colors",
            isActive
              ? "bg-background border-border/60 shadow-sm"
              : "bg-muted hover:bg-muted/40",
            isDragging && "z-10 opacity-80"
          )}
        >
          {/* 頂部 indicator，active 時顯示 primary 色 */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5 transition-colors",
              isActive && "bg-primary"
            )}
          />
          <button
            type="button"
            {...dragProps}
            onClick={() => onSelect(tab.id)}
            className="flex items-center gap-1.5 px-3 pt-2.5 pb-2 text-sm"
          >
            <Icon
              className={cn(
                "size-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span
              className={cn(
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {tab.title}
            </span>
          </button>
          {!isFixed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
              className="flex items-center rounded-sm px-1 text-muted-foreground/40 hover:bg-black/10 hover:text-foreground"
              aria-label={`關閉 ${tab.title}`}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        {/* 固定頁籤本身不可關閉，故 disabled（radix Item disabled 時 onSelect 不會觸發） */}
        <ContextMenuItem
          variant="destructive"
          disabled={isFixed}
          onSelect={() => onClose(tab.id)}
        >
          關閉本頁籤
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCloseRight(tab.id)}>
          關閉右側頁籤
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onCloseAll()}>
          關閉全部頁籤
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
```

> **`ScrollArea` 行為提醒**：本專案 `ScrollArea` 的 `Root` 內已自帶一條預設垂直 `<ScrollBar />`；頁籤列只需橫向捲動，故另掛 `<ScrollBar orientation="horizontal" />`，預設垂直軸在無垂直溢位時不顯示，可忽略。

> **跨章型別對齊**：本章 `RenderTab` 含 `{ id, key, title, icon }`，第 4 章 Controller 必須輸出含 `key` 的同形態。`onReorder(activeId, overId)` 直接對應 store 的 `reorder(activeId2, overId)`。

---

## 第 4 章｜控制層：`TabHeaderController` + `_layout` 接線

`TabHeaderController` 是整個系統的**唯一接合點（極薄控制層）**：取 store 狀態 → 算 render 形態 → 串事件。**新版完全移除** `useNavigate` / `useRouterState` / `navigate` / `tabId` query / `saveTabState` / `loadTabState`（持久化已移進 store 的 `persist`）。

### 4.1 `src/components/TabHeader/TabHeaderController.tsx`（改寫）

```tsx
import { useMemo } from "react"

import { TabHeader, type RenderTab } from "@/components/TabHeader/TabHeader"
import { TabPageHost } from "@/components/TabHeader/TabPageHost"
import { tabRegistry } from "@/components/TabHeader/tabRegistry"
import { useTabStore } from "@/stores/tabStore"

// 控制層：極薄接合點，從 store 取狀態並串接 TabHeader / TabPageHost（完全不碰 Router）
export function TabHeaderController() {
  // 唯一真相：逐欄選取，動作參考在 Zustand 中穩定
  const tabs = useTabStore((s) => s.tabs)
  const activeId = useTabStore((s) => s.activeId)
  const setActive = useTabStore((s) => s.setActive)
  const closeTab = useTabStore((s) => s.closeTab)
  const closeRight = useTabStore((s) => s.closeRight)
  const closeAll = useTabStore((s) => s.closeAll)
  const reorder = useTabStore((s) => s.reorder)

  // 把持久化的 {id,key} 結合 tabRegistry 補出 title/icon，給 TabHeader 純 UI 用
  const renderTabs = useMemo<RenderTab[]>(
    () =>
      tabs.map((tab) => {
        const meta = tabRegistry[tab.key]
        return {
          id: tab.id,
          key: tab.key,
          title: meta.title,
          icon: meta.icon,
        }
      }),
    [tabs],
  )

  return (
    <div className="flex flex-col">
      <TabHeader
        tabs={renderTabs}
        activeId={activeId}
        onSelect={setActive}
        onClose={closeTab}
        onCloseRight={closeRight}
        onCloseAll={closeAll}
        onReorder={reorder}
      />
      <div className="pt-4">
        <TabPageHost />
      </div>
    </div>
  )
}
```

事件對照：

| `TabHeader` callback | store 動作（API 契約） |
| --- | --- |
| `onSelect(id)` | `setActive` |
| `onClose(id)` | `closeTab`（固定頁籤忽略） |
| `onCloseRight(id)` | `closeRight` |
| `onCloseAll()` | `closeAll` |
| `onReorder(activeId2, overId)` | `reorder`（內部 clamp index `>= 1`） |

> 全部**直接把 store 動作當 handler 傳下去**。固定頁籤的「不可關 / 不可拖 / 右遞補 / clamp index ≥ 1」護欄全部落在 store（第 1 章），Controller 不重複實作。`fixed` 判斷不在 Controller 算——`TabHeader` 內部以 `id === FIXED_TAB_ID` 自行判定（第 3 章），故 `renderTabs` 不傳 `fixed`。

### 4.2 `_layout.tsx` 接線：本章無需改動

`TabHeaderController` 已掛載於登入後版型中央內容區（`src/routes/_layout.tsx` 第 110 行）：

```tsx
<SidebarInset className="pb-[var(--app-footer-layout-height)]">
  <MainContentController>
    <div className="mx-auto max-w-7xl">
      <TabHeaderController />   {/* ← 第 110 行，本次無需改動 */}
    </div>
  </MainContentController>
</SidebarInset>
```

確認兩點即可：

1. **沒有殘留 `<Outlet/>` 依賴**：已核對現況檔——`import` 僅有 `createFileRoute, redirect`，不存在 `Outlet`。頁籤內容由 `TabPageHost` 直接渲染。
2. **Controller 常駐特性不變**：隨 `AuthenticatedLayout` 掛載後常駐，SPA 內導航不卸載，故 store 記憶體延續；登入重置改由 `useAuth` 主動呼叫 `reset()`（第 6 章）。

> `_layout.tsx` 的 `beforeLoad` 仍保有 `redirect`（未登入導向 `/login`），這與「頁籤脫離 Router」無衝突——它管版型存取守門，不是頁籤狀態。本章不動它。

---

## 第 5 章｜Items 轉頁籤 + `/items` 失效 + 側邊欄改 `openTab`

完成後：`/items` 不再渲染畫面、改導回首頁；Items 內容由 `ItemsView`（第 2 章已建）提供；側邊欄會導航的項目改 `openTab`。

### 5.1 path → key 對應總表

| 來源 | path | key | 行為 |
| --- | --- | --- | --- |
| 主選單 Dashboard | `/` | `dashboard` | 聚焦固定頁籤（不新增） |
| 主選單 Items | `/items` | `items` | 新增 Items 頁籤實例（不去重） |
| 主選單 Admin / TestTab / TestTab2 | `/admin`、`/test-tab`、`/test-tab2` | （無對應 key） | 暫不轉頁籤，仍走路由頁 |
| 樹狀葉節點 | 全部只有 `code`、**無 `path`** | （無對應 key） | 不開頁籤（禁用樣式） |

> 規則：**只有能在 `PATH_TO_TAB_KEY` 找到 key 的項目才開頁籤**；找不到的維持原樣。已驗證 `tree-data.ts` 所有葉節點目前只帶 `code`，故套用後全部葉節點皆為 disabled，直到後續補上對應 `path`。

### 5.2 `routes/_layout/items.tsx`：`/items` 失效並導回首頁（做法 A）

保留路由檔，`beforeLoad` 直接 `throw redirect`：

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router"

// /items 已轉為狀態驅動頁籤：保留路由檔僅作向後相容，一律導回首頁
export const Route = createFileRoute("/_layout/items")({
  beforeLoad: () => {
    throw redirect({ to: "/" })
  },
})
```

> TanStack Router v1 慣例：`beforeLoad` 內必須 **`throw redirect(...)`**，不可只 `return`。`/items` 在 `routeTree.gen.ts` 仍合法，因此殘留的 `<Link to="/items">` **不會被 TS 標紅**，需靠 5.6 清單手動處理。

### 5.3 `src/hooks/useOpenTab.ts`（新增）

```ts
import { useCallback } from "react"
import { toast } from "sonner"

import type { TabKey } from "@/components/TabHeader/types"
import { MAX_TABS, useTabStore } from "@/stores/tabStore"

// 包 store.openTab：達上限（回傳 false）時跳 toast，給側邊欄使用
export const useOpenTab = () => {
  const openTab = useTabStore((s) => s.openTab)

  // 開啟指定 key 的頁籤；openTab 回傳 false（已達上限）時跳 toast
  return useCallback(
    (key: TabKey) => {
      const opened = openTab(key)
      if (!opened) {
        toast.error(`已達上限（${MAX_TABS}），請先關閉再開`)
      }
    },
    [openTab],
  )
}
```

> `dashboard` key 走「聚焦固定頁籤、不新增」回傳 `true`，不會誤觸上限。`toast` 由 sonner 提供（專案已裝），依賴版型既有 `<Toaster />`（與 `useCustomToast` 共用，不需重複掛載）。

### 5.4 `src/components/Sidebar/tabKeyMap.ts`（新增）

```ts
import type { TabKey } from "@/components/TabHeader/types"

// 側邊欄 path → TabKey 對應（主選單與樹狀葉節點共用）
export const PATH_TO_TAB_KEY: Record<string, TabKey> = {
  "/": "dashboard",
  "/items": "items",
}

// 由 path 取得對應 TabKey，無 path 或無對應時回傳 undefined
export function keyForPath(path?: string): TabKey | undefined {
  if (!path) return undefined
  return PATH_TO_TAB_KEY[path]
}
```

### 5.5 `src/components/Sidebar/Main.tsx`（改寫）：`RouterLink` → `button onClick`

只有能對應到 key 的 `path` 才開頁籤；其餘維持 `RouterLink`。

```tsx
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useOpenTab } from "@/hooks/useOpenTab"
import { keyForPath } from "./tabKeyMap"

export type Item = {
  icon: LucideIcon
  title: string
  path: string
}

interface MainProps {
  items: Item[]
}

// 主選單：有對應 TabKey 的項目改開頁籤，其餘維持路由頁連結
export function Main({ items }: MainProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouterState()
  const currentPath = router.location.pathname
  const openTab = useOpenTab()

  // 手機版點完選單後收起抽屜
  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const tabKey = keyForPath(item.path)

            // 有對應 key → 改為開頁籤的 button（active 標記交給 TabHeader，不用 currentPath）
            if (tabKey) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <button
                      type="button"
                      onClick={() => {
                        openTab(tabKey)
                        handleMenuClick()
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            // 無對應 key → 維持原本路由頁連結（Admin / TestTab / TestTab2）
            const isActive = currentPath === item.path
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  asChild
                >
                  <RouterLink to={item.path} onClick={handleMenuClick}>
                    <item.icon />
                    <span>{item.title}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
```

> 路線 A 提醒：頁籤項目的 active 由 store 的 `activeId` 決定、不碰網址，故開頁籤的 `button` 不傳 `isActive`；視覺 active 由 `TabHeader` 那一列負責。`isActive` 計算放在路由頁分支內，避免 biome `noUnusedVariables`。

### 5.6 `src/components/Sidebar/TreeMenu.tsx` 的 `LeafItem`（改寫）

葉節點 `path` 能找到 key → `button onClick={() => openTab(key)}`；找不到 → 禁用樣式 button。只替換 `LeafItem` 與新增兩條 import：

```tsx
// 檔首新增這兩條 import（其餘維持原樣）
import { useOpenTab } from "@/hooks/useOpenTab"
import { keyForPath } from "./tabKeyMap"
```

```tsx
// Lv3 葉節點：對應到 TabKey 才開頁籤，否則為禁用樣式（無 path 的佔位節點）
function LeafItem({ leaf }: { leaf: TreeLeaf }) {
  const openTab = useOpenTab()
  const tabKey = keyForPath(leaf.path)
  const disabled = !tabKey

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild size="sm">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (tabKey) openTab(tabKey)
          }}
          className={cn(
            "flex w-full items-center gap-1.5 text-left",
            disabled && "cursor-default opacity-70"
          )}
        >
          <leaf.icon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{leaf.label}</span>
          {leaf.code && (
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {leaf.code}
            </span>
          )}
          {leaf.badge !== undefined && (
            <span
              className={cn(
                "rounded px-1 text-[10px] font-medium shrink-0",
                leaf.badgeVariant === "warn"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {leaf.badge}
            </span>
          )}
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
```

### 5.7 編譯/殘留待改清單（採做法 A 後不會自動標紅，需手動）

| 檔案 | 位置（實檔核對） | 現況 | 待改 |
| --- | --- | --- | --- |
| `src/components/TabHeader/pageRegistry.ts` | line 3、7 | `import { ItemsPage } from '@/routes/_layout/items'`；`'/items': ItemsPage` | **整檔刪除**（由 `tabRegistry.tsx` 取代） |
| `src/lib/routeTabMap.ts` | line 16 | `'/items': { routeKey:'items', ... }` | 隨舊架構移除/改寫 |
| `src/components/TabHeader/TabHeaderController.tsx` | line 1、42、56 | `useNavigate` + `navigate({ ... })` | 已於第 4 章整檔替換 |
| 任何 `<Link to="/items">` / `navigate({ to: '/items' })` | 全專案 grep | 直接導向 /items | 改為 `openTab('items')` |

排查指令（cwd 已是 `frontend`，故路徑為 `src`）：

```bash
rg -n "to=[\"']/items[\"']|to:\s*[\"']/items[\"']|ItemsPage" src --glob '!routeTree.gen.ts'
```

---

## 第 6 章｜生命週期：localStorage + 登入重置 + F5 還原 + 上限 toast

路線 B：頁籤只存「輕量清單」（開了哪些、順序、哪個 active），內容各自重載、不保留內部狀態。整個生命週期只有一個主動控管點——登入成功時呼叫 `reset()`。

### 6.1 三條資料流的分工

| 流向 | 觸發點 | 機制 | 結果 |
| --- | --- | --- | --- |
| 寫入 | 任何 store 動作 | `persist` 的 `partialize` | 自動寫回 `localStorage[TAB_STORAGE_KEY]` |
| 還原 | F5 / 重整 / 重開分頁 | `persist` rehydrate + `onRehydrateStorage` | 讀回上次清單（= 舊的），補正 `tabs[0]` |
| 重置 | 登入成功 | `useTabStore.getState().reset()` | 清空成只剩固定頁籤（= 新的），persist 同步寫回 |

- **F5 = 舊的**：重整時 Controller 重新 mount，但 persist 在 store 建立時自動把 localStorage 清單灌回記憶體。
- **登入 = 新的**：Controller 常駐不卸載，store 記憶體延續，故「清空」**不能靠 mount**，必須主動 `reset()`。
- **唯一控管點**：除登入外，沒有任何其他地方會清空頁籤。

> persist 設定（`partialize`、`onRehydrateStorage` 三道防衛）已於**第 1 章 `tabStore.ts`** 完整實作，本章不重複貼出，僅引用其行為。

### 6.2 登入重置 diff（唯一控管點）

修改 `src/hooks/useAuth.ts`：在 `loginMutation.onSuccess`（原始檔第 50-52 行，`navigate` 第 51 行）的 `navigate` 之前呼叫 `reset()`。新 import 插在現有 `import { handleError } from "@/utils"`（第 11 行）之前。

```diff
--- a/src/hooks/useAuth.ts
+++ b/src/hooks/useAuth.ts
@@
 import {
   type Body_login_login_access_token as AccessToken,
   LoginService,
   type UserPublic,
   type UserRegister,
   UsersService,
 } from "@/client"
+import { useTabStore } from "@/stores/tabStore"
 import { handleError } from "@/utils"
 import useCustomToast from "./useCustomToast"
@@
   const loginMutation = useMutation({
     mutationFn: login,
     onSuccess: () => {
+      // 登入成功＝唯一重置點：清空頁籤（只剩固定 Dashboard），persist 會同步寫回 localStorage
+      useTabStore.getState().reset()
       navigate({ to: "/" })
     },
     onError: handleError.bind(showErrorToast),
   })
```

設計要點：

- 用 `useTabStore.getState().reset()`（非 hook 形式）——`onSuccess` 不在 React render 階段，直接取 store 快照呼叫即可。
- `reset()` 內的 `set(...)` 會觸發 persist 自動寫回 localStorage，**不需手動清 storage**。
- `login()` 在 `mutationFn` 階段已寫入 `access_token`，`onSuccess` 只負責「先 `reset()` 後 `navigate`」。
- `logout()` 維持原樣（只移除 `access_token` 並導向 `/login`），不在登出時 reset——讓殘留清單在下次**登入成功**時才被覆蓋，控管點保持唯一。

### 6.3 上限 toast

`useOpenTab`（第 5.3 節）包住 `openTab` 的布林回傳值：`false` 時用 sonner 跳 `已達上限（20），請先關閉再開`。`openTab` 是「是否成功開啟」的唯一信號，store 內部不跳 toast（保持純資料、無 UI 副作用）。

### 6.4 資料流時序表（三情境）

**情境 A：登入**

| # | 步驟 | 狀態 / 副作用 |
| --- | --- | --- |
| 1 | 送出登入表單 | `loginMutation.mutate` |
| 2 | `mutationFn login()` 成功 | `localStorage["access_token"]` 寫入 |
| 3 | `onSuccess` → `useTabStore.getState().reset()` | 記憶體 store = `[fixedTab]`、`activeId=FIXED_TAB_ID` |
| 4 | `reset` 內 `set()` 觸發 persist | `localStorage[TAB_STORAGE_KEY]` 被覆蓋成只剩固定頁籤 |
| 5 | `navigate({ to: "/" })` | 進入首頁；只顯示 Dashboard（= 新的） |

**情境 B：F5 / 重整**

| # | 步驟 | 狀態 / 副作用 |
| --- | --- | --- |
| 1 | 瀏覽器重整，JS 重新載入 | 模組重新 evaluate |
| 2 | `create(persist(...))` 建立 store | persist 讀 `localStorage[TAB_STORAGE_KEY]` |
| 3 | rehydrate 灌回 `{tabs, activeId}` | 記憶體 store = 上次離開時的清單 |
| 4 | `onRehydrateStorage` 補正 | 保證 `tabs[0]=固定頁籤`；`activeId` 失效則退回 `FIXED_TAB_ID` |
| 5 | Controller mount 讀 store | 還原上次的頁籤列與 active（= 舊的） |

**情境 C：開到第 21 個**

| # | 步驟 | 狀態 / 副作用 |
| --- | --- | --- |
| 1 | 已有 20 個，再點一項 | `useOpenTab(key)` → `openTab(key)` |
| 2 | store 偵測 `tabs.length >= MAX_TABS` | 不新增、不改 `activeId`，回傳 `false` |
| 3 | `useOpenTab` 收到 `false` | `toast.error("已達上限（20），請先關閉再開")` |
| 4 | persist 不寫入（狀態未變） | `localStorage` 維持 20 筆 |

---

## 附錄：相依與環境

| 項目 | 版本 / 值 | 狀態 | 備註 |
| --- | --- | --- | --- |
| React | ^19.1.1 | 已裝 | 搭配 react-dom ^19.2.3 |
| TanStack Router | ^1.163.3 | 已裝 | 只服務路由頁，不參與頁籤 |
| TanStack React Query | ^5.90.21 | 已裝 | `ItemsView` 內 `useSuspenseQuery` 沿用 |
| TanStack React Table | ^8.21.3 | 已裝 | `DataTable`（`@/components/Common/DataTable`）使用 |
| **zustand** | latest | **需安裝** | `bun add zustand`；唯一真相 + `persist` |
| @dnd-kit/core · sortable · utilities | ^6.3.1 · ^10.0.0 · ^3.2.2 | 已裝 | 頁籤水平拖拉排序 |
| **@radix-ui/react-context-menu** | latest | **需安裝** | `bun add @radix-ui/react-context-menu`；右鍵三項選單 |
| @radix-ui/react-dropdown-menu | ^2.1.16 | 已裝 | 不用於右鍵選單（仍走 context-menu） |
| @radix-ui/react-scroll-area | ^1.2.10 | 已裝 | 頁籤列橫向溢位由 ScrollArea 處理 |
| sonner | ^2.0.7 | 已裝 | 上限 toast |
| lucide-react | ^0.563.0 | 已裝 | `Home` / `Briefcase` 等頁籤 icon |
| 套件管理 | bun | — | 一律 `bun add` / `bun run` |
| Lint | biome ^2.3.14（`bun run lint`） | — | `quoteStyle:"double"`、`semicolons:"asNeeded"`、`organizeImports:on`；`src/components/ui/**` 被忽略 |
| Build | `tsc -p tsconfig.build.json && vite build`（`bun run build`） | — | 型別關卡 |
| Test | `bunx playwright test`（`bun run test`） | — | e2e |
| localStorage key | `dodo.tabs.v2` | 新增 | `TAB_STORAGE_KEY`；v2 = 狀態驅動版 |
| 固定頁籤 | `FIXED_TAB_ID = "dashboard"` | 新增 | 永久最左、不可關/拖/移 |
| 上限 | `MAX_TABS = 20` | 新增 | 第 21 個硬擋 + toast |

### 安裝指令彙整

```bash
cd frontend
bun add zustand
bun add @radix-ui/react-context-menu
```

---

## 附錄：已知限制與改善重點

| 類別 | 項目 | 說明 |
| --- | --- | --- |
| 已知限制 | 跨分頁不同步 | 多分頁各自讀 localStorage，狀態不互通 |
| 已知限制 | 內部狀態不保活（路線 B） | 切走再切回，表單/捲動/查詢結果會重載；刻意取捨換記憶體可控 |
| 已知限制 | 上限 20 為硬上限 | 達上限只擋不自動關 |
| 已知限制 | `tabRegistry` 為靜態 import | 所有頁元件編譯期載入 |
| 改善重點 | 跨分頁同步 | 監聽 `storage` 事件或 `BroadcastChannel` |
| 改善重點 | 選擇性保活 | 改「上限 N 頁 LRU keep-alive」而非全保活 |
| 改善重點 | `tabRegistry` 動態載入 | 大頁元件改 `React.lazy` + `Suspense` |
| 改善重點 | Playwright 自動化 | 將八項驗證寫成 e2e，納入 `bun run test` |

---

## 跨章一致性校正記錄（總編輯）

以下為組裝時依 API 契約統一、消除章節間衝突的更正點：

1. **`TabPageHost` 介面統一**：第 2 章定義 `TabPageHost` 無 props（自行讀 store），但原第 4 章 Controller 草稿寫 `<TabPageHost tabs={tabs} activeId={activeId} />`。已統一為**無 props 版**，第 4 章改為 `<TabPageHost />`。
2. **`RenderTab` 形態統一**：第 3 章 `TabHeader` 的 `RenderTab` 含 `{ id, key, title, icon }`；第 4 章 Controller 草稿曾輸出 `fixed` 欄位且省略 `key`。已統一為輸出 `{ id, key, title, icon }`（含 `key`、不含 `fixed`），`fixed` 判斷由 `TabHeader` 內部以 `id === FIXED_TAB_ID` 自理。
3. **`FIXED_TAB_ID` 常數單一來源**：所有 `fixed` / 鎖定判斷一律 import 自 `@/stores/tabStore`，無任何字面量 `'dashboard'` 散落（第 3、4 章）。
4. **Dashboard 內容元件缺口**：契約要求 `tabRegistry["dashboard"].component`，但 `index.tsx` 的 `Dashboard` 未 export。全書統一採「新增 `DashboardView`」（第 2.1 節），第 0 章已標示此缺口、第 2、4 章 import 對齊。
5. **持久化程式碼去重**：persist 的 `partialize` / `onRehydrateStorage` 完整實作只出現在第 1 章；第 6 章僅引用其行為、不重貼，避免兩處漂移。
6. **`useOpenTab` 去重**：第 5、6 章曾各有一版，統一採第 5.3 節（`useCallback` + `MAX_TABS` 內插）一份。
7. **import 路徑全對齊**：`tabRegistry` 引用 `DashboardView` 與 `ItemsView`；`TabPageHost`/`Controller` 引用 `tabRegistry` 與 `useTabStore`；`useOpenTab` 引用 `useTabStore`；`useAuth` 引用 `useTabStore.getState().reset()`；側邊欄引用 `tabKeyMap` 與 `useOpenTab`——皆彼此對得起來。
8. **常數/型別/簽名全章一致**：`MAX_TABS=20`、`FIXED_TAB_ID="dashboard"`、`TAB_STORAGE_KEY="dodo.tabs.v2"`、`TabItem={id,key}`、`TabKey=string`、七個 store 動作簽名，跨章逐字核對無歧異。
