# ClosableTabs 外觀改版與元件化

**日期：** 2026-06-18
**狀態：** 待實作
**作者：** Claude Sonnet 4.6

## 目標

改善 TestTab 頁籤列的外觀，使其符合截圖參考設計，
並將邏輯抽出為可複用的 `ClosableTabs` 元件。

## 外觀修改

| 項目 | 目前 | 目標 |
|------|------|------|
| 頁籤間距 | `-space-x-px`（重疊） | `gap-1`（間距） |
| 左側起始間距 | 無 | `TabsList` 加 `px-2` |
| 非 active 底色 | 透明 | `bg-muted/50` |
| Active 底色 | `bg-muted` | `bg-muted`（維持） |
| Hover 樣式 | 無 | chip wrapper `hover:bg-muted/70` |
| 顏色 indicator | 底部底線 | 移至頂部（`after:top-0`） |
| Icon 顏色 | `opacity-60`（灰） | 依 `TabConfig.color` 著色 |
| X 按鈕 | `size={12}` | 縮小尺寸與間距 |

## 元件化

- 將目前寫在 `test-tab.tsx` 的 Tabs 邏輯抽出為 `ClosableTabs`
- `ClosableTabs` 接收 `tabs` 與 `children` 作為 props，供未來複用
- `test-tab.tsx` 改為純粹使用 `ClosableTabs`，移除佔位文字

## 任務清單

- [ ] 新增 `src/components/Common/ClosableTabs.tsx`（含外觀改版與互動邏輯）
- [ ] 修改 `src/routes/_layout/test-tab.tsx`（使用 ClosableTabs，移除佔位文字）

## 影響檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/components/Common/ClosableTabs.tsx` | 新增 | 可複用的可關閉頁籤元件 |
| `src/routes/_layout/test-tab.tsx` | 修改 | 瘦身，改用 ClosableTabs |
