# TestTab 頁面實作高品質 Tabs 元件

**日期：** 2026-06-18
**狀態：** 待實作

## 目標

在 `/test-tab` 頁面實作高品質 Tabs 元件，作為未來專案的重要共用元件。
設計參考：`demo/demotab`。

## 設計說明

- TabsList 以 ScrollArea 包住，支援橫向捲動（適應多頁籤情境）
- 每個 TabsTrigger 使用底線樣式（`after:h-0.5`），取代預設 pill 樣式
- 每個頁籤含 Lucide icon + 文字
- 沿用現有 `src/components/ui/tabs.tsx`，以 className 覆寫樣式（不動原始元件）

## 任務清單

- [ ] 新增 `src/components/ui/scroll-area.tsx`（包裝 `@radix-ui/react-scroll-area`，Radix 套件已安裝）
- [ ] 修改 `src/routes/_layout/test-tab.tsx`，實作 demo 的完整 tabs 頁面

## 影響檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/components/ui/scroll-area.tsx` | 新增 | 包裝 Radix ScrollArea，供 TabsList 使用 |
| `src/routes/_layout/test-tab.tsx` | 修改 | 實作完整 tabs demo |
| `src/components/ui/tabs.tsx` | 不動 | 已被 settings.tsx 使用，以 className 覆寫即可 |

## 技術策略

| 區塊 | 做法 |
|------|------|
| Tab 狀態 | controlled state：`activeTab` |
| 可見頁籤 | state 保存目前尚未關閉的 tabs 陣列 |
| 關閉頁籤 | `closeTab(value)` 從可見 tabs 移除指定 tab |
| 關閉 active tab | 自動切到前一個可用 tab；沒有前一個則切到第一個 |
| 第一個 tab | `closable: false`，不顯示 X，也不允許被程式關閉 |

### Tab chip 結構

X 按鈕視覺上是頁籤的一部分，但**不能放進 `TabsTrigger` 裡**（會污染 Radix 的點擊語意）。
做法：外層包一個 chip 容器，左邊是 `TabsTrigger`，右邊是獨立的關閉按鈕。

```
[ icon  頁籤文字 | X ]
  ^--- TabsTrigger  ^--- 獨立 button
  \---------- chip wrapper ----------/
```

## 參考

- Demo 來源：`demo/demotab`
- Radix 套件：`@radix-ui/react-scroll-area ^1.2.10`（已安裝）
