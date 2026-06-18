# Codex Sidebar Tree Menu Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依照 `R:\001.工作日誌\05_w21\0519_3_ERP複雜畫面\index.html` 的 sidebar，將現有 shadcn/ui Sidebar 擴充為 ERP 風格樹狀選單，包含完整參考選項、選單搜尋、Badge、Code、active 狀態與 light theme 樣式；原有選單保留在第一層上方。

**Architecture:** 保留現有 `Main.tsx` 平面選單，新增 ERP tree 專用資料、搜尋與遞迴元件。樣式全部寫在 JSX Tailwind class，不搬移參考檔的全域 CSS。`AppSidebar.tsx` 只負責組合：Logo、原有選單、ERP 搜尋與樹狀選單、Footer。

**Tech Stack:** React 19 + TypeScript, Tailwind CSS 4, shadcn/ui Sidebar / Input / Badge, Radix Collapsible, TanStack Router, lucide-react, Bun, Biome

## Global Constraints

- 回覆與註解使用繁體中文；程式碼、指令、套件名稱與路徑維持 English。
- 每個 function 上方必須有簡短中文註解。
- 2-space indentation。
- 優先沿用既有 shadcn/ui、Tailwind token 與 lucide-react。
- 不修改全域 CSS，不直接搬移 `styles.css`。
- 不修改 `Main.tsx`，原有選單維持在 ERP 樹狀選單上方。
- 不新增假 route；ERP tree leaf 先用 local active state，現有真實路由仍由原有選單處理。
- 保留 `AppSidebar.tsx` 既有 `<Sidebar>` 高度 className。
- commit 前必須跑測試；本計畫不包含 `npm run build`。
- 參考檔：`R:\001.工作日誌\05_w21\0519_3_ERP複雜畫面\index.html`
- 參考樣式：`R:\001.工作日誌\05_w21\0519_3_ERP複雜畫面\styles.css`

---

## Exploration Summary

| 項目 | 結論 |
|---|---|
| 現有 Sidebar | `AppSidebar.tsx` + `Main.tsx`，目前是平面選單 |
| 原有選單 | `Dashboard`、`Items`、`Admin` 要保留，放在 ERP tree 上方 |
| 參考 Sidebar | 有「功能選單」標題、搜尋框、三層 tree、code、badge、warn badge |
| 參考 row 樣式 | row 高度 `26px`、active 左側 `2px` accent、code 使用 mono 字體 |
| 實作策略 | 拆成 focused files，不改 route，不改 global CSS |

## File Map

| 動作 | 路徑 | 責任 |
|---|---|---|
| 新增 | `src/components/Sidebar/types.ts` | ERP tree menu 型別 |
| 新增 | `src/components/Sidebar/erpMenuData.ts` | 完整參考選單資料 |
| 新增 | `src/components/Sidebar/SidebarSearch.tsx` | Sidebar 搜尋框 |
| 新增 | `src/components/Sidebar/SidebarTree.tsx` | 遞迴樹狀選單 |
| 新增 | `src/components/ui/collapsible.tsx` | shadcn Collapsible wrapper |
| 修改 | `src/components/Sidebar/AppSidebar.tsx` | 保留原選單並接入 ERP search/tree |
| 可能修改 | `package.json`、`../bun.lock` | 只有在缺少 `@radix-ui/react-collapsible` 時修改 |

---

## Reference Menu Data

| Lv1 | Badge | Lv2 | Lv3 / Code |
|---|---:|---|---|
| 採購管理 | 28 | 採購訂單 | 訂單管理 `PUR001`、到貨確認 `PUR002`、退貨處理 `PUR003`、採購異常處理 `PUR004` warn `3`、採購結案作業 `PUR005` |
| 採購管理 | 28 | 詢價作業 | 詢價單建立 `PUR011`、報價比較 `PUR012`、詢價歷史 `PUR013` |
| 採購管理 | 28 | 供應商管理 | 廠商主檔 `PUR021`、廠商評鑑 `PUR022`、廠商分類維護 `PUR023`、廠商往來明細 `PUR024` |
| 銷售管理 | 15 | - | 銷售訂單、出貨作業、客戶管理 |
| 庫存管理 | 22 | - | 進貨作業、出貨作業、盤點作業、調撥作業、庫存查詢 |
| 財務管理 | warn 7 | - | 應收帳款、應付帳款、收付款處理、發票管理 |
| 報表中心 | - | - | - |
| 系統設定 | - | - | - |

---

## Task 1: 建立 Collapsible 元件

**Files:**
- Create: `src/components/ui/collapsible.tsx`
- Maybe Modify: `package.json`
- Maybe Modify: `../bun.lock`

**Interfaces:**
- Produces: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- Consumes: `@radix-ui/react-collapsible`

- [ ] **Step 1: 確認依賴是否已存在**

```bash
bun pm ls @radix-ui/react-collapsible
```

Expected:
- 若已存在，跳到 Step 3。
- 若不存在，執行 Step 2。

- [ ] **Step 2: 安裝缺少的 Radix Collapsible**

```bash
bun add @radix-ui/react-collapsible
```

Expected:
- `package.json` 新增 `@radix-ui/react-collapsible`
- `../bun.lock` 更新

- [ ] **Step 3: 新增 shadcn-style wrapper**

```tsx
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

// Collapsible 根節點，控制展開與收合狀態
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

// Collapsible 觸發器，用於群組列點擊展開
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

// Collapsible 內容區，包住子層選單
function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```

- [ ] **Step 4: 局部檢查**

```bash
bunx biome check --write --unsafe --files-ignore-unknown=true src/components/ui/collapsible.tsx
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Biome no errors
- TypeScript no errors

---

## Task 2: 建立 Sidebar tree 型別

**Files:**
- Create: `src/components/Sidebar/types.ts`

**Interfaces:**
- Produces:
  - `SidebarMenuBadgeVariant`
  - `SidebarMenuItem`

- [ ] **Step 1: 新增型別檔**

```ts
import type { LucideIcon } from "lucide-react"

export type SidebarMenuBadgeVariant = "default" | "warning"

export type SidebarMenuItem = {
  id: string
  title: string
  icon?: LucideIcon
  path?: string
  code?: string
  badge?: number
  badgeVariant?: SidebarMenuBadgeVariant
  children?: SidebarMenuItem[]
}
```

- [ ] **Step 2: 局部檢查**

```bash
bunx biome check --write --unsafe --files-ignore-unknown=true src/components/Sidebar/types.ts
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Biome no errors
- TypeScript no errors

---

## Task 3: 建立完整 ERP menu data

**Files:**
- Create: `src/components/Sidebar/erpMenuData.ts`

**Interfaces:**
- Consumes: `SidebarMenuItem`
- Produces: `erpMenuItems: SidebarMenuItem[]`

- [ ] **Step 1: 新增完整資料**

```ts
import {
  Banknote,
  Boxes,
  FileText,
  Folder,
  ReceiptText,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "lucide-react"

import type { SidebarMenuItem } from "./types"

export const erpMenuItems: SidebarMenuItem[] = [
  {
    id: "purchase",
    title: "採購管理",
    icon: ShoppingCart,
    badge: 28,
    children: [
      {
        id: "purchase-orders",
        title: "採購訂單",
        icon: Folder,
        children: [
          { id: "purchase-order-management", title: "訂單管理", icon: FileText, code: "PUR001" },
          { id: "purchase-arrival-confirm", title: "到貨確認", icon: FileText, code: "PUR002" },
          { id: "purchase-return", title: "退貨處理", icon: FileText, code: "PUR003" },
          {
            id: "purchase-exception",
            title: "採購異常處理",
            icon: FileText,
            code: "PUR004",
            badge: 3,
            badgeVariant: "warning",
          },
          { id: "purchase-close", title: "採購結案作業", icon: FileText, code: "PUR005" },
        ],
      },
      {
        id: "purchase-inquiry",
        title: "詢價作業",
        icon: Folder,
        children: [
          { id: "purchase-inquiry-create", title: "詢價單建立", icon: FileText, code: "PUR011" },
          { id: "purchase-quote-compare", title: "報價比較", icon: FileText, code: "PUR012" },
          { id: "purchase-inquiry-history", title: "詢價歷史", icon: FileText, code: "PUR013" },
        ],
      },
      {
        id: "supplier-management",
        title: "供應商管理",
        icon: Folder,
        children: [
          { id: "supplier-master", title: "廠商主檔", icon: FileText, code: "PUR021" },
          { id: "supplier-rating", title: "廠商評鑑", icon: FileText, code: "PUR022" },
          { id: "supplier-category", title: "廠商分類維護", icon: FileText, code: "PUR023" },
          { id: "supplier-ledger", title: "廠商往來明細", icon: FileText, code: "PUR024" },
        ],
      },
    ],
  },
  {
    id: "sales",
    title: "銷售管理",
    icon: TrendingUp,
    badge: 15,
    children: [
      { id: "sales-order", title: "銷售訂單", icon: Folder },
      { id: "sales-shipping", title: "出貨作業", icon: Folder },
      { id: "customer-management", title: "客戶管理", icon: Folder },
    ],
  },
  {
    id: "inventory",
    title: "庫存管理",
    icon: Boxes,
    badge: 22,
    children: [
      { id: "inventory-receiving", title: "進貨作業", icon: Folder },
      { id: "inventory-shipping", title: "出貨作業", icon: Folder },
      { id: "inventory-counting", title: "盤點作業", icon: Folder },
      { id: "inventory-transfer", title: "調撥作業", icon: Folder },
      { id: "inventory-query", title: "庫存查詢", icon: Folder },
    ],
  },
  {
    id: "finance",
    title: "財務管理",
    icon: Banknote,
    badge: 7,
    badgeVariant: "warning",
    children: [
      { id: "accounts-receivable", title: "應收帳款", icon: Folder },
      { id: "accounts-payable", title: "應付帳款", icon: Folder },
      { id: "payment-processing", title: "收付款處理", icon: Folder },
      { id: "invoice-management", title: "發票管理", icon: Folder },
    ],
  },
  { id: "reports", title: "報表中心", icon: ReceiptText },
  { id: "system", title: "系統設定", icon: Settings },
]
```

- [ ] **Step 2: 局部檢查**

```bash
bunx biome check --write --unsafe --files-ignore-unknown=true src/components/Sidebar/erpMenuData.ts
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Biome no errors
- TypeScript no errors

---

## Task 4: 建立 SidebarSearch

**Files:**
- Create: `src/components/Sidebar/SidebarSearch.tsx`

**Interfaces:**
- Produces: `SidebarSearch({ value, onChange }: SidebarSearchProps)`

- [ ] **Step 1: 新增搜尋框元件**

```tsx
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
}

// Sidebar 功能搜尋框，對齊 ERP 參考畫面的高密度樣式
export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <div className="border-sidebar-border/70 border-b px-2.5 py-1.5 group-data-[collapsible=icon]:hidden">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="搜尋功能"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="搜尋功能..."
          className="h-7 rounded-[3px] bg-background pl-7 pr-2 text-xs shadow-none"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 局部檢查**

```bash
bunx biome check --write --unsafe --files-ignore-unknown=true src/components/Sidebar/SidebarSearch.tsx
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Biome no errors
- TypeScript no errors

---

## Task 5: 建立 SidebarTree 遞迴元件

**Files:**
- Create: `src/components/Sidebar/SidebarTree.tsx`

**Interfaces:**
- Consumes:
  - `SidebarMenuItem`
  - `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- Produces:
  - `SidebarTree({ items, searchQuery }: SidebarTreeProps)`

- [ ] **Step 1: 新增完整遞迴元件**

```tsx
import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import type { SidebarMenuBadgeVariant, SidebarMenuItem as TreeItem } from "./types"

// 判斷選單項目是否命中搜尋文字
function itemMatches(item: TreeItem, keyword: string): boolean {
  const normalized = keyword.toLowerCase()

  return (
    item.title.toLowerCase().includes(normalized) ||
    item.code?.toLowerCase().includes(normalized) === true
  )
}

// 遞迴過濾樹狀資料，保留命中節點的父層路徑
function filterTree(items: TreeItem[], keyword: string): TreeItem[] {
  if (!keyword.trim()) return items

  return items.reduce<TreeItem[]>((result, item) => {
    const children = item.children ? filterTree(item.children, keyword) : []

    if (itemMatches(item, keyword) || children.length > 0) {
      result.push({ ...item, children })
    }

    return result
  }, [])
}

// 選單右側徽章，支援一般與警示狀態
function TreeBadge({
  count,
  variant,
}: {
  count: number
  variant?: SidebarMenuBadgeVariant
}) {
  return (
    <Badge
      variant="outline"
      className={[
        "ml-auto grid h-3.5 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold leading-none",
        variant === "warning"
          ? "border-orange-200 bg-orange-50 text-orange-600"
          : "border-sidebar-border bg-sidebar-accent text-muted-foreground",
      ].join(" ")}
    >
      {count}
    </Badge>
  )
}

interface TreeNodeProps {
  item: TreeItem
  depth: number
  activeId: string
  forceOpen: boolean
  onActivate: (id: string) => void
}

// 遞迴渲染單一節點，對應參考檔 tree-row lv1/lv2/lv3 樣式
function TreeNode({
  item,
  depth,
  activeId,
  forceOpen,
  onActivate,
}: TreeNodeProps) {
  const { state } = useSidebar()
  const hasChildren = !!item.children?.length
  const isCollapsed = state === "collapsed"
  const isActive = activeId === item.id
  const shouldOpen = depth === 0 || forceOpen || item.children?.some((child) => child.id === activeId) === true
  const [open, setOpen] = useState(shouldOpen)

  useEffect(() => {
    if (shouldOpen) {
      setOpen(true)
    }
  }, [shouldOpen])

  const Icon = item.icon
  const depthPadding = depth === 0 ? "pl-2.5" : depth === 1 ? "pl-5" : "pl-[38px]"
  const rowClass = [
    "relative flex h-[26px] w-full items-center gap-1.5 pr-2 text-left text-xs transition-colors duration-150",
    "select-none rounded-none outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    isCollapsed && depth === 0 ? "justify-center px-0" : depthPadding,
    depth === 0 ? "font-semibold text-sidebar-foreground" : "font-normal text-muted-foreground",
    isActive
      ? "bg-sidebar-accent text-sidebar-primary font-semibold"
      : "hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
  ].join(" ")

  const content = (
    <>
      {isActive && !isCollapsed ? (
        <span className="absolute left-0 top-0 h-full w-0.5 bg-sidebar-primary" />
      ) : null}
      {hasChildren && !isCollapsed ? (
        <ChevronRight
          className={[
            "size-3 shrink-0 text-muted-foreground transition-transform duration-150",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
      ) : null}
      {Icon ? <Icon className="size-3.5 shrink-0 text-muted-foreground" /> : null}
      {!isCollapsed ? (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.code ? (
            <span className="font-mono text-[10px] tracking-[0.03em] text-muted-foreground">
              {item.code}
            </span>
          ) : null}
          {item.badge !== undefined ? (
            <TreeBadge count={item.badge} variant={item.badgeVariant} />
          ) : null}
        </>
      ) : null}
    </>
  )

  if (!hasChildren) {
    return (
      <button
        type="button"
        title={isCollapsed ? item.title : undefined}
        className={rowClass}
        onClick={() => onActivate(item.id)}
      >
        {content}
      </button>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" title={isCollapsed ? item.title : undefined} className={rowClass}>
          {content}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
        {item.children?.map((child) => (
          <TreeNode
            key={child.id}
            item={child}
            depth={depth + 1}
            activeId={activeId}
            forceOpen={forceOpen}
            onActivate={onActivate}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

interface SidebarTreeProps {
  items: TreeItem[]
  searchQuery: string
}

// 渲染 ERP 樹狀功能選單，包含搜尋結果與空狀態
export function SidebarTree({ items, searchQuery }: SidebarTreeProps) {
  const [activeId, setActiveId] = useState("purchase-order-management")
  const filteredItems = filterTree(items, searchQuery)

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupContent>
        {filteredItems.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            查無符合的選單
          </div>
        ) : (
          <SidebarMenu className="gap-0 py-1">
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <TreeNode
                  item={item}
                  depth={0}
                  activeId={activeId}
                  forceOpen={!!searchQuery.trim()}
                  onActivate={setActiveId}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
```

- [ ] **Step 2: 局部檢查**

```bash
bunx biome check --write --unsafe --files-ignore-unknown=true src/components/Sidebar/SidebarTree.tsx
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Biome no errors
- TypeScript no errors

---

## Task 6: 整合 AppSidebar

**Files:**
- Modify: `src/components/Sidebar/AppSidebar.tsx`

**Interfaces:**
- Consumes:
  - `Main`
  - `erpMenuItems`
  - `SidebarSearch`
  - `SidebarTree`

- [ ] **Step 1: 更新 imports 與 state**

在 `AppSidebar.tsx` 加入：

```tsx
import { useState } from "react"

import { erpMenuItems } from "./erpMenuData"
import { SidebarSearch } from "./SidebarSearch"
import { SidebarTree } from "./SidebarTree"
```

在 `AppSidebar` function 內加入：

```tsx
const [searchQuery, setSearchQuery] = useState("")
```

- [ ] **Step 2: 保留原有選單並加入 ERP tree**

`SidebarContent` 調整為：

```tsx
<SidebarContent className="overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--sidebar-border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border [&::-webkit-scrollbar-track]:bg-transparent">
  <Main items={items} />

  <div className="mx-2 my-1 border-t border-sidebar-border/70 group-data-[collapsible=icon]:hidden" />
  <div className="flex h-8 items-center justify-between border-y border-sidebar-border/70 bg-sidebar-accent/50 px-2.5 group-data-[collapsible=icon]:hidden">
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      功能選單
    </span>
  </div>

  <SidebarSearch value={searchQuery} onChange={setSearchQuery} />
  <SidebarTree items={erpMenuItems} searchQuery={searchQuery} />
</SidebarContent>
```

- [ ] **Step 3: 確認 `<Sidebar>` className 未被移除**

必須保留：

```tsx
className="top-[var(--user-header-layout-height)] h-[calc(100svh-var(--user-header-layout-height)-var(--app-footer-layout-height))] md:top-[calc(var(--app-menu-layout-height)+var(--user-header-layout-height))] md:h-[calc(100svh-var(--app-menu-layout-height)-var(--user-header-layout-height)-var(--app-footer-layout-height))]"
```

- [ ] **Step 4: 局部檢查**

```bash
bunx biome check --write --unsafe --files-ignore-unknown=true src/components/Sidebar/AppSidebar.tsx
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Biome no errors
- TypeScript no errors

---

## Task 7: 驗收

**Files:**
- No file changes

- [ ] **Step 1: 跑 lint**

```bash
bun run lint
```

Expected:
- Exit code `0`

- [ ] **Step 2: 跑 TypeScript check**

```bash
bunx tsc -p tsconfig.json --noEmit
```

Expected:
- Exit code `0`

- [ ] **Step 3: 啟動 dev server**

```bash
bun dev
```

Expected:
- Vite dev server running

- [ ] **Step 4: 手動 UI 驗收**

| 驗收項目 | 預期 |
|---|---|
| 原有選單 | `Dashboard`、`Items`、Admin 使用者看到 `Admin`，位於 ERP tree 上方 |
| 功能選單標題 | 顯示 `功能選單` |
| 搜尋框 | 顯示 `搜尋功能...`，collapsed 隱藏 |
| 搜尋 `PUR004` | 保留 `採購管理 > 採購訂單 > 採購異常處理` |
| 搜尋 `廠商` | 保留 `採購管理 > 供應商管理` 與相關子項 |
| 無結果 | 顯示 `查無符合的選單` |
| 展開收合 | Chevron 旋轉，子層顯示 / 隱藏 |
| Badge | `28`、`15`、`22`、warn `7`、warn `3` 顯示 |
| Active | leaf 點擊後左側 accent 條與高亮出現 |
| Scrollbar | 選單過高時只捲動 content，不影響 Header / Footer |

- [ ] **Step 5: Git 狀態檢查**

```bash
git status --short
```

Expected:
- 只包含本計畫列出的檔案與使用者已知既有 untracked 文件。

---

## Commit Plan

若使用者要求 commit，先確認 commit message，再執行：

```bash
git add src/components/ui/collapsible.tsx \
  src/components/Sidebar/types.ts \
  src/components/Sidebar/erpMenuData.ts \
  src/components/Sidebar/SidebarSearch.tsx \
  src/components/Sidebar/SidebarTree.tsx \
  src/components/Sidebar/AppSidebar.tsx \
  package.json \
  ../bun.lock

git commit -m "feat(sidebar): 新增 Codex ERP 樹狀選單搜尋"
```

若沒有新增 `@radix-ui/react-collapsible`，不要 stage `package.json` 與 `../bun.lock`。
