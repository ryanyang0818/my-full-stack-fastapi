import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar"

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
}

// 側邊欄搜尋框，sidebar 收合時自動隱藏
export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-2 px-2">
      <SidebarGroupContent>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="dodo-sidebar-search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="搜尋功能..."
            className="h-7 pl-7 pr-6 text-xs"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
