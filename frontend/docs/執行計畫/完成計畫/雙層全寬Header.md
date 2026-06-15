# 雙層全寬 Header 執行計畫

## 計畫內容

- 建立 `AppMenuBar`：
  - 高度 `32px`，使用淺灰背景。
  - 顯示「檔案、編輯、檢視、工具、視窗、說明」。
  - 第一版只呈現靜態文字，不提供下拉互動。
  - 手機版隱藏。
- 建立 `UserHeader`：
  - 高度 `56px`，使用白色／主題背景。
  - 左側顯示 Sidebar 開關與平台名稱。
  - 右側顯示 Avatar 與使用者姓名。
- Header 高度由 `_layout.tsx` 統一設定 CSS 變數：
  - `--app-menu-bar-height`
  - `--user-header-height`
- `AppMenuBar`、`UserHeader`、Layout 上方間距與 Sidebar 位置都引用同一組變數，避免高度數字散落在多個檔案。
- 桌面 Sidebar 從兩層 Header 下方開始，高度扣除 `88px`。
- 手機版只保留 `UserHeader`，Sidebar 維持抽屜模式。
- 保留 Sidebar Footer 原有的使用者選單。
- 保留首頁公告橫幅與歡迎訊息。
- 不新增套件、後端 API 或路由。

## 預計影響檔案

- 新增 `docs/執行計畫/雙層全寬Header.md`
- 新增 `src/components/Header/AppMenuBar.tsx`
- 新增 `src/components/Header/UserHeader.tsx`
- 修改 `src/routes/_layout.tsx`
- 修改 `src/components/Sidebar/AppSidebar.tsx`
- 修改 `src/components/docs/目錄說明.md`

## 使用技術棧

- React 19
- TypeScript
- TanStack Router
- Tailwind CSS 4
- shadcn/ui Avatar 與 Sidebar
- Vite

## 驗證方式

- 執行 `bun run build`。
- 驗證桌面版雙層 Header 橫跨 Sidebar 與內容區。
- 驗證手機版隱藏 `AppMenuBar`。
- 驗證 Avatar、姓名與 Sidebar 開關正常。
- 驗證 `/`、`/items`、`/admin`、`/settings` 共用相同 Header。
- 驗證亮色與暗色主題。
