import {
  Briefcase,
  Home,
  ListTree,
  type LucideIcon,
  Table2,
  Users,
} from "lucide-react"
import type { ComponentType } from "react"

import { AdminView } from "@/components/Admin/AdminView"
import { DashboardView } from "@/components/Dashboard/DashboardView"
import { ItemsView } from "@/components/Items/ItemsView"
import { ItemsCRUD } from "@/components/ItemsCRUD/ItemsCRUD"
import { MenusView } from "@/components/Menus/MenusView"
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
  "items-crud": {
    title: "ItemsCRUD",
    icon: Table2,
    component: ItemsCRUD,
  },
  admin: {
    title: "Admin",
    icon: Users,
    component: AdminView,
  },
  menus: {
    title: "Menus",
    icon: ListTree,
    component: MenusView,
  },
}

// 以 key 取得頁籤定義；查無對應時回傳 undefined（呼叫端需自行防呆）
export function getTabDefinition(key: TabKey): TabDefinition | undefined {
  return tabRegistry[key]
}
