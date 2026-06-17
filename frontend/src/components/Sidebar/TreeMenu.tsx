import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  filterTree,
  type TreeFolder,
  type TreeGroup,
  type TreeLeaf,
} from './tree-data'

interface TreeMenuProps {
  data: TreeGroup[]
  search: string
}

// Lv3 葉節點
function LeafItem({ leaf }: { leaf: TreeLeaf }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild size='sm'>
        <a href={leaf.path ?? '#'} className='flex items-center gap-1.5'>
          <leaf.icon className='h-3.5 w-3.5 shrink-0' />
          <span className='flex-1 truncate'>{leaf.label}</span>
          {leaf.code && (
            <span className='text-[10px] font-mono text-muted-foreground shrink-0'>
              {leaf.code}
            </span>
          )}
          {leaf.badge !== undefined && (
            <span
              className={cn(
                'rounded px-1 text-[10px] font-medium shrink-0',
                leaf.badgeVariant === 'warn'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {leaf.badge}
            </span>
          )}
        </a>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

// Lv2 資料夾節點（可展開）
function FolderItem({
  folder,
  defaultOpen = false,
}: {
  folder: TreeFolder
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size='sm'
        onClick={() => setOpen((v) => !v)}
        className='gap-1.5'
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-90'
          )}
        />
        <folder.icon className='h-3.5 w-3.5 shrink-0' />
        <span className='flex-1 truncate'>{folder.label}</span>
      </SidebarMenuButton>
      {open && folder.children.length > 0 && (
        <SidebarMenuSub>
          {folder.children.map((leaf) => (
            <LeafItem key={leaf.code ?? leaf.label} leaf={leaf} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

// Lv1 群組節點（可展開，收合時顯示 tooltip）
function GroupItem({
  group,
  defaultOpen = false,
}: {
  group: TreeGroup
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen((v) => !v)}
        tooltip={group.label}
        className='gap-1.5'
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[collapsible=icon]:hidden',
            open && 'rotate-90'
          )}
        />
        <group.icon className='h-4 w-4 shrink-0' />
        <span className='flex-1 truncate font-medium'>{group.label}</span>
        {group.badge !== undefined && (
          <span
            className={cn(
              'rounded px-1.5 text-[10px] font-medium shrink-0',
              group.badgeVariant === 'warn'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {group.badge}
          </span>
        )}
      </SidebarMenuButton>
      {open && group.children.length > 0 && (
        <SidebarMenuSub>
          <SidebarMenu>
            {group.children.map((folder) => (
              <FolderItem
                key={folder.label}
                folder={folder}
                defaultOpen={defaultOpen}
              />
            ))}
          </SidebarMenu>
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

// 樹狀選單根元件，搜尋時自動展開匹配路徑
export function TreeMenu({ data, search }: TreeMenuProps) {
  const isSearching = search.trim().length > 0
  const filtered = useMemo(() => filterTree(data, search), [data, search])

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {filtered.map((group) => (
            <GroupItem
              key={group.label}
              group={group}
              defaultOpen={isSearching}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
