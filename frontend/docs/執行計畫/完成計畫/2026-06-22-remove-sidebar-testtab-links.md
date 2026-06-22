# 移除 Sidebar 中的 TestTab / TestTab2 連結

**日期：** 2026-06-22
**狀態：** 待實作
**作者：** Claude Sonnet 4.6

## 目標

移除 Sidebar 主選單中的 TestTab、TestTab2 兩個超連結項目。
路由頁本身（`/test-tab`、`/test-tab2`）保留，僅移除側邊欄入口。

## 背景

- `AppSidebar.tsx` 的 `items` 陣列中含有 TestTab2、TestTab 兩個項目，路徑分別為 `/test-tab2`、`/test-tab`。
- 因為 `tabKeyMap.ts`（`PATH_TO_TAB_KEY`）沒有對應這兩個 path，`Main.tsx` 會把它們渲染成一般路由連結（而非頁籤按鈕）。
- 確認過 `tests/tab-header.spec.ts:108` 是用 `page.goto("/test-tab")` 直接導航，不依賴側邊連結，不受影響。

## 任務清單

- [ ] 修改 `src/components/Sidebar/AppSidebar.tsx`：在 superuser 與一般使用者兩個 `items` 陣列中移除 `TestTab2`、`TestTab` 項目
- [ ] 修改 `src/components/Sidebar/Main.tsx` 第 66 行註解，移除過時的「TestTab / TestTab2」字樣

## 影響檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/components/Sidebar/AppSidebar.tsx` | 修改 | 移除 items 陣列中的 TestTab、TestTab2 項目 |
| `src/components/Sidebar/Main.tsx` | 修改 | 更新註解文字 |

## 不修改的檔案

| 檔案 | 原因 |
|------|------|
| `src/routes/_layout/test-tab.tsx` | 路由頁保留，使用者選擇不刪除 |
| `src/routes/_layout/test-tab2.tsx` | 路由頁保留，使用者選擇不刪除 |
| `src/routeTree.gen.ts` | TanStack Router 自動產生檔，不手動編輯 |
| `tests/tab-header.spec.ts` | 測試走 `page.goto` 直接導航，不依賴側邊連結 |
