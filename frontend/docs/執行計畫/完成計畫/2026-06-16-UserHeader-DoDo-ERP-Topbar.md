# UserHeader 改成 DoDo ERP Topbar

## Summary

把 `UserHeader` 改成來源定版 `.topbar` 的 React / Tailwind 版本，先做外觀，不串搜尋、通知、訊息、設定資料。

## Key Changes

- `UserHeader.tsx` 改成單條 ERP topbar：
  - 左側：`D` logo、`DoDo ERP`、`PROD · v4.2.1`
  - 中段：`採購 / 銷售 / 庫存 / 財務 / 人資 / 製造 / 報表`
  - 右側：搜尋框、`Ctrl+K`、通知 badge、訊息 badge、設定 icon、使用者 chip
- 使用 `lucide-react` icon 取代來源 HTML 的 SVG sprite。
- 保留 `if (!userHeaderVisible) return null`。
- 使用目前登入者資料：
  - 名稱：`user.full_name || user.email || 'User'`
  - 角色：`user.is_superuser ? 'Superuser' : 'User'`
- `_layout.tsx` 將 `--user-header-height` 從 `3.5rem` 改成 `3rem`，對齊來源 `48px`。
- `AppMenuBar` 暫不改；它仍代表來源設計裡的另一條 `menubar`。

## Acceptance Criteria

- Header 高度約 `48px`。
- 品牌、tabs、搜尋、icons、user chip 排列接近來源截圖。
- 長使用者名稱不撐破版面。
- 小螢幕不出現水平 overflow。

## Assumptions

- 這次只做外觀。
- 目標是來源檔 `.topbar`，不是 `.menubar`。
- 不新增後端欄位，所以不硬寫「採購部 · 主管」。

