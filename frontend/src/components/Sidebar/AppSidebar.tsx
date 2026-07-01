import { useQuery } from "@tanstack/react-query"
import { Briefcase, Home, Rows2, Table2, Users } from "lucide-react"
import { useState } from "react"

import { MenusService, type MenuTreeNodePublic } from "@/client"
import { SidebarAppearance } from "@/components/Common/Appearance"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { SidebarSearch } from "./SidebarSearch"
import { TreeMenu } from "./TreeMenu"
import { User } from "./User"

const baseItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Briefcase, title: "Items", path: "/items" },
  { icon: Table2, title: "ItemsCRUD", path: "/items-crud" },
  { icon: Rows2, title: "Master Detail", path: "/master-detail" },
]

// 組合登入後頁面的固定入口、後端選單、外觀設定與使用者資訊
export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const items = currentUser?.is_superuser
    ? [...baseItems, { icon: Users, title: "Admin", path: "/admin" }]
    : baseItems
  const {
    data: menuTree = [],
    isError: isMenuError,
    isLoading: isMenuLoading,
  } = useQuery<MenuTreeNodePublic[], Error>({
    queryKey: ["sidebarMenuTree"],
    queryFn: () => MenusService.readMyMenuTree(),
    enabled: isLoggedIn(),
  })

  return (
    <Sidebar
      collapsible="icon"
      data-dodo-section="sidebar"
      className="top-[var(--user-header-layout-height)] h-[calc(100svh-var(--user-header-layout-height)-var(--app-footer-layout-height))] md:top-[calc(var(--app-menu-layout-height)+var(--user-header-layout-height))] md:h-[calc(100svh-var(--app-menu-layout-height)-var(--user-header-layout-height)-var(--app-footer-layout-height))]"
    >
      <SidebarContent>
        <Main items={items} />
        <SidebarSearch value={search} onChange={setSearch} />
        <TreeMenu
          data={menuTree}
          isError={isMenuError}
          isLoading={isMenuLoading}
          search={search}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
