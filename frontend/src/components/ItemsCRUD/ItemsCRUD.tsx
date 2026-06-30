import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Download,
  EllipsisVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { type ReactNode, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  type ItemRow,
  type ItemStatus,
  MOCK_ITEMS,
  money,
  STATUS_CONFIG,
  STATUS_ORDER,
  TODAY_STR,
} from "./mockData"

// 資料欄位定義（不含勾選與操作欄）；cell 未提供時直接取 row[key]
type Col = {
  key: keyof ItemRow
  label: string
  align?: "right"
  cell?: (r: ItemRow) => ReactNode
}

// 狀態欄：彩色圓點 + 文字
function StatusCell({ status }: { status: ItemStatus }) {
  const c = STATUS_CONFIG[status]
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-medium", c.text)}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}

const COLUMNS: Col[] = [
  {
    key: "code",
    label: "編號",
    cell: (r) => <span className="font-medium text-foreground">{r.code}</span>,
  },
  { key: "name", label: "名稱" },
  { key: "category", label: "分類" },
  { key: "handler", label: "負責人" },
  { key: "createdDate", label: "建立日期" },
  { key: "dueDate", label: "預計日期" },
  {
    key: "qty",
    label: "數量",
    align: "right",
    cell: (r) => <span className="tabular-nums">{r.qty}</span>,
  },
  {
    key: "amount",
    label: "金額 NT$",
    align: "right",
    cell: (r) => <span className="tabular-nums">{money(r.amount)}</span>,
  },
  { key: "terms", label: "付款條件" },
  {
    key: "status",
    label: "狀態",
    cell: (r) => <StatusCell status={r.status} />,
  },
]

// 日期區間 chips 設定
const DATE_CHIPS = [
  { key: "all", label: "全部" },
  { key: "today", label: "今日" },
  { key: "week", label: "本週" },
  { key: "month", label: "本月" },
] as const
type ChipKey = (typeof DATE_CHIPS)[number]["key"]

// 將 YYYY/MM/DD 轉為 Date 以利日期比較
function parseDate(s: string): Date {
  return new Date(s.replace(/\//g, "-"))
}
const TODAY = parseDate(TODAY_STR)

// 判斷某列是否落在指定日期區間
function inDateChip(r: ItemRow, chip: ChipKey): boolean {
  if (chip === "all") return true
  if (chip === "today") return r.createdDate === TODAY_STR
  if (chip === "month")
    return r.createdDate.slice(0, 7) === TODAY_STR.slice(0, 7)
  const diffDays =
    (TODAY.getTime() - parseDate(r.createdDate).getTime()) / 86400000
  return diffDays >= 0 && diffDays <= 6
}

// 取得排序用的可比較值：status 依序位、數值欄回傳 number、其餘回傳字串
function sortValue(r: ItemRow, key: keyof ItemRow): number | string {
  if (key === "status") return STATUS_ORDER.indexOf(r.status)
  if (key === "qty" || key === "amount") return r[key] as number
  return String(r[key])
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// ItemsCRUD 主元件：純前端密集表格（假資料，列表操作會動、表單僅示範）
export function ItemsCRUD() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all")
  const [chip, setChip] = useState<ChipKey>("all")
  const [sort, setSort] = useState<{
    key: keyof ItemRow
    dir: "asc" | "desc"
  } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [dialog, setDialog] = useState<{
    mode: "add" | "edit" | "delete"
    row?: ItemRow
  } | null>(null)

  // 改變任一篩選條件時回到第一頁
  const resetPage = () => setPage(0)

  // 各日期 chip 的筆數（顯示在 chip 上）
  const chipCounts = useMemo(() => {
    const map = {} as Record<ChipKey, number>
    for (const c of DATE_CHIPS)
      map[c.key] = MOCK_ITEMS.filter((r) => inDateChip(r, c.key)).length
    return map
  }, [])

  // 篩選 → 排序後的完整結果
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    const rows = MOCK_ITEMS.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (!inDateChip(r, chip)) return false
      if (!kw) return true
      return (
        r.code.toLowerCase().includes(kw) ||
        r.name.toLowerCase().includes(kw) ||
        r.handler.toLowerCase().includes(kw) ||
        r.category.toLowerCase().includes(kw)
      )
    })
    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1
      rows.sort((a, b) => {
        const va = sortValue(a, sort.key)
        const vb = sortValue(b, sort.key)
        if (va < vb) return -1 * dir
        if (va > vb) return 1 * dir
        return 0
      })
    }
    return rows
  }, [search, statusFilter, chip, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  )

  const pageIds = pageRows.map((r) => r.id)
  const pageAllSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const pageSomeSelected = pageIds.some((id) => selected.has(id))
  const headerChecked: boolean | "indeterminate" = pageAllSelected
    ? true
    : pageSomeSelected
      ? "indeterminate"
      : false

  // 點欄位標題：同欄切換升/降冪，換欄則重設為升冪
  const toggleSort = (key: keyof ItemRow) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    )
  }

  // 切換單列勾選
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 切換本頁全選：全選狀態 → 取消本頁，否則加入本頁
  const togglePageAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of pageIds) {
        if (pageAllSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  // 唯一選取列（供「編輯」按鈕使用）
  const singleSelectedRow = (): ItemRow | undefined => {
    if (selected.size !== 1) return undefined
    const id = [...selected][0]
    return MOCK_ITEMS.find((r) => r.id === id)
  }

  // 示範用提示：實際不寫入資料
  const demoToast = (msg: string) =>
    toast.info(`（示範）${msg}，未實際變更資料`)

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <h1 className="text-xl font-bold tracking-tight">ItemsCRUD</h1>
        <p className="text-xs text-muted-foreground">
          密集表格示範（假資料，列表操作可用、表單僅展示）
        </p>
      </div>

      {/* 工具列 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            className="h-8"
            onClick={() => setDialog({ mode: "add" })}
          >
            <Plus className="size-4" />
            新增
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={selected.size !== 1}
            onClick={() =>
              setDialog({ mode: "edit", row: singleSelectedRow() })
            }
          >
            <Pencil className="size-4" />
            編輯
          </Button>
          {selected.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="h-8"
              onClick={() => setDialog({ mode: "delete" })}
            >
              <Trash2 className="size-4" />
              刪除（{selected.size}）
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => demoToast("匯出")}
          >
            <Download className="size-4" />
            匯出
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 日期 chips */}
          <div className="flex items-center gap-1">
            {DATE_CHIPS.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => {
                  setChip(c.key)
                  resetPage()
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 h-8 text-xs transition-colors",
                  chip === c.key
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                {c.label}
                <span className="tabular-nums opacity-70">
                  {chipCounts[c.key]}
                </span>
              </button>
            ))}
          </div>

          {/* 狀態下拉 */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ItemStatus | "all")
              resetPage()
            }}
          >
            <SelectTrigger size="sm" className="h-8 w-[120px]">
              <SelectValue placeholder="全部狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 搜尋 */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              placeholder="搜尋編號 / 名稱 / 負責人…"
              className="h-8 w-[220px] pl-8"
            />
          </div>
        </div>
      </div>

      {/* 密集表格 */}
      <div className="rounded-md border">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
              <tr className="border-b">
                <th className="h-8 w-9 px-2 text-left">
                  <Checkbox
                    checked={headerChecked}
                    onCheckedChange={togglePageAll}
                    aria-label="全選本頁"
                  />
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "h-8 px-2 font-medium text-muted-foreground whitespace-nowrap select-none cursor-pointer hover:text-foreground",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        col.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {col.label}
                      {sort?.key === col.key &&
                        (sort.dir === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        ))}
                    </span>
                  </th>
                ))}
                <th className="h-8 w-9 px-2" />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 2}
                    className="h-24 text-center text-muted-foreground"
                  >
                    查無資料
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const isSel = selected.has(r.id)
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/40",
                        isSel && "bg-primary/5",
                      )}
                    >
                      <td className="h-8 px-2">
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleRow(r.id)}
                          aria-label={`選取 ${r.code}`}
                        />
                      </td>
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "h-8 px-2 whitespace-nowrap",
                            col.align === "right" ? "text-right" : "text-left",
                          )}
                        >
                          {col.cell ? col.cell(r) : String(r[col.key])}
                        </td>
                      ))}
                      <td className="h-8 px-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                            >
                              <EllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setDialog({ mode: "edit", row: r })
                              }
                            >
                              <Pencil className="size-4" />
                              編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                setDialog({ mode: "delete", row: r })
                              }
                            >
                              <Trash2 className="size-4" />
                              刪除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁列 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              共{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              筆
              {selected.size > 0 && (
                <span className="ml-1">· 已選 {selected.size}</span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <span>每頁</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v))
                  resetPage()
                }}
              >
                <SelectTrigger size="sm" className="h-7 w-[68px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span>
              第{" "}
              <span className="font-medium text-foreground">
                {currentPage + 1}
              </span>{" "}
              / {pageCount} 頁
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={currentPage === 0}
                onClick={() => setPage(0)}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(pageCount - 1)}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 新增 / 編輯 / 刪除 Dialog（示範用，不寫入資料） */}
      <Dialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {dialog?.mode === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle>刪除確認</DialogTitle>
                <DialogDescription>
                  {dialog.row
                    ? `將刪除「${dialog.row.code}」。`
                    : `將刪除已選取的項目。`}
                  此為示範，不會真的刪除資料。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    demoToast("刪除")
                    setDialog(null)
                  }}
                >
                  確認刪除
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog?.mode === "edit" ? "編輯項目" : "新增項目"}
                </DialogTitle>
                <DialogDescription>
                  此為示範表單，儲存不會寫入資料。
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                <Field label="編號" defaultValue={dialog?.row?.code} />
                <Field label="名稱" defaultValue={dialog?.row?.name} />
                <Field label="分類" defaultValue={dialog?.row?.category} />
                <Field label="負責人" defaultValue={dialog?.row?.handler} />
                <Field
                  label="數量"
                  defaultValue={dialog?.row ? String(dialog.row.qty) : ""}
                />
                <Field
                  label="金額"
                  defaultValue={dialog?.row ? String(dialog.row.amount) : ""}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button
                  onClick={() => {
                    demoToast("儲存")
                    setDialog(null)
                  }}
                >
                  儲存
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 示範表單欄位：label + 唯讀預填 input
function Field({
  label,
  defaultValue,
}: {
  label: string
  defaultValue?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input defaultValue={defaultValue} className="h-8" />
    </div>
  )
}
