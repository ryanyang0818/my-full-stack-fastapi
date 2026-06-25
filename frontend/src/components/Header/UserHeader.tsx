import { Bell, Mail, Search, Settings } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"
import dodoIcon from "/assets/images/dodo-icon-light.svg"
import { useHeaderVisibility } from "./header-visibility"

const departmentTabs = ["採購", "銷售", "庫存", "財務", "人資", "製造", "報表"]

// 顯示 DoDo ERP 的品牌列、部門分頁、搜尋與目前登入使用者
export function UserHeader() {
  const { user } = useAuth()
  const { userHeaderVisible } = useHeaderVisibility()
  const displayName = user?.full_name || user?.email || "User"
  const roleLabel = user?.is_superuser ? "Superuser" : "User"

  if (!userHeaderVisible) return null

  return (
    <div
      data-dodo-section="userHeader"
      className="flex h-[var(--user-header-height)] min-w-0 items-center gap-4 overflow-hidden border-b border-slate-200 bg-white px-3 text-[13px] text-slate-800"
    >
      <SidebarTrigger className="size-8 shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-950" />
      <div className="flex h-full shrink-0 items-center gap-2.5 border-r border-slate-200 pr-5">
        <img src={dodoIcon} alt="DoDo ERP" className="size-[30px] rounded" />
        <div className="min-w-0 leading-tight">
          <div className="font-semibold text-slate-950">DoDo ERP</div>
          <div className="font-mono text-[10px] text-slate-500">
            PROD · v4.2.1
          </div>
        </div>
      </div>

      <nav
        aria-label="部門切換"
        className="hidden h-full min-w-0 flex-1 items-stretch overflow-hidden md:flex"
      >
        {departmentTabs.map((tab) => {
          const active = tab === "採購"

          return (
            <button
              type="button"
              key={tab}
              className={`relative inline-flex h-full shrink-0 items-center px-2 font-medium transition-colors hover:text-slate-950 lg:px-3 ${
                active ? "text-blue-600" : "text-slate-600"
              }`}
            >
              {tab}
              {active && (
                <span className="absolute inset-x-3 bottom-[-1px] h-0.5 rounded-t bg-blue-600" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
        <label className="hidden h-7 w-80 items-center gap-1.5 rounded border border-slate-200 bg-slate-100 px-2 text-slate-500 transition-colors focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/15 xl:flex">
          <Search className="size-3.5" />
          <input
            type="search"
            aria-label="全域搜尋"
            placeholder="搜尋訂單、客戶、料號..."
            className="h-full min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-500"
          />
          <span className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-[10px] text-slate-500">
            Ctrl+K
          </span>
        </label>

        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            aria-label="通知"
            title="3 則新通知"
            className="relative grid size-8 place-items-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <Bell className="size-3.5" />
            <span className="absolute right-0.5 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white">
              3
            </span>
          </button>
          <button
            type="button"
            aria-label="訊息"
            title="5 則未讀訊息"
            className="relative grid size-8 place-items-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <Mail className="size-3.5" />
            <span className="absolute right-0.5 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white">
              5
            </span>
          </button>
          <button
            type="button"
            aria-label="設定"
            className="grid size-8 place-items-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <Settings className="size-3.5" />
          </button>
          <div className="mx-1 h-[22px] w-px bg-slate-200" />
        </div>

        <button
          type="button"
          aria-label="開啟使用者選單"
          className="flex min-w-0 items-center gap-2 rounded-md py-0.5 pl-0.5 pr-1.5 transition-colors hover:bg-slate-100"
        >
          <Avatar className="size-[26px]">
            <AvatarFallback className="bg-orange-400 text-xs font-semibold text-white">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 text-left leading-tight sm:block">
            <span className="block max-w-32 truncate text-xs font-semibold text-slate-950">
              {displayName}
            </span>
            <span className="block max-w-32 truncate text-[10px] text-slate-500">
              {roleLabel}
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
