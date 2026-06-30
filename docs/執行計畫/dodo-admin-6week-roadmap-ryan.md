# Dodo Admin｜6 週落地路線圖（壓縮版）

> **簽名**：Ryan（ryanyang0818）　·　**協作**：Claude Opus 4.8　·　**日期**：2026-06-27（Asia/Taipei）　·　**狀態**：Draft v1
> 對應文件：[產品定位](./dodo-admin-positioning.html)　·　[本路線圖視覺版](./dodo-admin-6week-roadmap-ryan.html)
> 經 5 份程式碼稽核（皆附 file:line）＋ 對抗驗證壓測後定版。

---

## 0. 一句話定調

地基層成熟可信，但「對外展示層」與三支柱中的兩支（**Config-driven**、**Role Permission**）尚未落地。本路線圖用 **6 週**，以「**庫存 + 客戶銷售**」兩個業務域為載體，一次點亮 Dashboard / Data Tables / Role Permission，交付一條可對客 demo 的痛點流程。

---

## 1. 程式碼現況

**地基 vs 展示層：**

| 層 | 狀態 | 說明 |
|----|------|------|
| 🟢 地基層 | 成熟可信 | Auth 完整（JWT/Argon2/timing 防護/找回密碼/last_login）、CI 三條 workflow + 後端覆蓋率門檻 90%、Docker 一鍵起、User Management 前後端皆完整 |
| 🔴 展示層 | 基本空殼 | Dashboard 佔位、ERP Demo 只有 Item 佔位、Data Tables/Forms 手刻無查詢、RBAC 有模型無 enforcement、seed 未自動化 |

**六大模組真實狀態（皆有 file:line 佐證）：**

| 模組 | 狀態 | 關鍵事實 |
|------|------|---------|
| User Management | ✅ done | 唯一完整：列表 + CRUD + E2E（`Admin/*`、`users.py`），可當其他模組樣板 |
| Data Tables | 🟡 partial | `Common/DataTable.tsx` 是堪用泛型殼，但 columns 逐功能手刻、**完全無搜尋/篩選/排序**（後端排序寫死 `created_at desc`、前端 `limit:100` 全量抓） |
| Forms | 🟡 partial | 同一實體欄位散在 `columns / AddX / EditX` **三處**，改一欄要動三檔 → component-driven 非 config-driven |
| Dashboard | 🔴 stub | `DashboardView.tsx` 僅 33 行靜態歡迎詞 |
| Role Permission | 🔴 stub | 後端模型/選單樹完整，但 `deps.py` **只看 `is_superuser`**、選單過濾**不擋 API**、sdk 無 `RolesService`、前端無管理頁 → 有骨無肉 |
| ERP Demo | 🔴 stub | 只有 `Item(title/description)`，無主檔、無關聯式 CRUD、無狀態 |

**三支柱落地檢核**：Code-first ✅ 成立｜**Config-driven ❌ 未落地**｜**Role Permission ❌ 有模型無 enforcement**。

---

## 2. 戰略步驟

| # | 步驟 | 為什麼是這順序 |
|---|------|--------------|
| 1 | 地基可重現：5 個 seed sql 串進 `prestart.sh` | 現存 demo 資料是手動灌進 volume，`down -v` 就消失；可重現是所有對外價值的地基 |
| 2 | 用「庫存 + 客戶銷售」兩業務域當唯一展示主軸 | 一條動線貫穿三模組，且客戶域證明 config-driven 骨架能吃下第二個業務域 |
| 3 | 先補後端查詢（`q` + 單欄 sort + 真分頁） | 前端 Data Table 才有真東西可接 |
| 4 | Data Tables/Forms 收斂成 ResourceConfig，只在 demo 試點、嚴守 YAGNI | 兌現 config-driven，止步於「TS 物件 + 固定 field 型別」 |
| 5 | Role Permission 升級：API 真的擋得住 + 最小角色管理 UI | 故意排在 demo 點亮之後：先讓畫面亮，再讓權限故事可信 |
| 6 | 品牌化交付收尾 | 低工時、高觀感，放最後最划算 |

---

## 3. Demo 載體：兩業務域

### 3.1 最小資料模型

| 域 | 表 | 角色 | 關鍵欄位 |
|----|----|------|---------|
| 庫存 | `Product` | 主檔 | sku, name, category, unit, safety_stock, is_active |
| 庫存 | `Warehouse` | 主檔 | code, name, location, is_active |
| 庫存 | `Stock` | 關聯 | product_id→Product, warehouse_id→Warehouse, qty |
| 銷售 | `Customer` | 主檔 | code, name, contact, phone, tax_id（統編）, is_active |
| 銷售 | `SalesOrder` | 業務主表 | order_no, customer_id→Customer, order_date, status, total_amount, owner_id→User |
| 銷售 | `SalesOrderItem` | 明細 | order_id→SalesOrder, **product_id→Product（跨域引用庫存商品）**, qty, unit_price, subtotal |

> **跨域連結**：`SalesOrderItem.product_id → Product`。客戶下訂單 → 明細引用庫存商品，用一個外鍵把兩個業務域串起來——對製造/傳產老闆最有說服力的關聯式 demo。

### 3.2 🔴 YAGNI 紅線（不可失守，實作時對照）

| 誘惑 | 紅線 |
|------|------|
| 有金額就想加稅率/折扣/幣別 | **單一幣別 TWD、無稅率欄、`subtotal = qty × unit_price` 純展示、`total_amount` 唯讀加總、`tax_id` 只存不算** |
| status 想加「shipped 不能改」 | **`status` 是自由可改純欄位，無狀態機、無轉移守衛、無鎖定**（不可逆留未來）→ 否則就是隱形簽核 |
| 下單想「檢查庫存夠不夠」 | **下單不讀 `Stock.qty`、不校驗、不警告**，Product 下拉只取 name/sku → 否則踩進複雜商業規則 |

### 3.3 架構修正：域級授權，不抄 owner_id 列級

現有 `items.py` 用 `owner_id` 做**資料列級**隔離；但本案的權限故事是**業務域級**（sales_staff 打 `/inventory/*` 回 403）。
**新域 CRUD 不要抄 `owner_id` 列級過濾**——列表對「有權進此域的人」一律全可見，授權統一收在域級的 `require_menu` dependency。否則 W6 會發現列級與域級兩套授權心智打架。

---

## 4. 選單 / 角色（複用既有 seed，0 新建）

既有 `fakeData.sql` 已 seed 出 7 大群組、27 葉節點；`seed_roles.sql` 已 seed 11 個角色，皆冪等（`ON CONFLICT DO UPDATE`）。

| 既有節點 | 實作 | 既有角色 demo |
|---------|------|--------------|
| `inventory.products` / `inventory.warehouses` / `inventory.stock` | 庫存三表 | `warehouse_manager` 全可見 |
| `sales.customers` / `sales.orders` | 客戶 + 訂單（含明細） | `sales_manager` 全銷售 |
| 跨域 403 demo | — | **`sales_staff` 打 `/inventory/*` → 403；`warehouse_staff` 打 `/sales/*` → 403** |
| 總覽 | Dashboard | `general_manager` 跨部門唯讀 |

---

## 5. 6 週執行計畫（壓縮版）

> 壓縮取捨（相對 7 週版）：砍 `StockAdjustment`、Dashboard KPI 精簡為 1 張卡、業務 E2E 收斂為 1 條 happy path + 1 條跨角色 403。**不砍** seed→prestart 與 `require_menu`（後者是相對 tiangolo 模板的唯一硬差異化）。

| 週 | 主題 | 關鍵交付 | 驗收（Exit） | 相依 |
|----|------|---------|-------------|------|
| **W1** | 地基 + 庫存主檔 + 權限介面早定 | ① 5 個 seed sql 串進 `prestart.sh`（冪等已驗）；② `Product`/`Warehouse` model + migration + CRUD（**不抄 owner_id 列級**）；③ 放 **no-op `require_menu(menu_key)`** dependency 簽名（先只驗登入）＋定查詢契約 `{data, count}` 與共用 query helper | 全新環境 `docker compose up` 後選單樹自動出現、可登入；Product/Warehouse 於 Swagger 可建讀；後端覆蓋率 ≥90% | 無 |
| **W2** | 庫存查詢 + 種子 | ① `Stock`（product×warehouse）model + CRUD；② 列表查詢**只做** `q`(單關鍵字 ilike) + 單欄 sort + offset 真分頁；③ 庫存 demo 種子（>1 頁） | Swagger 帶 `q + sort + page` 回正確子集與 total；種子資料新環境自動出現 | W1 |
| **W3** ⚠️ | ResourceConfig 試點（夠用就好） | ① 定義 `ResourceConfig/FieldConfig` 與 `buildColumns/buildZodSchema/<ResourceForm>`，**第一版只支援 `text/number/select/date`**（relation + cell escape hatch 延 W4）；② Stock 查詢前端（toolbar 搜尋 + 篩選 + 分頁，補 `getSortedRowModel/getFilteredRowModel`）；③ **重生 sdk + `tsc` 全綠** | Product/Warehouse 改一個欄位定義只動一處；Stock 列表可 UI 搜尋/篩選/翻頁；不破壞既有 E2E | W2 |
| **W4** | 庫存點亮 + 客戶主檔（證明複用） | ① ResourceConfig 補 `relation` + cell escape hatch；② Product/Warehouse 頁用 config 套出；③ **`Customer` 主檔直接用 config 套出**（證明新業務域＝動 config）；④ Dashboard 精簡 1 張庫存 KPI 卡 | 三張頁皆共用同一 config 機制；Customer 頁可 CRUD；Dashboard 數字隨資料變動 | W3 |
| **W5** | 銷售訂單 master-detail（錢） | ① `SalesOrder` + `SalesOrderItem` model + CRUD（**嚴守 §3.2 三條紅線**）；② 訂單頭 + 明細 bespoke 頁（明細引用 Product、算 subtotal/total）；③ 重生 sdk + `tsc` | 可建立一張含多筆明細的訂單、總額正確、status 可改；明細下拉可選庫存商品 | W4 |
| **W6** | 權限可信化 + 交付收尾 | ① 把 W1 的 no-op `require_menu` **換成真檢查**（查 `view_user_visible_menu`），跨域直打回 **403** + enforcement 測試；② 最小角色/選單指派 UI（後端補 Role/RoleMenu 指派端點 + 重生 sdk）；③ 品牌化：`.env` 改 Dodo Admin 品牌與獨立密碼、關閉 `/test`、`/hello`、`signup`（**僅移除路由註冊，不動 Auth 邏輯**）；④ README 補 seed/啟動/帳號；⑤ 業務 E2E：客戶下單（含明細）+ 跨角色 403 各一條 | `sales_staff` 直打 `/inventory` 回 403；切兩個角色登入看到不同選單；照 README 從零起出品牌化可登入環境；新 E2E 在 CI 綠燈 | W5 |

---

## 6. 風險與保底

| 風險 | 保底 |
|------|------|
| **W3 過早抽象**（最高風險週）：第一次抽 config 無範本可抄、易無限打磨 | 第一版型別只 `text/number/select/date`；relation/escape hatch 等 W4 真要用再長；當週若卡，先確保 Stock 查詢頁能 demo 即過關 |
| **W6 過載**（權限 + 品牌化 + E2E 擠一週） | 優先序：require_menu 403 > 角色指派 UI > E2E > 品牌化；品牌化可滑出 demo 範圍 |
| 金額/狀態/扣庫存悄悄越界 | §3.2 三條紅線寫死，code review 對照 |
| 單兵 + 訪談吃工時 | 保 W1–W4（對外點亮）不動，W5/W6 可順延，勿在 config/權限偷工留債 |
| sdk 每次動後端 schema 要重生 | W3、W5、W6 把「重生 sdk + `tsc`」列為明確交付，每週 exit 加「`tsc` 無錯」 |

---

## 7. 明確不做（邊界）

完整 ERP/MES　·　生產排程/設備連線　·　**完整財務會計**（應收/應付/發票/收付款 finance.* 維持未來）　·　**複雜商業規則**（自動扣庫存）　·　**簽核流程**（訂單狀態機）　·　即時通知　·　**動態表單設計器**　·　複雜報表　·　多租戶　·　外部整合　·　匯入匯出　·　檔案附件　·　操作稽核。

---

## 8. 開工前檢查點

- [ ] 確認 `prestart.sh` 執行 `.sql` 的載體（在 prestart 加 `psql -f`，或 `initial_data.py` 內讀檔執行）
- [ ] 連續 `up` 兩次、`down -v` 後再 `up`，prestart 不報 duplicate key（冪等回歸）
- [ ] 確認 6 週版的取捨（砍 StockAdjustment / KPI 精簡 / E2E 收斂）可接受
- [ ] 確認簽名與檔名規範

---

*本路線圖為 Draft v1，簽名：Ryan（ryanyang0818）· 協作 Claude Opus 4.8 · 2026-06-27。*
