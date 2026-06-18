# Menubar 下拉選單列計畫

## 目標

把目前靜態的 `AppMenuBar`：

```text
檔案 / 編輯 / 檢視 / 工具 / 視窗 / 說明
```

升級成可點擊展開的 ERP 桌面式 Menubar，下拉內容只做展示，不綁定真實功能。

## 探索結論

| 項目 | 現況 |
|---|---|
| `AppMenuBar.tsx` | 目前只有靜態文字列，沒有 dropdown |
| `dropdown-menu.tsx` | 已有 `DropdownMenuSub`、`DropdownMenuShortcut`，不用新增 UI primitive |
| 版面位置 | `AppMenuBar` 已由 `_layout.tsx` 放在 `UserHeader` 上方 |
| 測試 | 目前只驗證 `AppMenuBar` 顯示 / 隱藏 |

## 預計影響檔案

| 檔案 | 動作 | 說明 |
|---|---|---|
| `src/components/Header/AppMenuBar.tsx` | 修改 | 將靜態文字列改成 dropdown menubar |
| `tests/header-visibility.spec.ts` | 可選修改 | 若使用者同意測試階段新增案例，再檢查 dropdown 展開 |
| `.codex/plans/2. Menubar 下拉選單列/計畫.md` | 不在實作時修改 | 除非使用者要求更新原計畫 |

## 實作策略

- 不新增抽象檔案，先把 menu data 放在 `AppMenuBar.tsx` 內。
- 沿用既有 `DropdownMenu` 元件。
- 每個 top-level item 用 `DropdownMenuTrigger`。
- 選單項目使用資料驅動渲染。
- 「匯出」使用 `DropdownMenuSub`。
- 快捷鍵使用 `DropdownMenuShortcut`。
- 點擊展示項目只做 `console.info(...)`，不接真實功能。

## 任務項目

- [ ] 整理 `檔案 / 編輯 / 檢視 / 工具 / 視窗 / 說明` 的 menu data。
- [ ] 在 `AppMenuBar.tsx` 匯入 `DropdownMenu*` 元件。
- [ ] 將靜態 `<li>` 改成 `DropdownMenu` trigger。
- [ ] 實作一般 item、separator、shortcut、sub menu 渲染。
- [ ] 調整 dropdown 寬度、字級、hover 狀態，保持 ERP 桌面工具列密度。
- [ ] 確認 mobile 仍維持隱藏 `AppMenuBar`。
- [ ] 若進入測試階段，再由使用者決定是否新增 Playwright dropdown 測試。

## 不做範圍

| 不做 | 原因 |
|---|---|
| 不實作新增 / 儲存 / 列印真實功能 | 原計畫明確說只做展示 |
| 不綁定全域快捷鍵 | 原計畫明確排除 |
| 不新增新的 UI primitive | 既有 `dropdown-menu.tsx` 已足夠 |
| 不重構 Header 架構 | 目前 `_layout.tsx` 與顯示控制已穩定 |

## 建議驗收方式

- 開啟 `AppMenuBar` 後，6 個主項目橫向排列。
- 點每個主項目都能展開 dropdown。
- 「檔案 > 匯出」能展開 Excel / PDF / CSV 子選單。
- 快捷鍵文字顯示在右側。
- Dropdown 不被 `UserHeader` 或頁面內容遮擋。
