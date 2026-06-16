# `window.dodo.controller` 首頁區塊控制計畫

## Summary

目標是在登入後首頁版面建立統一的前端區塊命名與 Console 控制入口。
目前 `AppMenuBar`、`UserHeader` 已有各自 component；本次會補上 `sidebar` 與 `mainContent` 的對外名稱，並把控制能力集中到 `window.dodo.controller`。

## Key Changes

| 區塊 | 對外名稱 | 功能 |
|---|---|---|
| `AppMenuBar` | `appHeader` | 控制上方功能選單顯示 / 隱藏 / 切換 |
| `UserHeader` | `userHeader` | 控制上方使用者列顯示 / 隱藏 / 切換 |
| `AppSidebar` | `sidebar` | 控制側邊欄展開 / 收合 / 切換 |
| 中央內容區 | `mainContent` | 先提供識別與查詢，不提供操作功能 |

主要實作方向：

- 新增 `src/lib/dodo-controller.ts`，集中定義 `window.dodo.controller` 的型別、初始化與註冊方法。
- 調整 `HeaderVisibilityProvider`，把現有 header controls 掛到 `window.dodo.controller.appHeader` 與 `window.dodo.controller.userHeader`。
- 保留目前 `window.headerControls` 作為相容入口。
- 新增 `SidebarControllerBridge` component，在 `SidebarProvider` 內使用 `useSidebar()`，把 sidebar 現有收合邏輯註冊到 `window.dodo.controller.sidebar`。
- 在 `_layout.tsx` 中補上 `mainContent` 註冊，讓 Console 可以查詢中央內容區狀態與 DOM element。
- 為主要區塊加上穩定標記：`data-dodo-section="appHeader"`、`userHeader`、`sidebar`、`mainContent`。

## Public API

```ts
window.dodo.controller.appHeader.show()
window.dodo.controller.appHeader.hide()
window.dodo.controller.appHeader.toggle()
window.dodo.controller.appHeader.getState()

window.dodo.controller.userHeader.show()
window.dodo.controller.userHeader.hide()
window.dodo.controller.userHeader.toggle()
window.dodo.controller.userHeader.getState()

window.dodo.controller.sidebar.expand()
window.dodo.controller.sidebar.collapse()
window.dodo.controller.sidebar.toggle()
window.dodo.controller.sidebar.openMobile()
window.dodo.controller.sidebar.closeMobile()
window.dodo.controller.sidebar.getState()

window.dodo.controller.mainContent.getState()
window.dodo.controller.mainContent.getElement()
```

## Test Plan

- 啟動開發伺服器後，在 Console 驗證 `window.dodo.controller` 與各區塊 API。
- 驗證 `sidebar.toggle()` 可切換側邊欄。
- 驗證 `appHeader` / `userHeader` 可顯示、隱藏、切換。
- 驗證 `mainContent.getElement()` 可取得中央內容 DOM。
- 不執行 `npm run build`。

## Assumptions

- 「首頁」指登入後 `_layout` 提供的主版面。
- `AppMenuBar` 對外命名為 `appHeader`。
- `UserHeader` 對外命名為 `userHeader`。
- sidebar 沿用目前 `collapsible="icon"`，收合後仍保留 icon 窄欄。
- `mainContent` 目前不需要 `show()`、`hide()`、`toggle()`。
- 本次只新增控制入口與區塊命名，不調整視覺設計。
