# Dodo Admin 系統架構

本文件不是技術清單。

技術清單已放在：

```text
docs/B-engineering-工程文件/01-Tech-Stack-技術棧.md
```

本文件要回答的是：

> Dodo Admin 裡面的各個角色如何分工，
> 使用者操作、權限、資料與畫面如何流動？

## 閱讀索引

| 區塊 | 重點 |
|---|---|
| 架構總覽 | Browser → Frontend → API Client → Backend → Database |
| 主要角色 | Sidebar、Tab Workspace、API Routes、CRUD、Models 等責任 |
| 使用者進入系統 | Login → token → Authenticated Layout |
| 登入後版面 | Header、Sidebar、TabHeader、TabPageHost、Footer |
| 側邊選單與頁籤 | Sidebar 如何開啟 tab 工作區 |
| API 契約流 | Backend Routes → OpenAPI → Frontend Client |
| 後端請求流 | Route → deps → CRUD → Model → DB |
| 權限流 | `role_menu`、`user_menu_override`、可見選單 |
| CRUD 模組流 | 從資料表到前端畫面的完整鏈路 |
| Master-Detail | 後續要做的核心元件預期結構 |
| 部署角色 | Traefik、frontend、backend、PostgreSQL |
| AI 協作邊界 | AI 新增功能時應檢查的完整鏈路 |

## 架構總覽

Dodo Admin 是一個 full-stack admin foundation。

它的核心不是單一頁面，
而是一套可以持續加入管理模組的後台骨架。

```text
┌─────────────────────────────────────────────────────────────┐
│                        使用者 Browser                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│                                                             │
│  Login / Auth Guard                                          │
│        ↓                                                     │
│  Authenticated Layout                                        │
│        ↓                                                     │
│  Header + Sidebar + Tab Workspace                            │
│        ↓                                                     │
│  Feature Components                                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Generated API Client                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                        │
│                                                             │
│  API Routes → Dependencies → CRUD / Domain Logic             │
│                         ↓                                   │
│                   Models / Schemas                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         PostgreSQL                           │
└─────────────────────────────────────────────────────────────┘
```

## 主要角色

| 角色 | 所在位置 | 責任 |
|---|---|---|
| 使用者 | Browser | 登入、瀏覽選單、操作資料 |
| 登入頁 | `frontend/src/routes/login.tsx` | 收集帳密並取得 token |
| 主版面 | `frontend/src/routes/_layout.tsx` | 登入後的整體布局 |
| 側邊選單 | `frontend/src/components/Sidebar/` | 顯示可用功能與開啟工作區 |
| 頁籤工作區 | `frontend/src/components/TabHeader/` | 管理多個工作頁面 |
| 功能元件 | `frontend/src/components/*/` | 實際資料表、表單、操作畫面 |
| API Client | `frontend/src/client/` | 讓前端用固定方式呼叫後端 |
| API Routes | `backend/app/api/routes/` | 對外提供功能端點 |
| Dependencies | `backend/app/api/deps.py` | 注入目前使用者、資料庫與權限檢查 |
| CRUD 層 | `backend/app/crud/` | 集中處理資料讀寫 |
| Models | `backend/app/models.py` | 定義資料結構與資料表關係 |
| Database | `PostgreSQL` | 保存使用者、角色、選單與業務資料 |

## 使用者進入系統

使用者不是直接看到功能。

系統會先判斷登入狀態，
再決定是否進入管理後台。

```text
User
  │
  ▼
Login Page
  │
  ├─ 帳密錯誤 → 顯示錯誤
  │
  └─ 帳密正確
        │
        ▼
    Backend Login API
        │
        ▼
    JWT access token
        │
        ▼
    localStorage
        │
        ▼
Authenticated Layout
```

登入後，前端會把 token 帶到後續 API 請求中。

```text
Frontend API Request
  │
  ▼
Authorization: Bearer <token>
  │
  ▼
Backend verify token
  │
  ▼
Current User
```

## 登入後版面

登入後不是單純顯示某一頁，
而是進入一個可持續工作的後台桌面。

```text
┌─────────────────────────────────────────────────────────────┐
│ Header / Menu Bar                                            │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Tab Header                                   │
│               ├─────────────────────────────────────────────┤
│ Menu Tree     │ Tab Page Host                                │
│ Search        │                                             │
│ User Area     │   Dashboard / Items / Admin / Settings ...   │
│               │                                             │
├───────────────┴─────────────────────────────────────────────┤
│ Footer / Status Area                                         │
└─────────────────────────────────────────────────────────────┘
```

這個版面有幾個重要分工：

| 區塊 | 責任 |
|---|---|
| `Header` | 放置全域選單與操作入口 |
| `Sidebar` | 呈現功能選單與功能入口 |
| `TabHeader` | 顯示已開啟的工作頁籤 |
| `TabPageHost` | 渲染目前 active 的頁籤內容 |
| `Footer` | 放置系統狀態或輔助資訊 |

## 側邊選單與頁籤工作區

Dodo Admin 的前端工作區重點是：

> 選單負責開啟功能，
> 頁籤負責承載工作狀態。

```text
Sidebar Menu Item
  │
  ▼
tabKeyMap
  │
  ▼
openTab(key)
  │
  ▼
tabStore
  │
  ├─ tabs
  ├─ activeId
  └─ close / activate / reorder
        │
        ▼
TabHeaderController
        │
        ├─ TabHeader
        └─ TabPageHost
              │
              ▼
          tabRegistry[key].component
```

這代表功能畫面不一定只由 URL 決定。

對後台系統來說，
同一種功能可能需要多開、切換、關閉，
因此頁籤工作區會成為重要架構角色。

## API 契約流

前後端之間不應各自猜測 API 格式。

Dodo Admin 使用 OpenAPI 作為中介契約。

```text
Backend Routes
  │
  ▼
OpenAPI Schema
  │
  ▼
Generated Frontend Client
  │
  ▼
Frontend Components
```

這條流的重點是：

| 角色 | 責任 |
|---|---|
| 後端 | 定義 API、request、response |
| OpenAPI | 輸出前後端共同契約 |
| 前端 client | 用產生後的型別與方法呼叫 API |
| 功能元件 | 不直接手刻底層 request |

## 後端請求流

後端接到 API 請求後，
不是直接操作資料庫。

它會先經過路由、依賴注入、權限判斷，
再進入資料操作層。

```text
HTTP Request
  │
  ▼
API Route
  │
  ▼
deps.py
  │
  ├─ get db session
  ├─ get current user
  └─ check permission
        │
        ▼
CRUD Function
        │
        ▼
Model / Query
        │
        ▼
PostgreSQL
```

目前後端已具備的主要 route 類型：

| Route | 責任 |
|---|---|
| `login.py` | 登入與 token |
| `users.py` | 使用者管理 |
| `items.py` | Items CRUD |
| `menus.py` | 選單與可見選單樹 |
| `utils.py` | 工具與健康檢查 |
| `private.py` | 私有測試或受保護 API |

## 權限流

權限不是只在前端藏選單。

正確架構應該是：

1. 前端根據後端回傳結果顯示選單
2. 後端仍然負責最終權限檢查
3. 資料庫保存角色、選單與個別覆寫

```text
User
  │
  ▼
Role Assignment
  │
  ▼
role_menu
  │
  ├─────────────┐
  │             ▼
  │       user_menu_override
  │             │
  └─────────────┘
        │
        ▼
Visible Menu View
        │
        ▼
Backend /menus/tree
        │
        ▼
Frontend Sidebar
```

權限相關角色：

| 角色 | 責任 |
|---|---|
| `role_menu` | 定義角色能看到哪些選單 |
| `user_menu_override` | 針對單一使用者覆寫選單權限 |
| menu tree API | 回傳使用者最終可見選單 |
| Sidebar | 只呈現後端允許的選單 |
| backend deps | 保護真正需要權限的 API |

## CRUD 模組流

CRUD 是 Dodo Admin 接下來要擴充的核心能力。

一個完整 CRUD 不只是資料表畫面，
而是前後端多個角色一起運作。

```text
Database Table
  │
  ▼
Backend Model
  │
  ▼
CRUD Functions
  │
  ▼
API Routes
  │
  ▼
OpenAPI Schema
  │
  ▼
Generated Client
  │
  ▼
Frontend View
  │
  ├─ DataTable
  ├─ Add Dialog / Side Panel
  ├─ Edit Form
  └─ Delete Confirm
```

一個 CRUD 模組至少需要回答：

| 問題 | 說明 |
|---|---|
| 資料表是什麼 | 對應哪個 model 與資料表 |
| API 是什麼 | list / read / create / update / delete |
| 前端入口在哪 | route、sidebar、tabRegistry |
| 權限如何控管 | 哪個 menu key 或角色可操作 |
| 測試如何覆蓋 | backend tests 與 Playwright flow |

## Master-Detail 預期架構

Master-Detail 是接下來的重要元件方向。

它會比一般 CRUD 更複雜，
因為它需要同時管理列表、細節與關聯資料。

```text
Master List
  │
  ├─ select row
  │     │
  │     ▼
  │  Detail Panel
  │     │
  │     ├─ Header
  │     ├─ Form
  │     ├─ Related Tabs
  │     └─ Actions
  │
  └─ filter / search / pagination
```

後續設計時，應該把它視為一種可重複使用的工作模式：

| 區塊 | 責任 |
|---|---|
| Master | 列表、查詢、篩選、排序 |
| Detail | 單筆資料、表單、狀態 |
| Related | 明細、附件、歷程或子資料 |
| Actions | 儲存、刪除、核准、切換狀態 |

## 部署角色

部署時，系統由容器服務共同組成。

```text
Internet
  │
  ▼
Traefik
  │
  ├─ dashboard.<domain> → frontend
  ├─ api.<domain>       → backend
  └─ adminer.<domain>   → adminer
        │
        ▼
PostgreSQL
```

本機開發則多了開發輔助服務：

```text
Local Developer
  │
  ▼
Docker Compose
  │
  ├─ proxy
  ├─ frontend
  ├─ backend
  ├─ db
  ├─ adminer
  ├─ mailcatcher
  └─ playwright
```

## AI agent 協作邊界

Dodo Admin 希望 AI agent 可以穩定協作。

所以架構文件需要讓 AI 知道：

| 問題 | AI 應該看哪裡 |
|---|---|
| 專案用了什麼技術 | `01-tech-stack-技術棧` |
| 系統怎麼運作 | 本文件 |
| 新功能怎麼開發 | `03-development-開發流程` |
| 權限怎麼判斷 | 營運文件的權限說明與後端權限實作 |
| CRUD 怎麼複製 | 後續 CRUD 專門文件 |
| Master-Detail 怎麼設計 | 後續 Master-Detail 專門文件 |

對 AI 來說，最重要的是不要只改畫面。

新增功能時應該同時檢查：

```text
Model
  ↓
CRUD
  ↓
Route
  ↓
OpenAPI Client
  ↓
Frontend Component
  ↓
Sidebar / Tab Registry
  ↓
Permission
  ↓
Tests
```

## 後續可轉成圖片的架構圖

目前最適合轉成 PNG 的 ASCII 圖有三張：

| 圖名 | 用途 |
|---|---|
| 系統總覽圖 | 說明 Browser → Frontend → API → Backend → DB |
| 權限流圖 | 說明 role_menu、user_menu_override 與 Sidebar |
| CRUD 模組流圖 | 說明從資料表到前端畫面的完整鏈路 |

建議之後圖片化時，不要做成過度裝飾的圖。

最適合的風格是：

- 黑白或淺灰為主
- 用少量藍色標示資料流
- 每張圖只回答一個問題
- 圖上文字保持短句
- 圖下再用 Markdown 補充說明
