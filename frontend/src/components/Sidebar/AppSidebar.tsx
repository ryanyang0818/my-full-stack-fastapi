import { useState } from "react"
import { Briefcase, Home, LayoutDashboard, Users } from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { SidebarSearch } from "./SidebarSearch"
import { TreeMenu } from "./TreeMenu"
import { TREE_DATA } from "./tree-data"
import { User } from "./User"

const baseItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Briefcase, title: "Items", path: "/items" },
]

// 組合登入後頁面的主選單、樹狀選單、外觀設定與使用者資訊
export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")

  const items = currentUser?.is_superuser
    ? [
        ...baseItems,
        { icon: Users, title: "Admin", path: "/admin" },
        { icon: LayoutDashboard, title: "TestTab", path: "/test-tab" },
      ]
    : [...baseItems, { icon: LayoutDashboard, title: "TestTab", path: "/test-tab" }]

  return (
    <Sidebar
      collapsible="icon"
      data-dodo-section="sidebar"
      className="top-[var(--user-header-layout-height)] h-[calc(100svh-var(--user-header-layout-height)-var(--app-footer-layout-height))] md:top-[calc(var(--app-menu-layout-height)+var(--user-header-layout-height))] md:h-[calc(100svh-var(--app-menu-layout-height)-var(--user-header-layout-height)-var(--app-footer-layout-height))]"
    >
      <SidebarContent>
        <Main items={items} />
        <SidebarSearch value={search} onChange={setSearch} />
        <TreeMenu data={TREE_DATA} search={search} />
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
