# TabHeader 樣式強化與滿版修正

作者：Claude Sonnet 4.6
日期：2026-06-22

## 背景

針對 [TabHeader.tsx](../../src/components/TabHeader/TabHeader.tsx) 做三項調整：

1. Inactive 頁籤矮一點、字小一點，Active 頁籤維持現有強調效果
2. 拖曳排序時鎖定只能水平移動，不能上下拖
3. Tab Header（含底部分隔線）在寬螢幕下要滿版貼齊邊緣，不能被 `max-w-7xl` 置中留白
4. （後補）Tab Header 整列高度要固定，active/inactive 切換動畫時不能跟著上下跳動

## 探索結論

- `TabHeader.tsx:82` 容器用 `items-stretch`，光縮小 inactive 的 padding 沒用，flex 會把它撐回同高 → 需改成 `items-end`
- 滿版問題根因：`_layout.tsx:106-111` 把 `<Outlet />` 包在 `<div class="mx-auto max-w-7xl">` 裡，`TabHeaderController.tsx:36` 現有的 `-mx-6 -mt-6` 只能抵消 `<main>` 的 padding，無法抵消 `max-w-7xl` 的置中留白；螢幕寬度 > 1280px 時才會顯現留白
- 拖曳目前用 `@dnd-kit/core` 的 `DndContext`，無套件層級的軸向限制，需自寫 modifier
- 專案內 `@dnd-kit/modifiers` 未安裝，只用得到 `restrictToHorizontalAxis` 這一個函式，傾向直接寫在 `TabHeader.tsx` 內，不新增依賴
- 高度跳動根因：row 容器（`items-end`）原本沒有固定高度，cross-axis 高度＝當下最高子項目；active/inactive 切換動畫期間，舊 active 頁籤從 35px 往下縮、新 active 頁籤從 26px 往上長，兩者同時過渡時整列的「最高子項目」中途會先變矮再變高，造成視覺跳動。實測：row 內容高度固定為 `pt-1`(4px) + active 頁籤外框高(35px) = 39px

## 預計影響檔案

- `src/components/TabHeader/TabHeader.tsx`（修改）
  - 容器 `items-stretch` → `items-end`
  - Active/Inactive 字級、icon 尺寸、padding 數值調整
  - 新增 `restrictToHorizontalAxis` modifier，掛到 `DndContext`
  - 視覺變化加 `transition-all`（取代現有 `transition-colors`）
  - row 容器補上固定高度 `h-[39px]`，避免切換動畫時整列跳動
- `src/routes/_layout.tsx`（修改）
  - 判斷目前路由是否為首頁（頁籤工作區 `/_layout/`），是的話 `<Outlet />` 不包 `max-w-7xl`
  - 其他路由頁（`/admin`、`/settings`、`/test-tab`、`/test-tab2`）維持原本 `max-w-7xl` 置中包裝，不受影響
- `src/components/TabHeader/TabHeaderController.tsx`（修改）
  - 把 `mx-auto w-full max-w-7xl` 包到內容區（`<TabPageHost />` 那一層），不包頁籤標題列
  - 頁籤標題列維持貼齊 `<main>` 邊緣（沿用現有 `-mx-6 -mt-6 md:-mx-8 md:-mt-8`）

## 任務項目

- [x] `TabHeader.tsx`：容器改 `items-end`，調整 active/inactive 的字級（`text-sm`/`text-xs`）、icon 尺寸（`size-4`/`size-3.5`）、垂直 padding，關閉按鈕同步等比縮小
- [x] `TabHeader.tsx`：加上 `restrictToHorizontalAxis` modifier 並掛到 `DndContext`
- [x] `TabHeader.tsx`：尺寸相關 class 補上 `transition-all`，讓切換時有平滑過渡
- [x] `_layout.tsx`：依路由判斷是否略過 `max-w-7xl` 包裝（首頁不包，其他路由頁維持）
- [x] `TabHeaderController.tsx`：把 `max-w-7xl mx-auto` 移到內容區包裝，標題列維持滿版
- [x] `TabHeader.tsx`：row 容器補上固定高度 `h-[39px]`，修正 active/inactive 切換時整列跳動的問題
- [x] 視覺驗證：窄螢幕、寬螢幕（> 1280px）下 Tab Header 與底部分隔線皆滿版；active/inactive 高度與字級差異符合預期；切換頁籤時整列高度維持 39px 不跳動
- [x] 確認 `/admin`、`/settings` 等其他路由頁版面未受影響

### 驗證結果（preview 實測）

- 寬螢幕（1600px）：Tab Header 與底部分隔線 `x: 250→1600`，貼齊 `<main>` 左右邊緣，無留白
- Active（Items）外框高 35px、字級 14px；Inactive（Dashboard）外框高 26px、字級 12px，底部對齊
- 切換 Items ↔ Dashboard 前後，row 容器高度皆固定為 39px，不再跳動
- `/admin` 路由頁內容區仍維持 `max-w-7xl mx-auto`（寬度 1271px，置中留白），未受影響
- `bunx tsc --noEmit`：僅既有、與本次改動無關的 1 個錯誤（`tests/utils/mailcatcher.ts`）

## 不在範圍內

- 不改拖曳排序、右鍵選單、固定頁籤鎖定等既有互動邏輯
- 不調整 `test-tab` / `test-tab2`（已從 Sidebar 移除連結，非生產頁籤系統）
- 此階段不寫測試、不規劃 Playwright 情境（依專案 SOP，測試另開階段討論）
