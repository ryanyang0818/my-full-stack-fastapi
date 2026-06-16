import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"

import { AppFooter } from "@/components/Footer/AppFooter"
import { AppMenuBar } from "@/components/Header/AppMenuBar"
import {
  HeaderVisibilityProvider,
  useHeaderVisibility,
} from "@/components/Header/header-visibility"
import { UserHeader } from "@/components/Header/UserHeader"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import { SidebarControllerBridge } from "@/components/Sidebar/SidebarControllerBridge"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"
import {
  type DodoMainContentController,
  registerDodoControllerSection,
} from "@/lib/dodo-controller"

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

// 註冊登入後中央內容區的 Console 查詢介面
function MainContentController({ children }: { children: ReactNode }) {
  const mainContentRef = useRef<HTMLElement | null>(null)

  // 取得中央內容區對外狀態
  const getState = () =>
    ({
      name: "mainContent",
      mounted: Boolean(mainContentRef.current),
    }) as const

  // 取得中央內容區 DOM element
  const getElement = () => mainContentRef.current

  useEffect(() => {
    const controller: DodoMainContentController = {
      name: "mainContent",
      getState,
      getElement,
    }

    return registerDodoControllerSection("mainContent", controller)
  }, [])

  return (
    <main
      ref={mainContentRef}
      data-dodo-section="mainContent"
      className="flex-1 p-6 md:p-8"
    >
      {children}
    </main>
  )
}

// 依 Header 顯示狀態計算版面保留高度
function AuthenticatedLayout() {
  const { appMenuVisible, userHeaderVisible } = useHeaderVisibility()
  const [footerLayoutVisible, setFooterLayoutVisible] = useState(false)
  const appMenuLayoutHeight = appMenuVisible
    ? "var(--app-menu-bar-height)"
    : "0rem"
  const userHeaderLayoutHeight = userHeaderVisible
    ? "var(--user-header-height)"
    : "0rem"
  const footerLayoutHeight = footerLayoutVisible
    ? "var(--app-footer-height)"
    : "0rem"

  return (
    <SidebarProvider
      style={
        {
          "--app-menu-bar-height": "2rem",
          "--user-header-height": "3rem",
          "--app-footer-height": "1.75rem",
          "--app-menu-layout-height": appMenuLayoutHeight,
          "--user-header-layout-height": userHeaderLayoutHeight,
          "--app-footer-layout-height": footerLayoutHeight,
        } as CSSProperties
      }
      className="pt-[var(--user-header-layout-height)] md:pt-[calc(var(--app-menu-layout-height)+var(--user-header-layout-height))]"
    >
      <header className="fixed inset-x-0 top-0 z-20 bg-background">
        <AppMenuBar />
        <UserHeader />
      </header>
      <SidebarControllerBridge />
      <AppSidebar />
      <SidebarInset className="pb-[var(--app-footer-layout-height)]">
        <MainContentController>
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </MainContentController>
      </SidebarInset>
      <AppFooter onLayoutVisibilityChange={setFooterLayoutVisible} />
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
