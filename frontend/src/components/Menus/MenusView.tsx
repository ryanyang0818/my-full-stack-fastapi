import { useSuspenseQuery } from "@tanstack/react-query"
import { Suspense, useMemo } from "react"

import { MenusService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddMenu from "@/components/Menus/AddMenu"
import { getMenuColumns } from "@/components/Menus/columns"
import PendingItems from "@/components/Pending/PendingItems"

// 取得 Menu 管理列表查詢設定
function getMenusQueryOptions() {
  return {
    queryFn: () => MenusService.readMenus({ skip: 0, limit: 100 }),
    queryKey: ["menus"],
  }
}

// 顯示 Menu 管理內容
function MenusContent() {
  const { data: menus } = useSuspenseQuery(getMenusQueryOptions())
  const columns = useMemo(() => getMenuColumns(menus.data), [menus.data])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menus</h1>
          <p className="text-muted-foreground">
            Manage navigation menus and visibility settings
          </p>
        </div>
        <AddMenu menus={menus.data} />
      </div>

      <DataTable columns={columns} data={menus.data} />
    </div>
  )
}

// 顯示 Menu 管理 tab 內容
export function MenusView() {
  return (
    <Suspense fallback={<PendingItems />}>
      <MenusContent />
    </Suspense>
  )
}
