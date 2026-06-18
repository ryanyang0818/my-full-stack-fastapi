# TestTab2 高仿真可關閉 Tabs 頁面

**日期：** 2026-06-18
**狀態：** 待實作

## 目標

調整 `/test-tab2` 頁面內容，參考 `demo/demotab` 的 Tabs 樣式做高度仿真，並新增頁簽關閉功能。

第一個頁簽預設不可關閉。

## 已確認需求

| 項目 | 決策 |
|---|---|
| 路由 | `/test-tab2` |
| 參考來源 | `demo/demotab` |
| UI 元件 | 沿用 `shadcn/ui` Tabs |
| 關閉功能 | 實作可關閉頁簽 |
| 保護規則 | 第一個頁簽 `Overview` 不可關閉 |

## 設計仿真重點

| Demo 特徵 | TestTab2 實作方向 |
|---|---|
| 水平 Tabs bar | 使用橫向可捲動容器 |
| Icon + label | 使用 `lucide-react` icons |
| 緊密 border tab | 覆寫 `TabsTrigger` className |
| Active 底線 | 使用 `after` pseudo-element |
| Light theme 友善 | 沿用 `bg-background`, `bg-muted`, `text-muted-foreground` |

## 技術策略

| 區塊 | 做法 |
|---|---|
| Tab 狀態 | 使用 controlled state：`activeTab` |
| 可見頁簽 | 使用 state 保存目前尚未關閉的 tabs |
| 關閉頁簽 | `closeTab(value)` 從可見 tabs 移除指定 tab |
| 關閉 active tab | 自動切到前一個可用 tab，沒有前一個則切到第一個 |
| 第一個 tab | `closable: false`，不顯示 close button，也不允許被程式關閉 |
| Nested button 風險 | close button 不放進 `TabsTrigger` 裡面，避免 button 巢狀 button |

## 預計影響檔案

| 檔案 | 變更類型 | 說明 |
|---|---|---|
| `src/routes/_layout/test-tab2.tsx` | 修改 | 改成高仿真 Tabs demo，加入可關閉頁簽狀態 |
| `src/components/ui/scroll-area.tsx` | 可能新增 | 若要完全沿用 demo 的 `ScrollArea` / `ScrollBar` 結構才新增 |
| `src/routeTree.gen.ts` | 不動 | 路由已存在，不需要重新生成 |

## 任務清單

- [ ] 將 `TestTab2` 改成 controlled Tabs
- [ ] 建立 `tabsConfig`，包含 `value`, `title`, `icon`, `content`, `closable`
- [ ] 高度仿真 `demo/demotab` 的水平 tab bar 樣式
- [ ] 實作 close button，並避免 nested button 問題
- [ ] 實作 `closeTab()`，保證第一個 tab 不可關閉
- [ ] 保留每個 function 上方的簡短中文註解
- [ ] 實作完成後再詢問如何驗證

## 不在本階段處理

| 項目 | 原因 |
|---|---|
| Playwright 情境 | SOP 規定存入計畫階段不設計測試情境 |
| `npm run build` | SOP 規定計畫中不要放入此項 |
| Git commit | 等實作與驗證後再確認 |
| 既有 `AGENTS.md` / `docs` / `.tanstack` 異動 | 非本計畫範圍 |
