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
  X,
} from "lucide-react"
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
  CATEGORIES,
  CURRENCY_OPTIONS,
  HANDLERS,
  type ItemRow,
  type ItemStatus,
  MOCK_ITEMS,
  money,
  PRIORITY_OPTIONS,
  STATUS_CONFIG,
  STATUS_ORDER,
  TERMS,
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

// 面板預設/最小寬度（px）；最大寬度於拖拉時依容器寬度即時換算（容器的一半）
const PANEL_DEFAULT_WIDTH = 448
const PANEL_MIN_WIDTH = 360

// ItemsCRUD 主元件：純前端密集表格（假資料，列表操作會動、表單僅示範）
export function ItemsCRUD() {
  // 元件根容器：自訂面板用 absolute 定位侷限在此範圍內，不外溢到側邊欄/Header
  const hostRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  )
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH)
  // 面板的「視覺開啟」狀態，跟資料分開，讓關閉時能先播放收合動畫再卸載內容
  const [panelOpen, setPanelOpen] = useState(false)

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
  // 新增/編輯：自訂 Slide Panel 狀態；row 為 undefined 代表新增
  const [panel, setPanel] = useState<{
    mode: "add" | "edit"
    row?: ItemRow
  } | null>(null)
  // 刪除：維持原本 Dialog 確認框；row 為 undefined 代表刪除目前已勾選的多筆
  const [deleteTarget, setDeleteTarget] = useState<{ row?: ItemRow } | null>(
    null,
  )

  // panel 開啟時：下一幀觸發滑入動畫；panel 關閉(null)時：立即收合（無需動畫，因內容已卸載）
  useEffect(() => {
    if (!panel) {
      setPanelOpen(false)
      return
    }
    const id = requestAnimationFrame(() => setPanelOpen(true))
    return () => cancelAnimationFrame(id)
  }, [panel])

  // 關閉面板：先播放滑出動畫，動畫結束後才卸載內容（與 CSS transition-duration 一致）
  const closePanel = useCallback(() => {
    setPanelOpen(false)
    window.setTimeout(() => setPanel(null), 200)
  }, [])

  // Esc 鍵關閉面板（拿掉遮罩後，這是唯一的鍵盤關閉手段）
  useEffect(() => {
    if (!panel) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [panel, closePanel])

  // 拖拉把手：依水平位移即時調整面板寬度，上限鎖在容器寬度的一半
  const handleResizeStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = { startX: e.clientX, startWidth: panelWidth }
  }
  const handleResizeMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current
    if (!drag) return
    const containerWidth = hostRef.current?.clientWidth ?? Infinity
    const maxWidth = Math.max(PANEL_MIN_WIDTH, containerWidth / 2)
    const next = drag.startWidth + (drag.startX - e.clientX)
    setPanelWidth(Math.min(maxWidth, Math.max(PANEL_MIN_WIDTH, next)))
  }
  const handleResizeEnd = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragStateRef.current = null
  }

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
    <div ref={hostRef} className="relative flex h-full flex-col gap-3 text-sm">
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
            onClick={() => setPanel({ mode: "add" })}
          >
            <Plus className="size-4" />
            新增
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={selected.size !== 1}
            onClick={() => setPanel({ mode: "edit", row: singleSelectedRow() })}
          >
            <Pencil className="size-4" />
            編輯
          </Button>
          {selected.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="h-8"
              onClick={() => setDeleteTarget({})}
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
                              onClick={() => setPanel({ mode: "edit", row: r })}
                            >
                              <Pencil className="size-4" />
                              編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget({ row: r })}
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

      {/* 刪除確認（示範用，不寫入資料） */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>刪除確認</DialogTitle>
            <DialogDescription>
              {deleteTarget?.row
                ? `將刪除「${deleteTarget.row.code}」。`
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
                setDeleteTarget(null)
              }}
            >
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增 / 編輯：右側 Slide Panel（示範用，不寫入資料、不驗證） */}
      {/* 新增/編輯自訂 Slide Panel：absolute 侷限在本元件根容器內，無遮罩、可拖拉寬度 */}
      {panel !== null && (
        <div
          className="absolute inset-y-0 right-0 z-20 flex border-l bg-background shadow-xl transition-transform duration-200 ease-out"
          style={{
            width: panelWidth,
            transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          }}
        >
          {/* 拖拉把手：與左側邊框線重疊的熱區，互動範圍與視覺邊界完全對齊（見 handleResizeMove） */}
          <button
            type="button"
            aria-label="拖曳調整面板寬度"
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            className="w-2 shrink-0 cursor-col-resize touch-none border-0 bg-transparent p-0 hover:bg-primary/20 active:bg-primary/30"
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4 border-b px-4 py-4">
              <div>
                <h2 className="text-base font-semibold">
                  {panel.mode === "edit" ? "編輯項目" : "新增項目"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  此為示範表單，儲存不會寫入資料。
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-1 size-7 shrink-0"
                onClick={closePanel}
              >
                <X className="size-4" />
                <span className="sr-only">關閉</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-5">
                <FormSection title="基本資料">
                  <Field label="編號" defaultValue={panel.row?.code} disabled />
                  <Field label="名稱" defaultValue={panel.row?.name} />
                  <SelectField
                    label="分類"
                    defaultValue={panel.row?.category}
                    options={CATEGORIES.map((v) => ({ value: v, label: v }))}
                  />
                  <SelectField
                    label="負責人"
                    defaultValue={panel.row?.handler}
                    options={HANDLERS.map((v) => ({ value: v, label: v }))}
                  />
                  <SelectField
                    label="優先度"
                    defaultValue={panel.row?.priority ?? "normal"}
                    options={PRIORITY_OPTIONS}
                  />
                  <SelectField
                    label="狀態"
                    defaultValue={panel.row?.status ?? "draft"}
                    options={STATUS_ORDER.map((s) => ({
                      value: s,
                      label: STATUS_CONFIG[s].label,
                    }))}
                  />
                </FormSection>

                <FormSection title="日期與聯絡">
                  <DateField
                    label="建立日期"
                    defaultValue={panel.row?.createdDate.replace(/\//g, "-")}
                  />
                  <DateField
                    label="預計到貨"
                    defaultValue={panel.row?.dueDate.replace(/\//g, "-")}
                  />
                  <DateField
                    label="預計出貨日"
                    defaultValue={panel.row?.expectedShipDate}
                  />
                  <Field
                    label="聯絡電話"
                    defaultValue={panel.row?.contactPhone}
                  />
                </FormSection>

                <FormSection title="金額與條件">
                  <Field
                    label="數量"
                    type="number"
                    defaultValue={panel.row ? String(panel.row.qty) : ""}
                  />
                  <SelectField
                    label="幣別"
                    defaultValue={panel.row?.currency ?? "TWD"}
                    options={CURRENCY_OPTIONS}
                  />
                  <Field
                    label="金額"
                    type="number"
                    defaultValue={panel.row ? String(panel.row.amount) : ""}
                  />
                  <SelectField
                    label="付款條件"
                    defaultValue={panel.row?.terms}
                    options={TERMS.map((v) => ({ value: v, label: v }))}
                  />
                  <Field
                    label="稅率 (%)"
                    type="number"
                    defaultValue={panel.row ? String(panel.row.taxRate) : ""}
                  />
                  <Field
                    label="折扣 (%)"
                    type="number"
                    defaultValue={panel.row ? String(panel.row.discount) : ""}
                  />
                </FormSection>

                <FormSection title="其他">
                  <TextareaField
                    label="交貨地址"
                    defaultValue={panel.row?.deliveryAddress}
                    span
                  />
                  <TextareaField
                    label="備註"
                    defaultValue={panel.row?.remark}
                    span
                  />
                </FormSection>
              </div>
            </div>

            {/* 功能區塊：底色 + 上邊框明確區隔，之後新增取消以外的操作放這排 */}
            <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-4 py-3">
              <Button variant="outline" onClick={closePanel}>
                取消
              </Button>
              <Button
                onClick={() => {
                  demoToast("儲存")
                  closePanel()
                }}
              >
                儲存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 表單分組區塊：標題 + 雙欄 grid，組與組間用上邊框分隔
function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

// 文字／數字欄位：label + input
function Field({
  label,
  defaultValue,
  type = "text",
  disabled,
}: {
  label: string
  defaultValue?: string
  type?: "text" | "number"
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-8"
      />
    </div>
  )
}

// 下拉選單欄位：label + Select（未受控，僅示範預填值）
function SelectField({
  label,
  defaultValue,
  options,
}: {
  label: string
  defaultValue?: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select defaultValue={defaultValue}>
        <SelectTrigger size="sm" className="h-8 w-full">
          <SelectValue placeholder="請選擇" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// 日期欄位：label + 原生 date input（瀏覽器原生日期選擇器，不需額外套件）
function DateField({
  label,
  defaultValue,
}: {
  label: string
  defaultValue?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input type="date" defaultValue={defaultValue} className="h-8" />
    </div>
  )
}

// 多行文字欄位：label + textarea（沿用 Input 同款邊框樣式）；span 時跨兩欄
function TextareaField({
  label,
  defaultValue,
  span,
}: {
  label: string
  defaultValue?: string
  span?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1", span && "col-span-2")}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        defaultValue={defaultValue}
        rows={2}
        className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive w-full min-w-0 resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
