import { useEffect, useRef, useState } from "react"

import useAuth from "@/hooks/useAuth"
import {
  type DodoFooterController,
  registerDodoControllerSection,
} from "@/lib/dodo-controller"

const footerStatus = {
  company: "DoDo 台北總公司",
  connectionStatus: "已連線",
  database: "PROD-TPE-01",
  fiscalYear: 2026,
  language: "繁體中文",
} as const

// 格式化 ERP footer 顯示時間
function formatFooterTime(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 顯示登入後 ERP 風格底部狀態列
export function AppFooter() {
  const footerRef = useRef<HTMLElement | null>(null)
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(() =>
    formatFooterTime(new Date()),
  )
  const userName = user?.full_name || user?.email || "User"

  // 每秒更新 footer 顯示時間
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatFooterTime(new Date()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  // 取得 footer 對外狀態
  const getState = () =>
    ({
      name: "footer",
      mounted: Boolean(footerRef.current),
      ...footerStatus,
      userName,
      currentTime,
    }) as const

  // 取得 footer DOM element
  const getElement = () => footerRef.current

  useEffect(() => {
    const controller: DodoFooterController = {
      name: "footer",
      getState,
      getElement,
    }

    return registerDodoControllerSection("footer", controller)
  })

  return (
    <footer
      ref={footerRef}
      data-dodo-section="footer"
      className="fixed inset-x-0 bottom-0 z-30 flex h-[var(--app-footer-height)] items-center justify-between gap-4 overflow-hidden border-t border-slate-300 bg-slate-100 px-3 text-[11px] text-slate-800"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-emerald-700">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-emerald-600"
          />
          <span>{footerStatus.connectionStatus}</span>
        </span>
        <span className="shrink-0">DB: {footerStatus.database}</span>
        <span className="shrink-0">公司: {footerStatus.company}</span>
        <span className="shrink-0">會計年度: {footerStatus.fiscalYear}</span>
      </div>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3">
        <span className="shrink-0">{footerStatus.language}</span>
        <span className="max-w-28 truncate">{userName}</span>
        <time className="shrink-0 font-mono text-[10px]" dateTime={currentTime}>
          {currentTime}
        </time>
      </div>
    </footer>
  )
}
