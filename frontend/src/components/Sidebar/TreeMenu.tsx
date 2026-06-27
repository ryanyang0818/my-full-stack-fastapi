import * as Icons from "lucide-react"
import { ChevronRight, FileText, type LucideIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type { MenuTreeNodePublic } from "@/client"
import type { TabKey } from "@/components/TabHeader/types"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar"
import { useOpenTab } from "@/hooks/useOpenTab"
import { cn } from "@/lib/utils"
import { useTabStore } from "@/stores/tabStore"
import { keyForPath } from "./tabKeyMap"

interface TreeMenuProps {
  data: MenuTreeNodePublic[]
  isError?: boolean
  isLoading?: boolean
  search: string
}

type MenuNodeItemProps = {
  activeTabKey?: TabKey
  forceOpen: boolean
  level: number
  node: MenuTreeNodePublic
  onSelectTab: (tabKey: TabKey) => void
}

const iconRegistry = Icons as Record<string, unknown>

// 判斷傳入值是否為 Lucide React icon 元件
function isLucideIcon(value: unknown): value is LucideIcon {
  return typeof value === "object" && value !== null && "displayName" in value
}

// 依後端 icon 名稱取得 Lucide React 元件，無效時使用 FileText
function getMenuIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return FileText

  const icon = iconRegistry[iconName]
  return isLucideIcon(icon) ? icon : FileText
}

// 取得節點子層，統一處理後端可能省略 children 的狀況
function getMenuChildren(node: MenuTreeNodePublic): MenuTreeNodePublic[] {
  return node.children ?? []
}

// 依 sortOrder 與 label 排序，避免前端渲染順序受資料輸入順序影響
function sortMenuTree(nodes: MenuTreeNodePublic[]): MenuTreeNodePublic[] {
  return [...nodes]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((node) => ({
      ...node,
      children: sortMenuTree(getMenuChildren(node)),
    }))
}

// 判斷節點是否符合搜尋條件
function matchMenuNode(node: MenuTreeNodePublic, query: string): boolean {
  return [node.label, node.key, node.path ?? ""].some((value) =>
    value.toLowerCase().includes(query),
  )
}

// 過濾選單樹，保留符合條件的父子路徑
function filterSortedMenuTree(
  nodes: MenuTreeNodePublic[],
  query: string,
): MenuTreeNodePublic[] {
  if (!query) return nodes

  return nodes
    .map((node): MenuTreeNodePublic | null => {
      const matchedChildren = filterSortedMenuTree(getMenuChildren(node), query)

      if (matchMenuNode(node, query) || matchedChildren.length > 0) {
        return {
          ...node,
          children: matchedChildren,
        }
      }

      return null
    })
    .filter((node): node is MenuTreeNodePublic => node !== null)
}

// 顯示選單載入中的骨架畫面
function TreeMenuLoading() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {Array.from({ length: 8 }).map((_, index) => (
            <SidebarMenuSkeleton key={index} showIcon />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// 顯示選單空狀態或 API 失敗時的安全畫面
function TreeMenuEmpty({ message }: { message: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <p className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {message}
        </p>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// 渲染單一後端選單節點，支援任意層級遞迴
function MenuNodeItem({
  activeTabKey,
  forceOpen,
  level,
  node,
  onSelectTab,
}: MenuNodeItemProps) {
  const [open, setOpen] = useState(forceOpen)
  const children = getMenuChildren(node)
  const hasChildren = children.length > 0
  const tabKey = keyForPath(node.path ?? undefined)
  const isClickable = !hasChildren && tabKey !== undefined
  const isDisabled = !hasChildren && !isClickable
  const Icon = getMenuIcon(node.icon)

  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
    }
  }, [forceOpen])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        aria-expanded={hasChildren ? open : undefined}
        data-state={hasChildren && open ? "open" : "closed"}
        disabled={isDisabled}
        isActive={tabKey !== undefined && tabKey === activeTabKey}
        onClick={() => {
          if (hasChildren) {
            setOpen((value) => !value)
            return
          }

          if (tabKey) {
            onSelectTab(tabKey)
          }
        }}
        size={level === 0 ? "default" : "sm"}
        tooltip={level === 0 ? node.label : undefined}
        className={cn(
          "gap-1.5",
          level > 0 && "text-xs",
          isDisabled && "cursor-default opacity-70",
        )}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150",
              level === 0 && "group-data-[collapsible=icon]:hidden",
              open && "rotate-90",
            )}
          />
        )}
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn("flex-1 truncate", level === 0 && "font-medium")}>
          {node.label}
        </span>
      </SidebarMenuButton>
      {hasChildren && open && (
        <SidebarMenuSub>
          <SidebarMenu>
            {children.map((child) => (
              <MenuNodeItem
                activeTabKey={activeTabKey}
                forceOpen={forceOpen}
                key={child.id}
                level={level + 1}
                node={child}
                onSelectTab={onSelectTab}
              />
            ))}
          </SidebarMenu>
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

// 樹狀選單根元件，資料來源為後端 MenuTreeNodePublic
export function TreeMenu({
  data,
  isError = false,
  isLoading = false,
  search,
}: TreeMenuProps) {
  const openTab = useOpenTab()
  const { isMobile, setOpenMobile } = useSidebar()
  const tabs = useTabStore((state) => state.tabs)
  const activeId = useTabStore((state) => state.activeId)
  const activeTabKey = tabs.find((tab) => tab.id === activeId)?.key
  const normalizedSearch = search.trim().toLowerCase()
  const isSearching = normalizedSearch.length > 0
  const filtered = useMemo(() => {
    const sorted = sortMenuTree(data)
    return filterSortedMenuTree(sorted, normalizedSearch)
  }, [data, normalizedSearch])

  if (isLoading) {
    return <TreeMenuLoading />
  }

  if (isError) {
    return <TreeMenuEmpty message="選單暫時無法載入" />
  }

  if (filtered.length === 0) {
    return <TreeMenuEmpty message="沒有可用選單" />
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {filtered.map((node) => (
            <MenuNodeItem
              activeTabKey={activeTabKey}
              forceOpen={isSearching}
              key={node.id}
              level={0}
              node={node}
              onSelectTab={(tabKey) => {
                openTab(tabKey)
                if (isMobile) {
                  setOpenMobile(false)
                }
              }}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
