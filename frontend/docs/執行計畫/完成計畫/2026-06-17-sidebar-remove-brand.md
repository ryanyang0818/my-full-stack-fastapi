# Sidebar 移除品牌區計畫

## 目標

移除左側 Sidebar 頂部的 `FastAPI` 品牌圖示與文字，避免與上方 Header 的 `DoDo ERP` 系統品牌重複。

Sidebar 搜尋框維持原本位置，也就是主選單後方。

## 探索結論

| 發現 | 位置 |
|---|---|
| 紅框中的 `FastAPI` 來自 `<Logo variant="responsive" />` | `src/components/Sidebar/AppSidebar.tsx` |
| `Logo` 被包在 `SidebarHeader` 內 | `src/components/Sidebar/AppSidebar.tsx` |
| 搜尋框是獨立元件 `SidebarSearch` | `src/components/Sidebar/SidebarSearch.tsx` |
| `Logo.tsx` 同時被登入頁使用 | `src/components/Common/Logo.tsx` |

## 預計影響檔案

| 檔案 | 類型 | 預計變更 |
|---|---|---|
| `src/components/Sidebar/AppSidebar.tsx` | 修改 | 移除 `Logo` import、移除 `SidebarHeader` import、移除 `<SidebarHeader>` 區塊 |

## 可能影響檔案

| 檔案 | 條件 | 預計變更 |
|---|---|---|
| `src/components/Sidebar/docs/目錄說明.md` | 若需要同步文件 | 更新 Sidebar 結構說明 |

## 暫不影響檔案

| 檔案 | 原因 |
|---|---|
| `src/components/Common/Logo.tsx` | 登入頁仍使用該元件，本次不改全域 Logo 行為 |
| `public/assets/images/*fastapi*` | 本次只移除 Sidebar 顯示，不處理資產替換 |
| `src/components/Header/UserHeader.tsx` | Header 已顯示 `DoDo ERP`，不需要重複調整 |

## 實作步驟

| 步驟 | 動作 |
|---|---|
| 1 | 從 `AppSidebar.tsx` 移除 `Logo` import |
| 2 | 從 `AppSidebar.tsx` 移除 `SidebarHeader` import |
| 3 | 刪除 `<SidebarHeader>...<Logo variant="responsive" />...</SidebarHeader>` |
| 4 | 保留 `<SidebarSearch />` 在 `<Main />` 後方的原本位置 |
| 5 | 保留 `Main`、`TreeMenu`、`SidebarFooter`、`SidebarRail` 現有行為 |

## 邊界決策

| 決策 | 說明 |
|---|---|
| 不把 Sidebar brand 改成 `DoDo ERP` | 避免與 Header 品牌重複 |
| 不新增 icon | 使用者已明確表示原 icon 不適合此專案 |
| 優先單檔修改 | 先只改組裝層 `AppSidebar.tsx` |
| 不處理登入頁 Logo | 登入頁是另一個品牌入口，本次不擴大範圍 |
| 搜尋框維持原位 | 試過移到最上方後不符合使用者偏好，已改回原本位置 |
