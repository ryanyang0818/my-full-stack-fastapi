# Sidebar Tree Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在現有 sidebar 中，原有平面選單下方加入搜尋框與三層可展開樹狀選單（含完整 ERP 六大模組資料）。

**Architecture:** 三個新檔案 — `tree-data.ts`（型別 + 靜態資料）、`SidebarSearch.tsx`（受控搜尋框）、`TreeMenu.tsx`（三層可展開樹 + 過濾邏輯）— 組裝進 `AppSidebar.tsx`。搜尋狀態由 `AppSidebar` 管理，以 props 向下傳遞。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui (`SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuSub`, `SidebarMenuSubButton`), Lucide React, Vitest + React Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/Sidebar/tree-data.ts` | CREATE | TypeScript 型別 + 靜態 ERP 樹狀資料 + `filterTree` 函式 |
| `src/components/Sidebar/SidebarSearch.tsx` | CREATE | 受控搜尋輸入框，sidebar 收合時隱藏 |
| `src/components/Sidebar/TreeMenu.tsx` | CREATE | 三層可展開樹狀選單，接收 search prop 做即時過濾 |
| `src/components/Sidebar/AppSidebar.tsx` | MODIFY | 在 `<Main />` 下方掛入搜尋框與樹狀選單 |
| `src/components/Sidebar/__tests__/filterTree.test.ts` | CREATE | `filterTree` 純函式單元測試 |
| `src/components/Sidebar/__tests__/SidebarSearch.test.tsx` | CREATE | SidebarSearch 互動測試 |

---

### Task 1: Types + Static Data + filterTree

**Files:**
- Create: `src/components/Sidebar/tree-data.ts`
- Create: `src/components/Sidebar/__tests__/filterTree.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/Sidebar/__tests__/filterTree.test.ts
import { describe, it, expect } from 'vitest'
import { filterTree, TREE_DATA } from '../tree-data'

describe('filterTree', () => {
  it('returns all data when query is empty', () => {
    expect(filterTree(TREE_DATA, '')).toHaveLength(TREE_DATA.length)
  })

  it('returns empty array when no match', () => {
    expect(filterTree(TREE_DATA, 'zzz不存在zzz')).toHaveLength(0)
  })

  it('matches group label', () => {
    const result = filterTree(TREE_DATA, '財務')
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('財務管理')
  })

  it('matches leaf label and returns full parent chain', () => {
    const result = filterTree(TREE_DATA, '廠商主檔')
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('採購管理')
    expect(result[0].children[0].label).toBe('供應商管理')
    expect(result[0].children[0].children[0].label).toBe('廠商主檔')
  })

  it('matches leaf code exactly', () => {
    const result = filterTree(TREE_DATA, 'PUR001')
    expect(result[0].children[0].children[0].code).toBe('PUR001')
  })

  it('is case-insensitive for codes', () => {
    const result = filterTree(TREE_DATA, 'pur001')
    expect(result[0].children[0].children[0].code).toBe('PUR001')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/components/Sidebar/__tests__/filterTree.test.ts`
Expected: FAIL with `Cannot find module '../tree-data'`

- [ ] **Step 3: Create tree-data.ts**

```typescript
// src/components/Sidebar/tree-data.ts
import {
  BarChart3,
  CreditCard,
  FileText,
  Folder,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TreeLeaf = {
  type: 'leaf'
  icon: LucideIcon
  label: string
  code?: string
  path?: string
  badge?: number
  badgeVariant?: 'default' | 'warn'
}

export type TreeFolder = {
  type: 'folder'
  icon: LucideIcon
  label: string
  children: TreeLeaf[]
}

export type TreeGroup = {
  type: 'group'
  icon: LucideIcon
  label: string
  children: TreeFolder[]
  badge?: number
  badgeVariant?: 'default' | 'warn'
}

export const TREE_DATA: TreeGroup[] = [
  {
    type: 'group',
    icon: ShoppingCart,
    label: '採購管理',
    badge: 28,
    children: [
      {
        type: 'folder',
        icon: Folder,
        label: '採購訂單',
        children: [
          { type: 'leaf', icon: FileText, label: '訂單管理', code: 'PUR001' },
          { type: 'leaf', icon: FileText, label: '到貨確認', code: 'PUR002' },
          { type: 'leaf', icon: FileText, label: '退貨處理', code: 'PUR003' },
          { type: 'leaf', icon: FileText, label: '採購異常處理', code: 'PUR004', badge: 3, badgeVariant: 'warn' },
          { type: 'leaf', icon: FileText, label: '採購結案作業', code: 'PUR005' },
        ],
      },
      {
        type: 'folder',
        icon: Folder,
        label: '詢價作業',
        children: [
          { type: 'leaf', icon: FileText, label: '詢價單建立', code: 'PUR011' },
          { type: 'leaf', icon: FileText, label: '報價比較', code: 'PUR012' },
          { type: 'leaf', icon: FileText, label: '詢價歷史', code: 'PUR013' },
        ],
      },
      {
        type: 'folder',
        icon: Folder,
        label: '供應商管理',
        children: [
          { type: 'leaf', icon: FileText, label: '廠商主檔', code: 'PUR021' },
          { type: 'leaf', icon: FileText, label: '廠商評鑑', code: 'PUR022' },
          { type: 'leaf', icon: FileText, label: '廠商分類維護', code: 'PUR023' },
          { type: 'leaf', icon: FileText, label: '廠商往來明細', code: 'PUR024' },
        ],
      },
    ],
  },
  {
    type: 'group',
    icon: TrendingUp,
    label: '銷售管理',
    badge: 15,
    children: [
      { type: 'folder', icon: Folder, label: '銷售訂單', children: [] },
      { type: 'folder', icon: Folder, label: '出貨作業', children: [] },
      { type: 'folder', icon: Folder, label: '客戶管理', children: [] },
    ],
  },
  {
    type: 'group',
    icon: Package,
    label: '庫存管理',
    badge: 22,
    children: [
      { type: 'folder', icon: Folder, label: '進貨作業', children: [] },
      { type: 'folder', icon: Folder, label: '出貨作業', children: [] },
      { type: 'folder', icon: Folder, label: '盤點作業', children: [] },
      { type: 'folder', icon: Folder, label: '調撥作業', children: [] },
      { type: 'folder', icon: Folder, label: '庫存查詢', children: [] },
    ],
  },
  {
    type: 'group',
    icon: CreditCard,
    label: '財務管理',
    badge: 7,
    badgeVariant: 'warn',
    children: [
      { type: 'folder', icon: Folder, label: '應收帳款', children: [] },
      { type: 'folder', icon: Folder, label: '應付帳款', children: [] },
      { type: 'folder', icon: Folder, label: '收付款處理', children: [] },
      { type: 'folder', icon: Folder, label: '發票管理', children: [] },
    ],
  },
  {
    type: 'group',
    icon: BarChart3,
    label: '報表中心',
    children: [],
  },
  {
    type: 'group',
    icon: Settings,
    label: '系統設定',
    children: [],
  },
]

// 依搜尋字串過濾樹狀資料，保留完整父子路徑
export function filterTree(data: TreeGroup[], query: string): TreeGroup[] {
  if (!query.trim()) return data
  const q = query.toLowerCase()

  return data
    .map((group): TreeGroup | null => {
      if (group.label.toLowerCase().includes(q)) return group

      const matchedFolders = group.children
        .map((folder): TreeFolder | null => {
          if (folder.label.toLowerCase().includes(q)) return folder

          const matchedLeaves = folder.children.filter(
            (leaf) =>
              leaf.label.toLowerCase().includes(q) ||
              (leaf.code?.toLowerCase().includes(q) ?? false)
          )
          if (matchedLeaves.length > 0) return { ...folder, children: matchedLeaves }
          return null
        })
        .filter((f): f is TreeFolder => f !== null)

      if (matchedFolders.length > 0) return { ...group, children: matchedFolders }
      return null
    })
    .filter((g): g is TreeGroup => g !== null)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/components/Sidebar/__tests__/filterTree.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar/tree-data.ts src/components/Sidebar/__tests__/filterTree.test.ts
git commit -m "feat(sidebar): add tree data types, ERP static data, and filterTree"
```

---

### Task 2: SidebarSearch Component

**Files:**
- Create: `src/components/Sidebar/SidebarSearch.tsx`
- Create: `src/components/Sidebar/__tests__/SidebarSearch.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/Sidebar/__tests__/SidebarSearch.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SidebarSearch } from '../SidebarSearch'

vi.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

describe('SidebarSearch', () => {
  it('calls onChange with typed value', () => {
    const onChange = vi.fn()
    render(<SidebarSearch value='' onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('搜尋功能...'), {
      target: { value: '採購' },
    })
    expect(onChange).toHaveBeenCalledWith('採購')
  })

  it('shows clear button when value is not empty', () => {
    const onChange = vi.fn()
    render(<SidebarSearch value='test' onChange={onChange} />)
    const clearBtn = screen.getByRole('button')
    fireEvent.click(clearBtn)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('hides clear button when value is empty', () => {
    render(<SidebarSearch value='' onChange={vi.fn()} />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/components/Sidebar/__tests__/SidebarSearch.test.tsx`
Expected: FAIL with `Cannot find module '../SidebarSearch'`

- [ ] **Step 3: Create SidebarSearch**

```tsx
// src/components/Sidebar/SidebarSearch.tsx
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar'

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
}

// 側邊欄搜尋框，sidebar 收合時自動隱藏
export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <SidebarGroup className='group-data-[collapsible=icon]:hidden py-2 px-2'>
      <SidebarGroupContent>
        <div className='relative'>
          <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none' />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder='搜尋功能...'
            className='h-7 pl-7 pr-6 text-xs'
          />
          {value && (
            <button
              type='button'
              onClick={() => onChange('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/components/Sidebar/__tests__/SidebarSearch.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar/SidebarSearch.tsx src/components/Sidebar/__tests__/SidebarSearch.test.tsx
git commit -m "feat(sidebar): add SidebarSearch component with tests"
```

---

### Task 3: TreeMenu Component

**Files:**
- Create: `src/components/Sidebar/TreeMenu.tsx`

- [ ] **Step 1: Create TreeMenu**

```tsx
// src/components/Sidebar/TreeMenu.tsx
import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  filterTree,
  type TreeFolder,
  type TreeGroup,
  type TreeLeaf,
} from './tree-data'

interface TreeMenuProps {
  data: TreeGroup[]
  search: string
}

// Lv3 葉節點
function LeafItem({ leaf }: { leaf: TreeLeaf }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild size='sm'>
        <a href={leaf.path ?? '#'} className='flex items-center gap-1.5'>
          <leaf.icon className='h-3.5 w-3.5 shrink-0' />
          <span className='flex-1 truncate'>{leaf.label}</span>
          {leaf.code && (
            <span className='text-[10px] font-mono text-muted-foreground shrink-0'>
              {leaf.code}
            </span>
          )}
          {leaf.badge !== undefined && (
            <span
              className={cn(
                'rounded px-1 text-[10px] font-medium shrink-0',
                leaf.badgeVariant === 'warn'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {leaf.badge}
            </span>
          )}
        </a>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

// Lv2 資料夾節點（可展開）
function FolderItem({
  folder,
  defaultOpen = false,
}: {
  folder: TreeFolder
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size='sm'
        onClick={() => setOpen((v) => !v)}
        className='gap-1.5'
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-90'
          )}
        />
        <folder.icon className='h-3.5 w-3.5 shrink-0' />
        <span className='flex-1 truncate'>{folder.label}</span>
      </SidebarMenuButton>
      {open && folder.children.length > 0 && (
        <SidebarMenuSub>
          {folder.children.map((leaf) => (
            <LeafItem key={leaf.code ?? leaf.label} leaf={leaf} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

// Lv1 群組節點（可展開，收合時顯示 tooltip）
function GroupItem({
  group,
  defaultOpen = false,
}: {
  group: TreeGroup
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen((v) => !v)}
        tooltip={group.label}
        className='gap-1.5'
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[collapsible=icon]:hidden',
            open && 'rotate-90'
          )}
        />
        <group.icon className='h-4 w-4 shrink-0' />
        <span className='flex-1 truncate font-medium'>{group.label}</span>
        {group.badge !== undefined && (
          <span
            className={cn(
              'rounded px-1.5 text-[10px] font-medium shrink-0',
              group.badgeVariant === 'warn'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {group.badge}
          </span>
        )}
      </SidebarMenuButton>
      {open && group.children.length > 0 && (
        <SidebarMenuSub>
          <SidebarMenu>
            {group.children.map((folder) => (
              <FolderItem
                key={folder.label}
                folder={folder}
                defaultOpen={defaultOpen}
              />
            ))}
          </SidebarMenu>
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

// 樹狀選單根元件，搜尋時自動展開匹配路徑
export function TreeMenu({ data, search }: TreeMenuProps) {
  const isSearching = search.trim().length > 0
  const filtered = useMemo(() => filterTree(data, search), [data, search])

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {filtered.map((group) => (
            <GroupItem
              key={group.label}
              group={group}
              defaultOpen={isSearching}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
```

- [ ] **Step 2: Run type check**

Run: `bun run tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar/TreeMenu.tsx
git commit -m "feat(sidebar): add TreeMenu 3-level collapsible component"
```

---

### Task 4: Wire into AppSidebar

**Files:**
- Modify: `src/components/Sidebar/AppSidebar.tsx`

- [ ] **Step 1: Update AppSidebar.tsx**

```tsx
// src/components/Sidebar/AppSidebar.tsx
import { useState } from 'react'
import { Briefcase, Home, Users } from 'lucide-react'

import { SidebarAppearance } from '@/components/Common/Appearance'
import { Logo } from '@/components/Common/Logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import useAuth from '@/hooks/useAuth'
import { type Item, Main } from './Main'
import { SidebarSearch } from './SidebarSearch'
import { TreeMenu } from './TreeMenu'
import { TREE_DATA } from './tree-data'
import { User } from './User'

const baseItems: Item[] = [
  { icon: Home, title: 'Dashboard', path: '/' },
  { icon: Briefcase, title: 'Items', path: '/items' },
]

// 組合登入後頁面的主選單、外觀設定與使用者資訊
export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')

  const items = currentUser?.is_superuser
    ? [...baseItems, { icon: Users, title: 'Admin', path: '/admin' }]
    : baseItems

  return (
    <Sidebar
      collapsible='icon'
      data-dodo-section='sidebar'
      className='top-[var(--user-header-layout-height)] h-[calc(100svh-var(--user-header-layout-height)-var(--app-footer-layout-height))] md:top-[calc(var(--app-menu-layout-height)+var(--user-header-layout-height))] md:h-[calc(100svh-var(--app-menu-layout-height)-var(--user-header-layout-height)-var(--app-footer-layout-height))]'
    >
      <SidebarHeader className='px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center'>
        <Logo variant='responsive' />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
        <SidebarSearch value={search} onChange={setSearch} />
        <TreeMenu data={TREE_DATA} search={search} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
```

- [ ] **Step 2: Run type check**

Run: `bun run tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar/AppSidebar.tsx
git commit -m "feat(sidebar): wire SidebarSearch and TreeMenu into AppSidebar"
```

---

### Task 5: Manual Smoke Test

- [ ] **Step 1: Start dev server**

Run: `bun run dev`

- [ ] **Step 2: Verify in browser (checklist)**

| 驗證項目 | 預期結果 |
|---------|---------|
| 原有平面選單（Dashboard / Items）位於最上方 | ✓ |
| 搜尋框出現在平面選單下方 | ✓ |
| 六個 Lv1 群組全部顯示 | ✓ |
| 點擊「採購管理」→ 展開 3 個資料夾 | ✓ |
| 點擊「採購訂單」→ 展開 5 個葉節點，顯示代碼（PUR001...） | ✓ |
| 輸入「廠商」→ 只顯示採購管理 > 供應商管理路徑，自動展開 | ✓ |
| 點擊 X 清除搜尋 → 樹狀回到收合狀態 | ✓ |
| sidebar 收合為 icon-only → 搜尋框隱藏，群組 icon 顯示 tooltip | ✓ |
| 採購管理 badge (28) 顯示 | ✓ |
| 財務管理 badge (7) 顯示琥珀色警示樣式 | ✓ |
| 採購異常處理 badge (3) 顯示琥珀色警示樣式 | ✓ |

---

## Summary

- **新建 5 個檔案**（tree-data.ts, SidebarSearch.tsx, TreeMenu.tsx, 2 個測試）
- **修改 1 個檔案**（AppSidebar.tsx）
- **共 4 個 commit**
- `Main.tsx` / `User.tsx` / `sidebar.tsx` 不動
