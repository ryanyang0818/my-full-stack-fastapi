// ItemsCRUD 假資料層：型別、狀態色彩設定，以及約 120 筆 deterministic 假資料
// 全部以 index 推導、不使用 Math.random，確保每次 render 結果穩定不跳動

// 單筆資料可能的狀態
export type ItemStatus =
  | "draft"
  | "pending"
  | "approved"
  | "shipped"
  | "done"
  | "returned"

// 表格單列資料型別
export type ItemRow = {
  id: string
  code: string
  name: string
  category: string
  handler: string
  createdDate: string
  dueDate: string
  qty: number
  amount: number
  terms: string
  status: ItemStatus
}

// 狀態顯示設定：標籤文字 + 圓點底色 + 文字色（仿截圖彩色狀態）
export const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; dot: string; text: string }
> = {
  draft: { label: "草稿", dot: "bg-slate-400", text: "text-slate-600" },
  pending: { label: "待簽核", dot: "bg-amber-500", text: "text-amber-700" },
  approved: { label: "已核准", dot: "bg-blue-500", text: "text-blue-700" },
  shipped: { label: "已出貨", dot: "bg-indigo-500", text: "text-indigo-700" },
  done: { label: "已完成", dot: "bg-emerald-500", text: "text-emerald-700" },
  returned: { label: "已退回", dot: "bg-rose-500", text: "text-rose-700" },
}

// 狀態下拉/顯示順序
export const STATUS_ORDER: ItemStatus[] = [
  "draft",
  "pending",
  "approved",
  "shipped",
  "done",
  "returned",
]

// 各欄位的取值池
const CATEGORIES = ["原物料", "半成品", "成品", "包材", "耗材", "設備"]
const HANDLERS = ["李小華", "王志明", "陳怡君", "張凱翔", "林佩蓉"]
const NAMES = [
  "主機板",
  "記憶體模組",
  "電源供應器",
  "散熱風扇",
  "SSD 固態硬碟",
  "機殼",
  "顯示卡",
  "網路卡",
  "連接線材",
  "螢幕面板",
]
const VARIANTS = ["A1", "B2", "Pro", "Plus", "Lite", "X"]
const TERMS = ["月結 30 天", "月結 45 天", "月結 60 天", "貨到付款"]

// 以固定基準日往前推算日期字串，避免依賴當下時間造成資料漂移
const BASE_DATE = new Date(2026, 4, 18) // 2026/05/18

// 將基準日往前 offset 天，格式化為 YYYY/MM/DD
function fmtDate(offsetDays: number): string {
  const d = new Date(BASE_DATE)
  d.setDate(d.getDate() - offsetDays)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}/${mm}/${dd}`
}

// 依 index 產生一列穩定假資料
function makeRow(i: number): ItemRow {
  const status = STATUS_ORDER[i % STATUS_ORDER.length]
  const qty = ((i * 7) % 90) + 10
  const unit = (((i * 13) % 50) + 5) * 100
  const createdOffset = i % 30
  return {
    id: `row-${i}`,
    code: `ITM-2026-${String(1200 - i).padStart(4, "0")}`,
    name: `${NAMES[i % NAMES.length]} ${VARIANTS[i % VARIANTS.length]}`,
    category: CATEGORIES[i % CATEGORIES.length],
    handler: HANDLERS[i % HANDLERS.length],
    createdDate: fmtDate(createdOffset),
    dueDate: fmtDate(createdOffset - 7),
    qty,
    amount: qty * unit,
    terms: TERMS[i % TERMS.length],
    status,
  }
}

// 完整假資料集（約 120 筆）
export const MOCK_ITEMS: ItemRow[] = Array.from({ length: 120 }, (_, i) =>
  makeRow(i),
)

// 把基準日字串化，供日期區間 chips 計算「今日」用
export const TODAY_STR = fmtDate(0)

// 千分位金額格式
export const money = (n: number): string =>
  new Intl.NumberFormat("en-US").format(n)
