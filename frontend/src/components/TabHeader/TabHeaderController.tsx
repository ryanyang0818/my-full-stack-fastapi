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
    <div className="flex flex-col">
      <TabHeader
        tabs={renderTabs}
        activeId={activeId}
        onSelect={setActive}
        onClose={closeTab}
        onCloseRight={closeRight}
        onCloseAll={closeAll}
        onReorder={reorder}
      />
      <div className="pt-4">
        <TabPageHost />
      </div>
    </div>
  )
}
