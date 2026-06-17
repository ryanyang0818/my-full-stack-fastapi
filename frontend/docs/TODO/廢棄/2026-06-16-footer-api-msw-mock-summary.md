# Footer API Mock with MSW TODO 摘要

## 改了什麼

- 安裝 `msw`，並讓 `package.json` 新增 `msw.workerDirectory` 設定。
- 初始化 `public/mockServiceWorker.js`。
- 新增 `src/api/footer.ts`，作為 footer 的臨時手寫 API layer。
- 新增 `src/mocks/handlers.ts`，攔截 `GET /api/v1/footer/status`。
- 新增 `src/mocks/browser.ts`，建立瀏覽器端 MSW worker。
- 修改 `src/main.tsx`，在 dev 模式先啟動 MSW，再 render React app。
- 修改 `src/components/Footer/AppFooter.tsx`，將 footer 資料來源改為 `getFooterStatus()`。
- 修改 `src/lib/dodo-controller.ts`，讓 footer state 型別支援 API 回傳的 `string` / `number`。

## 驗證結果

- 手動開啟瀏覽器 Network 檢查。
- 已看到 `GET /api/v1/footer/status` 對應的 `status` request。
- 該 request 狀態為 `200`。
- Network 顯示由 `mockServiceWorker.js` / `ServiceWorker` 處理。
- 這代表 MSW 已成功攔截 footer API request。

## 未完成或未驗證

- 尚未決定這段是否要 Git commit。
- 尚未執行 Playwright 測試。
- 尚未把 `docs/執行計畫/2026-06-16-footer-api-msw-mock.md` 歸檔。
- 尚未確認 `../bun.lock` 是否要納入 commit。
- 尚未正式檢查 formatter 是否會調整單引號 / 雙引號。

## 後續 TODO

- 決定是否 commit 這段 MSW footer mock 變更。
- 若要 commit，先確認要包含哪些檔案：
  - `package.json`
  - `../bun.lock`
  - `public/mockServiceWorker.js`
  - `src/api/footer.ts`
  - `src/mocks/handlers.ts`
  - `src/mocks/browser.ts`
  - `src/main.tsx`
  - `src/components/Footer/AppFooter.tsx`
  - `src/lib/dodo-controller.ts`
  - `docs/執行計畫/2026-06-16-footer-api-msw-mock.md`
- 決定是否要進入測試階段。
- 若進入測試階段，再確認是否新增 Playwright 測試情境。
