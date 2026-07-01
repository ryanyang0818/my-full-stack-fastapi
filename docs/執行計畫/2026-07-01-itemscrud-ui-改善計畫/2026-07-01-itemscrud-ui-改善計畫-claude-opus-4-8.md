# ItemsCRUD Tab UI 改善計畫

簽名：Claude Opus 4.8

建立日期：2026-07-01

狀態：待實作（已存入計畫，尚未動程式碼）

## 目的

歸檔 `ItemsCRUD` 頁籤的 UI/UX 檢視結果與修改清單，作為後續實作依據。本次以截圖加原始碼檢視（`impeccable critique`，product register），anti-pattern 自動偵測器掃描**乾淨無命中**，整體屬「earned familiarity」的稱職後台 UI，非 AI slop。設計健康分數 **26 / 40（中上）**。

目標檔案：[`frontend/src/components/ItemsCRUD/ItemsCRUD.tsx`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx)

## 預計影響 / 新增檔案

| 檔案 | 動作 | 說明 |
|---|---|---|
| `frontend/src/components/ItemsCRUD/ItemsCRUD.tsx` | 修改 | 主元件，8 項改動全部集中在此檔 |
| 其他 | 無 | 不新增檔案、不新增依賴 |

## 修改清單總覽

| # | 項目 | 優先級 | 對應指令 | 已確認方向 |
|---|---|---|---|---|
| 1 | 表單 label 視覺層級 + 必填標示 | P1 | `/impeccable typeset` | ✅ 是 |
| 2 | 面板遮擋表格（摘要 pin） | P1 | `/impeccable layout` | ⬜ 待定 |
| 3 | 無障礙：label 關聯 + 排序欄鍵盤化 | P2 | `/impeccable audit` | ⬜ 待定 |
| 4 | 編輯按鈕 disabled 原因提示 | P2 | `/impeccable clarify` | ⬜ 待定 |
| 5 | 匯出按鈕與異動群組分離 | 次要 | `/impeccable layout` | ⬜ 待定 |
| 6 | 原生 date input 視覺一致性 | 次要 | `/impeccable typeset` | ⬜ 待定 |
| 7 | 列高觸控熱區 | 次要 | `/impeccable adapt` | ⬜ 待定 |
| 8 | 面板寬度窄視窗響應式風險 | 次要 | `/impeccable adapt` | ⬜ 待定 |

---

## 概念與實作計畫

### P1

#### #1 表單 label 視覺層級 + 必填標示 ✅

- **問題**：`Field` / `SelectField` / `DateField` / `TextareaField` 的 label 全用 `text-xs text-muted-foreground`，與 placeholder 同階；欄位名灰到難掃描。無必填標示、無驗證態。
- **影響**：掃描成本上升（heuristic 8）；缺必填標示（heuristic 5 錯誤預防）。
- **修法**：
  - label 改 `text-xs font-medium text-foreground`。
  - 必填欄位（名稱、分類、負責人、數量、金額）label 後加紅色 `*`。
  - `FormSection` 區塊標題維持 muted，讓欄位名升階、區塊標題退次階。
- **位置**：[`ItemsCRUD.tsx:881`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L881)、`:904`、`:931`、`:949`
- **備註**：純樣式不碰邏輯。「哪些欄位算必填」需最終確認。

### P2

#### #2 面板遮擋表格（摘要 pin）

- **問題**：Side Panel 用 `absolute` 覆蓋表格右半，截圖只剩到「建立日期」；編輯時看不到正在改那列的「數量 / 金額 / 狀態」。
- **影響**：違反「同地點放決策所需資訊」，編輯情境喪失對照。
- **修法（建議：摘要 pin）**：編輯態在面板頂端固定 `position: sticky; top: 0` 的精簡摘要列（編號 / 名稱 / 金額 / 狀態），捲動表單時不動；新增態不顯示。替代方案：面板開啟時擠壓表格（squeeze），改動較大。
- **位置**：[`ItemsCRUD.tsx:694`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L694)、`:712`

#### #3 無障礙：label 關聯 + 排序欄鍵盤化

- **問題**：欄位名是 `<span>` 非 `<label htmlFor>`，報讀器無法關聯；排序綁在 `<th onClick>`，不可 focus、無 `aria-sort`。
- **影響**：違反無障礙基本要求。
- **修法**：`<span>` 改 `<label htmlFor>` + input 補 `id`；排序 `<th>` 內改放 `<button>` 並補 `aria-sort`。
- **位置**：label `:881`/`:904`/`:931`/`:949`；排序表頭 [`ItemsCRUD.tsx:467`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L467)

#### #4 編輯按鈕 disabled 原因提示

- **問題**：未選 / 多選時「編輯」鈕灰掉，但無說明。
- **影響**：違反 heuristic 6 辨識而非回憶。
- **修法**：disabled 時包 tooltip「請先選取一列」。
- **位置**：[`ItemsCRUD.tsx:360`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L360)

### 次要

#### #5 匯出按鈕與異動群組分離
- **問題**：`匯出` 與 `新增 / 編輯 / 刪除` 同群組，混了異動與輸出。
- **修法**：用分隔線或推到右側分開。
- **位置**：[`ItemsCRUD.tsx:379`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L379)

#### #6 原生 date input 視覺一致性
- **問題**：原生 date input 與 shadcn Select 不同調，跨瀏覽器渲染不一。
- **修法**：可換 shadcn date picker；惟原生在 product register 被允許，**非必改**。
- **位置**：[`ItemsCRUD.tsx:931`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L931)

#### #7 列高觸控熱區
- **問題**：列高 `h-8` 密，checkbox 熱區偏小（桌面可接受）。
- **修法**：若需觸控，提供較鬆列高或加大 checkbox 熱區。
- **位置**：`ItemsCRUD.tsx:515` 起

#### #8 面板寬度窄視窗響應式風險
- **問題**：面板 `width 448 / min 360`，窄視窗幾乎蓋滿表格。
- **修法**：依容器寬度設斷點，窄視窗改全寬或底部抽屜。
- **位置**：[`ItemsCRUD.tsx:157`](../../../frontend/src/components/ItemsCRUD/ItemsCRUD.tsx#L157)

---

## 任務清單

- [ ] #1 表單 label 改 `font-medium text-foreground`，必填欄加紅色 `*`
- [ ] #4 編輯按鈕 disabled 態加 tooltip「請先選取一列」
- [ ] #3a 欄位 `<span>` label 改 `<label htmlFor>` + input `id`
- [ ] #3b 排序 `<th>` 改 `<button>` + `aria-sort`
- [ ] #2 編輯面板頂端加 sticky 摘要 pin（編號 / 名稱 / 金額 / 狀態）
- [ ] #5 匯出鈕與異動群組加分隔
- [ ] #6 date input 視覺一致性（非必改）
- [ ] #7 列高 / checkbox 觸控熱區（視需求）
- [ ] #8 面板窄視窗響應式斷點

---

## 驗收項目

- [ ] **#1** 表單所有欄位名顏色為 `text-foreground` 且 `font-medium`，與 placeholder 明顯區分；名稱 / 分類 / 負責人 / 數量 / 金額 label 後有紅色 `*`；區塊標題仍為 muted，層級可辨。
- [ ] **#2** 開啟「編輯」面板時，頂端顯示該列編號 / 名稱 / 金額 / 狀態摘要，捲動表單時摘要固定不動；「新增」面板不顯示摘要。
- [ ] **#3** 每個表單欄位以 `label htmlFor` 關聯對應 input；鍵盤 Tab 可聚焦排序表頭並以 Enter / Space 觸發排序，`aria-sort` 隨排序狀態更新。
- [ ] **#4** 未選或多選時，hover「編輯」鈕出現「請先選取一列」提示；選取單列時提示消失且可點擊。
- [ ] **#5** 匯出鈕在視覺上與新增 / 編輯 / 刪除群組明確分隔。
- [ ] **#6** （若執行）date 欄位與其他欄位視覺對齊一致。
- [ ] **#7** （若執行）觸控裝置上 checkbox 熱區不小於建議尺寸。
- [ ] **#8** 窄視窗（如 < 768px）下面板不完全遮蔽表格，或改為全寬 / 底部抽屜。
- [ ] 既有列表操作（篩選、排序、分頁、批次選取、刪除確認）行為不變。

---

## 設計健康分數明細

| # | 啟發式原則 | 分數 | 主要問題 |
|---|---|---|---|
| 1 | 系統狀態可見 | 3 | chip 筆數、已選數、分頁、toast 皆有；缺 loading / skeleton |
| 2 | 貼近真實世界 | 3 | 中文領域詞清楚 |
| 3 | 使用者控制與自由 | 3 | Esc / 取消 / X 可關面板；刪除後無 undo |
| 4 | 一致性與標準 | 3 | shadcn 一致；原生 date input 略不一致 |
| 5 | 錯誤預防 | 2 | 有刪除確認、編輯需選一列；表單無必填標示、無驗證 |
| 6 | 辨識而非回憶 | 2 | 編輯鈕灰掉但無提示原因 |
| 7 | 彈性與效率 | 3 | 批次選取 / 篩選 / 排序齊全；無鍵盤排序、無快捷鍵 |
| 8 | 美感與簡約 | 3 | 乾淨密集；表單 label 全 muted，層級偏弱 |
| 9 | 錯誤復原 | 2 | 示範態，無真實錯誤訊息 / 復原 |
| 10 | 說明與文件 | 2 | 僅示範副標；空狀態只有「查無資料」 |
| **總計** | | **26 / 40** | **中上（多數真實介面落在 20–32）** |

## 做得好的地方（保留）

- 工具列資訊密度恰當：左側操作群、右側篩選群分區清楚，chip 帶即時筆數。
- 刪除走 Dialog 確認、新增 / 編輯走無遮罩 Side Panel 的分工正確。
- Side Panel 可拖拉寬度 + 滑入動畫 200ms，符合 product 動效規範。

## 建議執行順序

1. #1 表單 label 視覺層級（已確認，先做）
2. #4 編輯按鈕 tooltip（小、獨立、低風險）
3. #3 無障礙修補
4. #2 面板摘要 pin
5. #5–#8 次要項視情況收尾
6. 最後跑 `/impeccable polish` 收斂
