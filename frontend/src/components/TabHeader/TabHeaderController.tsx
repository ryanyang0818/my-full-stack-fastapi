import { useMemo } from "react"

import { type RenderTab, TabHeader } from "@/components/TabHeader/TabHeader"
import { TabPageHost } from "@/components/TabHeader/TabPageHost"
import { tabRegistry } from "@/components/TabHeader/tabRegistry"
import { useTabStore } from "@/stores/tabStore"

// 控制層：極薄接合點，從 store 取狀態並串接 TabHeader / TabPageHost（完全不碰 Router）
export function TabHeaderController() {
  // 唯一真相：逐欄選取，動作參考在 Zustand 中穩定
  const tabs = useTabStore((s) => s.tabs)
  const activeId = useTabStore((s) => s.activeId)
  const setActive = useTabStore((s) => s.setActive)
  const closeTab = useTabStore((s) => s.closeTab)
  const closeRight = useTabStore((s) => s.closeRight)
  const closeAll = useTabStore((s) => s.closeAll)
  const reorder = useTabStore((s) => s.reorder)

  // 把持久化的 {id,key} 結合 tabRegistry 補出 title/icon，給 TabHeader 純 UI 用
  const renderTabs = useMemo<RenderTab[]>(
    () =>
      tabs.map((tab) => {
        const meta = tabRegistry[tab.key]
        return {
          id: tab.id,
          key: tab.key,
          title: meta.title,
          icon: meta.icon,
        }
      }),
    [tabs],
  )

  return (
    // -mb-6/md:-mb-8 + h-[calc(...)]：咬穿 main 的下方留白(p-6 md:p-8)，
    // 與下面 TabHeader 的 -mx-6/-mt-6/md:-mx-8/md:-mt-8 同一套既有假設，讓 flex-1 的
    // Tab Content Area（及內部頁面如 ItemsCRUD 的 Side Panel）能真正貼齊 main 下緣
    <div className="-mb-6 flex h-[calc(100%+1.5rem)] min-w-0 flex-col md:-mb-8 md:h-[calc(100%+2rem)]">
      <div className="-mx-6 -mt-6 min-w-0 overflow-hidden md:-mx-8 md:-mt-8">
        <TabHeader
          tabs={renderTabs}
          activeId={activeId}
          onSelect={setActive}
          onClose={closeTab}
          onCloseRight={closeRight}
          onCloseAll={closeAll}
          onReorder={reorder}
        />
      </div>
      {/* Tab Content Area：撐滿剩餘高度，讓內部頁面（如 ItemsCRUD 的 Side Panel）能貼滿 */}
      <div className="w-full min-w-0 max-w-screen-2xl flex-1 min-h-0 pt-4">
        <TabPageHost />
      </div>
    </div>
  )
}
