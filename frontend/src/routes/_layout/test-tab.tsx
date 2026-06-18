import { createFileRoute } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { Box, House, PanelsTopLeft, X } from "lucide-react"
import { useState } from "react"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type TabConfig = {
  value: string
  label: string
  icon: LucideIcon
  closable: boolean
}

const INITIAL_TABS: TabConfig[] = [
  { value: 'tab-1', label: 'Overview', icon: House, closable: false },
  { value: 'tab-2', label: 'Projects', icon: PanelsTopLeft, closable: true },
  { value: 'tab-3', label: 'Packages', icon: Box, closable: true },
]

export const Route = createFileRoute("/_layout/test-tab")({
  component: TestTab,
  head: () => ({
    meta: [{ title: "TestTab - DoDo ERP" }],
  }),
})

// TestTab 頁面：可關閉頁籤示範元件
function TestTab() {
  const [tabs, setTabs] = useState<TabConfig[]>(INITIAL_TABS)
  const [activeTab, setActiveTab] = useState('tab-1')

  // 關閉指定頁籤，active tab 被關閉時自動切到前一個或第一個
  const closeTab = (value: string) => {
    const idx = tabs.findIndex(t => t.value === value)
    if (idx === -1) return
    const next = tabs.filter(t => t.value !== value)
    setTabs(next)
    if (activeTab === value) {
      setActiveTab(next[idx - 1]?.value ?? next[0].value)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">TestTab</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea>
          <TabsList className="mb-3 h-auto -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
            {tabs.map(tab => (
              <div
                key={tab.value}
                className={cn(
                  'relative flex items-stretch overflow-hidden border border-border',
                  'first:rounded-s last:rounded-e',
                  'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
                  'has-[[data-state=active]]:bg-muted has-[[data-state=active]]:after:bg-primary',
                )}
              >
                <TabsTrigger
                  value={tab.value}
                  className="rounded-none border-0 py-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <tab.icon
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {tab.label}
                </TabsTrigger>
                {tab.closable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.value)
                    }}
                    className="flex items-center px-1.5 text-muted-foreground/70 hover:text-foreground"
                    aria-label={`關閉 ${tab.label}`}
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>
            <p className="p-4 pt-1 text-center text-xs text-muted-foreground">
              Content for {tab.label}
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
