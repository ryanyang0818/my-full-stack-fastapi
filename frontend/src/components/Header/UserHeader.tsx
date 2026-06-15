import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"
import { useHeaderVisibility } from "./header-visibility"

// 顯示平台名稱、側邊欄開關與目前登入使用者
export function UserHeader() {
  const { user } = useAuth()
  const { userHeaderVisible } = useHeaderVisibility()
  const displayName = user?.full_name || user?.email || "User"

  if (!userHeaderVisible) return null

  return (
    <div className="flex h-[var(--user-header-height)] items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="shrink-0 text-muted-foreground" />
        <span className="truncate font-semibold">管理平台</span>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate text-sm font-medium">
          {displayName}
        </span>
      </div>
    </div>
  )
}
