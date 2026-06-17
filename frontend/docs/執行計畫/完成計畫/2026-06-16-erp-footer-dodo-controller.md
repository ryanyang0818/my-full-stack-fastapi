# ERP Footer 與 `window.dodo.controller.footer` 計畫

## Summary

在登入後首頁版面新增一條 ERP 風格底部狀態列，內容只包含截圖紅框內資訊：左側連線 / DB / 公司 / 會計年度，右側語言 / 使用者 / 時間。

此 Footer 只套用在登入後 `_layout`，不影響登入、註冊、忘記密碼等 `AuthLayout` 頁面。並將 footer 註冊到 `window.dodo.controller.footer`，可在 Console 查詢狀態與 DOM。

## Key Changes

| 區塊 | 對外名稱 | 功能 |
|---|---|---|
| 登入後底部狀態列 | `footer` | 顯示 ERP 狀態資訊，提供 `getState()`、`getElement()` |
| 左側資訊 | `connection/database/company/fiscalYear` | 依截圖顯示「已連線、DB、公司、會計年度」 |
| 右側資訊 | `language/user/time` | 依截圖顯示「繁體中文、使用者、目前時間」 |

主要實作方向：

- 新增登入後專用 component：`src/components/Footer/AppFooter.tsx`。
- `_layout.tsx` 改用 `AppFooter`，避免修改 `Common/Footer.tsx` 後影響登入頁。
- `AppFooter` 加上 `data-dodo-section="footer"`。
- 擴充 `src/lib/dodo-controller.ts`：
  - 新增 `footer` 到 `DodoSectionName` 與 `DodoController`。
  - 新增 `DodoFooterController` 與 `DodoFooterState`。
- `AppFooter` 透過 `registerDodoControllerSection('footer', controller)` 註冊到 `window.dodo.controller.footer`。
- Footer 內容先使用前端固定資料與目前登入使用者：
  - `已連線`
  - `DB: PROD-TPE-01`
  - `公司: DoDo 台北總公司`
  - `會計年度: 2026`
  - `繁體中文`
  - 使用者名稱取 `useAuth().user.full_name || user.email`
  - 時間用瀏覽器目前時間格式化為 `YYYY/MM/DD HH:mm:ss`

## Public API

Console 預期可用：

```ts
window.dodo.controller.footer.getState()
window.dodo.controller.footer.getElement()
```

`footer.getState()` 回傳：

```ts
{
  name: 'footer',
  mounted: true,
  connectionStatus: '已連線',
  database: 'PROD-TPE-01',
  company: 'DoDo 台北總公司',
  fiscalYear: 2026,
  language: '繁體中文',
  userName: '王志明',
  currentTime: '2026/06/16 14:57:41'
}
```

## Test Plan

- 啟動開發伺服器後，在登入後首頁目視驗證 footer 只顯示截圖紅框內容。
- 在 Console 驗證：
  - `window.dodo.controller.footer` 存在。
  - `window.dodo.controller.footer.getState()` 回傳 footer 狀態。
  - `window.dodo.controller.footer.getElement()` 取得 `data-dodo-section="footer"` 的 DOM。
- 新增 / 更新 Playwright 測試：
  - 驗證 footer 文字出現在登入後首頁。
  - 驗證 `window.dodo.controller.footer.getState()`。
- 不執行 `npm run build`。

## Assumptions

- 此 footer 是登入後主版面專用，不取代登入頁使用的 `Common/Footer`。
- 這次只做截圖紅框內容，不做中央「已選取 / 總筆數」區塊。
- DB、公司、會計年度、語言先用前端固定值；未來若有後端設定 API 再改成動態資料。
- footer 目前只需要查詢能力，不需要 `show()`、`hide()`、`toggle()`。
- 視覺風格採用淺色、低高度、單行狀態列，沿用 Tailwind，不新增 UI library。
