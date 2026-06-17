# Sidebar 可拖曳寬度計畫

## 目標

讓登入後左側 `sidebar` 的邊緣可以拖曳調整寬度。

| 限制 | 數值 |
|---|---|
| 最小寬度 | `100px` |
| 最大寬度 | `250px` |

## 探索結論

| 發現 | 位置 |
|---|---|
| 桌面 sidebar 寬度由 `--sidebar-width` 控制 | `src/components/ui/sidebar.tsx` |
| `SidebarProvider` 統一注入 `--sidebar-width` | `src/components/ui/sidebar.tsx` |
| `sidebar-gap` 與 `sidebar-container` 都使用同一個寬度變數 | `src/components/ui/sidebar.tsx` |
| `SidebarRail` 已存在，但目前只做收合切換，尚未支援拖曳 | `src/components/ui/sidebar.tsx` |
| `AppSidebar` 尚未掛上 `SidebarRail` | `src/components/Sidebar/AppSidebar.tsx` |

## 預計影響檔案

| 檔案 | 類型 | 預計變更 |
|---|---|---|
| `src/components/ui/sidebar.tsx` | 修改 | 新增寬度 state、寬度限制常數、拖曳處理邏輯，並讓 `--sidebar-width` 由 state 控制 |
| `src/components/Sidebar/AppSidebar.tsx` | 修改 | import 並掛上 `SidebarRail`，讓 sidebar 邊緣可拖曳 |

## 暫不影響檔案

| 檔案 | 原因 |
|---|---|
| `src/lib/dodo-controller.ts` | 本次只做 UI 拖曳，不擴充 console controller contract |
| `src/components/Sidebar/SidebarControllerBridge.tsx` | 不把寬度狀態暴露到 `window.dodo.controller.sidebar` |

## 實作步驟

| 步驟 | 動作 |
|---|---|
| 1 | 在 `sidebar.tsx` 新增 `MIN_SIDEBAR_WIDTH = 100`、`MAX_SIDEBAR_WIDTH = 250`、`DEFAULT_SIDEBAR_WIDTH = 250` |
| 2 | 在 `SidebarProvider` 內新增 `sidebarWidth` state |
| 3 | 將 wrapper style 的 `--sidebar-width` 改成 `${sidebarWidth}px` |
| 4 | 將 `sidebarWidth` 與 `setSidebarWidth` 加入 `SidebarContextProps` |
| 5 | 改造 `SidebarRail`，用 pointer event 處理拖曳，並把寬度 clamp 在 `100px` 到 `250px` |
| 6 | 保留 click 收合行為，但避免拖曳結束時誤觸發 toggle |
| 7 | 在 `AppSidebar.tsx` 掛上 `<SidebarRail />` |

## 邊界決策

| 決策 | 說明 |
|---|---|
| 拖曳只影響桌面版 | 手機版仍維持 `Sheet` 抽屜 |
| 收合寬度不變 | `collapsible="icon"` 繼續使用既有 `--sidebar-width-icon` |
| 不新增檔案 | 直接沿用 shadcn sidebar 既有 `SidebarRail` |
| 不加入持久化 | 本次先不把寬度寫入 cookie 或 localStorage |

