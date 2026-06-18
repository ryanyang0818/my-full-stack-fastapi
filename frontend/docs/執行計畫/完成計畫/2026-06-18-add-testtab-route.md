# 新增 TestTab 側邊欄選單與路由

**日期：** 2026-06-18
**狀態：** 已實作

## 目標

在側邊欄選單的 Admin 選項下方新增一個 TestTab 連結，點擊後只更新主內容區（`<Outlet />`），不觸發整頁跳轉。

## 決策記錄

- 頁面內容：測試文字（placeholder）
- 顯示權限：所有登入者可見

## 影響檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/routes/_layout/test-tab.tsx` | 新增 | `/test-tab` 路由頁面，顯示測試文字 |
| `src/components/Sidebar/AppSidebar.tsx` | 修改 | 新增 TestTab 選單項目（`LayoutDashboard` icon） |
| `src/routeTree.gen.ts` | 自動生成 | Vite plugin 自動更新，無需手動修改 |

## 選單結構

- superuser：Dashboard → Items → Admin → **TestTab**
- 一般使用者：Dashboard → Items → **TestTab**

## 命名慣例

| 用途 | 名稱 |
|------|------|
| 檔案名稱 | `test-tab.tsx`（kebab-case） |
| 路由路徑 | `/test-tab` |
| 元件名稱 | `TestTab`（PascalCase） |
| 選單文字 | `TestTab` |
