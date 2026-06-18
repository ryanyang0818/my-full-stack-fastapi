# DoDo ERP 品牌替換計畫

## 目標

- 將使用者可見的 `FastAPI Template` / `Full Stack FastAPI` 品牌移除。
- 統一改成 `DoDo ERP`。
- 產出 `A / B / D` 三組 Logo SVG 初稿，先接入 `B：科技系統感` 版本。

## 已確認決策

| 項目 | 決策 |
|---|---|
| 品牌名稱 | `DoDo ERP` |
| Route title 格式 | `Page - DoDo ERP` |
| Footer 文字 | `DoDo ERP - 2026` |
| Footer 社群連結 | 暫時保留 FastAPI 連結，不加註解 |
| Logo 方向 | 產出 `A / B / D` 三組，避免親和產品感 |
| 主色 | 深藍 + 淺灰 |
| 正式接入 | 先接 `B：科技系統感` |
| Logo 規格 | `dodo-logo.svg`、`dodo-logo-light.svg`、`dodo-icon.svg`、`dodo-icon-light.svg` |
| 舊 FastAPI SVG | 刪除 |
| README | 不改 |
| 模板來源文件 | 保留 |
| 文件型目錄說明 | 同步更新 |
| UI 英文化文案 | 不處理 |
| 驗證 | 只用 `rg` 複查殘留字串 |

## 預計修改檔案

| 檔案 | 修改內容 |
|---|---|
| `index.html` | `<title>` 改成 `DoDo ERP` |
| `src/routes/login.tsx` | title 改成 `Log In - DoDo ERP` |
| `src/routes/signup.tsx` | title 改成 `Sign Up - DoDo ERP` |
| `src/routes/recover-password.tsx` | title 改成 `Recover Password - DoDo ERP` |
| `src/routes/reset-password.tsx` | title 改成 `Reset Password - DoDo ERP` |
| `src/routes/_layout/index.tsx` | title 改成 `Dashboard - DoDo ERP` |
| `src/routes/_layout/items.tsx` | title 改成 `Items - DoDo ERP` |
| `src/routes/_layout/admin.tsx` | title 改成 `Admin - DoDo ERP` |
| `src/routes/_layout/settings.tsx` | title 改成 `Settings - DoDo ERP` |
| `src/components/Common/Footer.tsx` | Footer 文字改成 `DoDo ERP - {currentYear}` |
| `src/components/Common/Logo.tsx` | 改引用新的 `dodo-*` SVG，`alt` 改成 `DoDo ERP` |
| `public/assets/images/logo-concepts/` | 新增三組 Logo 概念 SVG |
| `public/assets/images/dodo-*.svg` | 新增正式接入用 Logo / Icon |
| `public/assets/images/fastapi-*.svg` | 刪除舊 FastAPI Logo / Icon |
| `src/components/Common/docs/目錄說明.md` | 更新 Logo / Footer 說明 |
| `src/routes/docs/目錄說明.md` | 更新 route title 範例 |

## 不修改範圍

| 不改項目 | 原因 |
|---|---|
| `README.md` | 使用者已選擇保留 |
| `docs/專案介紹.md` | 保留模板來源紀錄 |
| `docs/技術棧.txt` 的 `FastAPI` | 這是後端技術棧，不是模板品牌 |
| 登入 / 註冊頁面英文 UI 文案 | 本次只處理品牌字樣 |
| Footer FastAPI 社群連結 | 使用者選擇暫時保留 |

## 執行步驟

1. 新增三組 Logo 概念 SVG 到 `public/assets/images/logo-concepts/`。
2. 將 `B：科技系統感` 複製成正式檔：
   - `dodo-logo.svg`
   - `dodo-logo-light.svg`
   - `dodo-icon.svg`
   - `dodo-icon-light.svg`
3. 修改 `Logo.tsx`，改接 `dodo-*` 圖檔。
4. 修改所有 route meta title。
5. 修改 `index.html` 與 `Footer.tsx`。
6. 刪除舊的 `fastapi-*` SVG。
7. 更新指定的 docs 說明檔。
8. 用 `rg` 檢查是否仍有不該出現的 FastAPI 品牌資產引用。

## 驗證方式

```bash
rg -n -i "FastAPI Template|Full Stack FastAPI|fastapi-logo|fastapi-icon" .
```

## 預期驗證結果

- 不應再出現 route title、Footer、Logo import、FastAPI logo 檔名引用。
- 文件中若出現 `FastAPI`，只允許是技術棧或模板來源脈絡。
