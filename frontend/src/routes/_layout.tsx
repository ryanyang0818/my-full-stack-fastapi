import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import type { CSSProperties } from "react"

import { Footer } from "@/components/Common/Footer"
import { AppMenuBar } from "@/components/Header/AppMenuBar"
import {
  HeaderVisibilityProvider,
  useHeaderVisibility,
} from "@/components/Header/header-visibility"
import { UserHeader } from "@/components/Header/UserHeader"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

// 依 Header 顯示狀態計算版面保留高度
function AuthenticatedLayout() {
  const { appMenuVisible, userHeaderVisible } = useHeaderVisibility()
  const appMenuLayoutHeight = appMenuVisible
    ? "var(--app-menu-bar-height)"
    : "0rem"
  const userHeaderLayoutHeight = userHeaderVisible
    ? "var(--user-header-height)"
    : "0rem"

  return (
    <SidebarProvider
      style={
        {
          "--app-menu-bar-height": "2rem",
          "--user-header-height": "3rem",
          "--app-menu-layout-height": appMenuLayoutHeight,
          "--user-header-layout-height": userHeaderLayoutHeight,
        } as CSSProperties
      }
      className="pt-[var(--user-header-layout-height)] md:pt-[calc(var(--app-menu-layout-height)+var(--user-header-layout-height))]"
    >
      <header className="fixed inset-x-0 top-0 z-20 bg-background">
        <AppMenuBar />
        <UserHeader />
      </header>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}

// 建立登入後頁面共用的頂欄、側邊欄與內容版型
function Layout() {
  return (
    <HeaderVisibilityProvider>
      <AuthenticatedLayout />
    </HeaderVisibilityProvider>
  )
}

export default Layout
