# AI-Model: Codex GPT-5

# Dodo-Admin-ChangeName Skill 撰寫計畫

## 目標

建立一個個人 Codex Skill：`Dodo-Admin-ChangeName`，協助後續前端產品更名工作。

此 Skill 不是直接替專案改名，而是提供一套固定流程：

1. 先全域掃描 `frontend/` 內的舊名稱。
2. 再整理修改後內容與疑似漏網項目。
3. 最後針對既定高風險清單逐一二次排查。

## Skill 名稱與位置

| 項目 | 決定 |
|---|---|
| 使用者稱呼 | `Dodo-Admin-ChangeName` |
| Skill folder name | `dodo-admin-change-name` |
| 建議位置 | `C:\Users\sheep\.codex\skills\dodo-admin-change-name` |
| 原因 | 這是跨任務可重複使用的個人 Skill，放在全域 Codex skills 較適合 |

## 預計結構

```text
C:\Users\sheep\.codex\skills\dodo-admin-change-name\
├── SKILL.md
├── references\
│   └── rename-dblcheck-targets.md
└── scripts\
    └── scan_brand_names.py
```

## 核心執行順序

| 順序 | 階段 | 說明 |
|---:|---|---|
| 1 | 全域掃描 | 針對 `frontend/` 內現有舊名稱進行掃描 |
| 2 | 批次改名 | 將可見產品名稱統一改成新名稱 |
| 3 | 全面排查 | 用 AI 與文字檔爬梳方式整理修改後內容 |
| 4 | 針對性檢查 | 依 `rename-dblcheck-targets.md` 逐項排查 |
| 5 | 回報 | 列出已改、未改、刻意排除與需要人工確認的項目 |

## 預設排除規則

| 排除項目 | 原因 |
|---|---|
| `frontend/docs/執行計畫/**` | 歷史計畫紀錄，不作為更名維護範圍 |
| `frontend/docs/TODO/廢棄/**` | 廢棄資料不維護品牌一致性 |
| 內部 namespace | 預設不改，避免影響過大 |
| 歷史刪除資產 | 不納入現行檢查 |

內部 namespace 包含但不限於：

- `window.dodo`
- `dodo.controller`
- `data-dodo-section`
- `dodo.tabs.v2`

## 二次排查清單

`references/rename-dblcheck-targets.md` 預計記錄這些高風險檔案：

| 類型 | 檔案 |
|---|---|
| HTML title / favicon | `frontend/index.html` |
| Header 品牌 | `frontend/src/components/Header/UserHeader.tsx` |
| App menu 文案 | `frontend/src/components/Header/AppMenuBar.tsx` |
| Logo alt / import | `frontend/src/components/Common/Logo.tsx` |
| Footer 文字 | `frontend/src/components/Common/Footer.tsx` |
| Route title | `frontend/src/routes/login.tsx` |
| Route title | `frontend/src/routes/signup.tsx` |
| Route title | `frontend/src/routes/recover-password.tsx` |
| Route title | `frontend/src/routes/reset-password.tsx` |
| Route title | `frontend/src/routes/_layout/index.tsx` |
| Route title | `frontend/src/routes/_layout/admin.tsx` |
| Route title | `frontend/src/routes/_layout/settings.tsx` |
| Route title | `frontend/src/routes/_layout/test-tab.tsx` |
| Route title | `frontend/src/routes/_layout/test-tab2.tsx` |
| 測試斷言 | `frontend/tests/header-visibility.spec.ts` |
| Logo asset | `frontend/public/assets/images/dodo-logo.svg` |
| Logo asset | `frontend/public/assets/images/dodo-logo-light.svg` |
| Icon asset | `frontend/public/assets/images/dodo-icon.svg` |
| Icon asset | `frontend/public/assets/images/dodo-icon-light.svg` |
| Favicon | `frontend/public/assets/images/favicon.png` |
| Logo concept | `frontend/public/assets/images/logo-concepts/dodo-concept-a-enterprise.svg` |
| Logo concept | `frontend/public/assets/images/logo-concepts/dodo-concept-b-system.svg` |
| Logo concept | `frontend/public/assets/images/logo-concepts/dodo-concept-d-business.svg` |
| Common docs | `frontend/src/components/Common/docs/目錄說明.md` |
| Route docs | `frontend/src/routes/docs/目錄說明.md` |
| 畫面區塊 docs | `frontend/docs/畫面區塊介紹.md` |

## 預計任務

- [ ] 建立 `dodo-admin-change-name` Skill 骨架。
- [ ] 撰寫 `SKILL.md`，明確定義觸發時機、流程與排除規則。
- [ ] 建立 `references/rename-dblcheck-targets.md`，保存二次排查清單。
- [ ] 建立掃描腳本 `scripts/scan_brand_names.py`，支援 dry-run 掃描。
- [ ] 讓掃描結果區分「可改」、「疑似 namespace」、「排除範圍」。
- [ ] 使用 `quick_validate.py` 驗證 Skill 格式。

## 驗收項目

- [ ] Skill folder 使用 `dodo-admin-change-name`。
- [ ] `SKILL.md` frontmatter 只包含 `name` 與 `description`。
- [ ] `SKILL.md` 明確寫出三階段執行順序。
- [ ] `rename-dblcheck-targets.md` 包含排除後的二次排查清單。
- [ ] 掃描腳本預設不修改檔案，只輸出 dry-run 報告。
- [ ] 掃描腳本預設排除 `frontend/docs/執行計畫/**` 與廢棄資料夾。
- [ ] 掃描腳本能辨識 namespace 命中並標示為「不建議自動改」。
- [ ] Skill 通過 `quick_validate.py`。

## 邊界

| 不做 | 說明 |
|---|---|
| 不直接執行專案更名 | 本計畫只建立 Skill |
| 不改 `window.dodo` namespace | 除非使用者明確要求 |
| 不改 `dodo.tabs.v2` storage key | 避免破壞既有使用者狀態 |
| 不處理歷史刪除資產 | 只處理現行存在資產 |
| 不測試專案功能 | 存入計畫階段不執行測試 |

## 完成後下一步

完成 Skill 後，再用 dry-run 案例驗證：

| 舊名稱 | 新名稱 |
|---|---|
| `DoDo ERP` | `Dudu Admin` |

驗證重點是掃描報告與二次排查清單是否完整，不在此階段改專案品牌。
