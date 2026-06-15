const menuItems = ["檔案", "編輯", "檢視", "工具", "視窗", "說明"]

// 顯示桌面程式風格的全域功能選單列
export function AppMenuBar() {
  return (
    <div className="hidden h-[var(--app-menu-bar-height)] items-center border-b bg-muted px-4 text-xs text-foreground md:flex">
      <nav aria-label="應用程式功能選單">
        <ul className="flex items-center gap-6">
          {menuItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
