# TestTab2 頁簽關閉按鈕視覺優化

**日期：** 2026-06-18
**狀態：** 待實作

## 目標

只調整 `TestTab2` 的可關閉頁簽樣式，讓 `X` 看起來是該頁簽的一部分。

## 設計方向

```txt
[  頁簽文字  |  X  ]
```

| 需求 | 做法 |
|---|---|
| 看起來在同一個頁簽內 | 共用外框、背景、圓角 |
| 避免 button 包 button | `TabsTrigger` 和 `X button` 並排 |
| 關聯清楚 | `X` 放在同一個 `tab chip` 的右側 |

## 預計影響檔案

| 檔案 | 變更 |
|---|---|
| `src/routes/_layout/test-tab2.tsx` | 只調整 `TestTab2` tab chip 樣式 |

## 任務清單

- [ ] 讓外層 wrapper 成為完整 `tab chip`
- [ ] 將 border、rounded、active 背景整理到同一組視覺關係
- [ ] 讓 `X` 靠右但仍在同一個頁簽視覺內
- [ ] 保留 `TabsTrigger` 和 `X button` 並排，避免 nested button
- [ ] 不修改 `src/components/ui/tabs.tsx`
- [ ] 不修改其他頁面或共用元件

## 不在本計畫範圍

| 項目 | 原因 |
|---|---|
| 其他頁面的 Tabs | 本次只處理 `TestTab2` |
| 共用 Tabs primitive | 避免影響 `settings.tsx` 等既有頁面 |
| Playwright 情境 | 本階段只保存小計畫 |
