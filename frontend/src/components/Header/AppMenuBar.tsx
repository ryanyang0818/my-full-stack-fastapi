import { useEffect, useRef, useState } from "react"

import { useHeaderVisibility } from "./header-visibility"

const menuItems = ["檔案", "編輯", "檢視", "工具", "視窗", "說明"]
const revealDelayMs = 300
const hideDelayMs = 600

// 顯示桌面程式風格的全域功能選單列
export function AppMenuBar() {
  const { appMenuVisible } = useHeaderVisibility()
  const [temporarilyVisible, setTemporarilyVisible] = useState(false)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 取消尚未執行的延遲顯示
  const cancelReveal = () => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
  }

  // 取消尚未執行的延遲隱藏
  const cancelHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  // 由畫面頂端感應區暫時喚回功能列
  const revealTemporarily = () => {
    cancelHide()
    cancelReveal()
    revealTimerRef.current = setTimeout(() => {
      setTemporarilyVisible(true)
      revealTimerRef.current = null
    }, revealDelayMs)
  }

  // 滑鼠離開後延遲收起功能列
  const scheduleHide = () => {
    cancelReveal()
    cancelHide()
    hideTimerRef.current = setTimeout(() => {
      setTemporarilyVisible(false)
      hideTimerRef.current = null
    }, hideDelayMs)
  }

  useEffect(() => {
    if (appMenuVisible) {
      cancelReveal()
      setTemporarilyVisible(false)
    }

    return () => {
      cancelReveal()
      cancelHide()
    }
  }, [appMenuVisible])

  const menuContent = (
    <nav aria-label="應用程式功能選單">
      <ul className="flex items-center gap-6">
        {menuItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </nav>
  )

  if (!appMenuVisible) {
    return (
      <>
        <div
          className="fixed inset-x-0 top-0 z-30 hidden h-1 md:block"
          onMouseEnter={revealTemporarily}
          onMouseLeave={cancelReveal}
          aria-hidden="true"
        />
        {temporarilyVisible && (
          <div
            data-dodo-section="appHeader"
            className="fixed inset-x-0 top-0 z-40 hidden h-[var(--app-menu-bar-height)] items-center border-b bg-muted px-4 text-xs text-foreground shadow-sm motion-safe:animate-in motion-safe:slide-in-from-top md:flex"
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            {menuContent}
          </div>
        )}
      </>
    )
  }

  return (
    <div
      data-dodo-section="appHeader"
      className="hidden h-[var(--app-menu-bar-height)] items-center border-b bg-muted px-4 text-xs text-foreground md:flex"
    >
      {menuContent}
    </div>
  )
}
