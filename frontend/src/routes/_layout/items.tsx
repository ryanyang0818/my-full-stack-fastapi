import { createFileRoute, redirect } from "@tanstack/react-router"

// /items 已轉為狀態驅動頁籤：保留路由檔僅作向後相容，一律導回首頁工作區
export const Route = createFileRoute("/_layout/items")({
  beforeLoad: () => {
    throw redirect({ to: "/" })
  },
})
