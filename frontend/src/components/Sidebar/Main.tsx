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
