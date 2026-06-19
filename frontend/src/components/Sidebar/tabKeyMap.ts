import type { TabKey } from "@/components/TabHeader/types"

// 側邊欄 path → TabKey 對應（主選單與樹狀葉節點共用）
export const PATH_TO_TAB_KEY: Record<string, TabKey> = {
  "/": "dashboard",
  "/items": "items",
}

// 由 path 取得對應 TabKey，無 path 或無對應時回傳 undefined
export function keyForPath(path?: string): TabKey | undefined {
  if (!path) return undefined
  return PATH_TO_TAB_KEY[path]
}
