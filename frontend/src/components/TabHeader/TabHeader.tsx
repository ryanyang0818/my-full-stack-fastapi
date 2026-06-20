import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { LucideIcon } from "lucide-react"
import { X } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { FIXED_TAB_ID } from "@/stores/tabStore"
import type { TabKey } from "./types"

// Controller 注入的 render 形態：store 的 {id,key} 併入 tabRegistry 的 {title,icon}
export type RenderTab = {
  id: string
  key: TabKey
  title: string
  icon: LucideIcon
}

type TabHeaderProps = {
  tabs: RenderTab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onCloseRight: (id: string) => void
  onCloseAll: () => void
  onReorder: (activeId: string, overId: string) => void
}

// 純展示頁籤列：水平排序 + 右鍵選單 + 固定頁籤鎖定，狀態全由 props 控制
export function TabHeader({
  tabs,
  activeId,
  onSelect,
  onClose,
  onCloseRight,
  onCloseAll,
  onReorder,
}: TabHeaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  // 拖曳結束：擋掉拖曳源為固定頁籤、以及落到固定頁籤之前的無效落點，其餘交回 store
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    if (active.id === FIXED_TAB_ID) return
    if (over.id === FIXED_TAB_ID) return
    onReorder(String(active.id), String(over.id))
  }

  return (
    <ScrollArea className="w-full min-w-0 max-w-full overflow-hidden border-b border-border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex w-max min-w-full items-stretch gap-1 bg-background pl-1 pt-1">
            {tabs.map((tab) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeId}
                onSelect={onSelect}
                onClose={onClose}
                onCloseRight={onCloseRight}
                onCloseAll={onCloseAll}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

type SortableTabProps = {
  tab: RenderTab
  isActive: boolean
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onCloseRight: (id: string) => void
  onCloseAll: () => void
}

// 單一頁籤：固定頁籤不可拖、無 X；外包右鍵選單三項
function SortableTab({
  tab,
  isActive,
  onSelect,
  onClose,
  onCloseRight,
  onCloseAll,
}: SortableTabProps) {
  const isFixed = tab.id === FIXED_TAB_ID
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, disabled: isFixed })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const Icon = tab.icon
  // 固定頁籤不掛拖曳 attributes/listeners，徹底擋住拖曳
  const dragProps = isFixed ? {} : { ...attributes, ...listeners }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "relative flex shrink-0 items-stretch overflow-hidden rounded-t-[10px] rounded-b-none border border-border transition-colors",
            isActive
              ? "bg-background border-border/60 shadow-sm"
              : "bg-muted hover:bg-muted/40",
            isDragging && "z-10 opacity-80",
          )}
        >
          {/* 頂部 indicator，active 時顯示 primary 色 */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5 transition-colors",
              isActive && "bg-primary",
            )}
          />
          <button
            type="button"
            {...dragProps}
            onClick={() => onSelect(tab.id)}
            className="flex items-center gap-1.5 px-1.5 pt-[5px] pb-2 text-sm"
          >
            <Icon
              className={cn(
                "size-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span
              className={cn(
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {tab.title}
            </span>
          </button>
          {!isFixed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
              className="my-auto mr-1 flex size-5 items-center justify-center rounded-sm text-muted-foreground/40 transition-colors hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`關閉 ${tab.title}`}
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        {/* 固定頁籤本身不可關閉，故 disabled（radix Item disabled 時 onSelect 不會觸發） */}
        <ContextMenuItem
          variant="destructive"
          disabled={isFixed}
          onSelect={() => onClose(tab.id)}
        >
          關閉本頁籤
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onCloseRight(tab.id)}>
          關閉右側頁籤
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onCloseAll()}>
          關閉全部頁籤
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
