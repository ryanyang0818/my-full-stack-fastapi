# Footer 滑鼠喚回顯示計畫

## Summary

讓 `AppFooter` 預設顯示，並支援隱藏後比照 `AppMenuBar` 用滑鼠喚回：

| 狀態 | 行為 |
|---|---|
| 預設 | footer 顯示 |
| 滑鼠碰到畫面底部感應區 | footer 自動顯示 |
| 滑鼠離開 footer | footer 延遲自動隱藏 |
| Console 呼叫 `show()` | footer 固定顯示 |
| Console 呼叫 `hide()` | footer 隱藏，但仍可被滑鼠喚回 |

## Key Changes

| 檔案 | 調整 |
|---|---|
| `src/components/Footer/AppFooter.tsx` | 加入 hover reveal / delayed hide 邏輯 |
| `src/lib/dodo-controller.ts` | 擴充 `footer` controller：`show()`、`hide()`、`toggle()`、`getState()`、`getElement()` |
| `src/routes/_layout.tsx` | 依 footer 顯示狀態動態保留底部高度 |
| `src/components/Sidebar/AppSidebar.tsx` | 沿用 `--app-footer-layout-height`，避免 footer 顯示時遮住 sidebar |
| `tests/dodo-controller.spec.ts` | 只依簡化後的測試方向更新必要斷言 |

## Implementation Design

新增 footer 兩種顯示狀態：

| 狀態 | 說明 |
|---|---|
| `footerVisible` | Console 控制的固定顯示狀態 |
| `temporarilyVisible` | 滑鼠碰到底部感應區後的暫時顯示狀態 |

實際顯示判斷：

```ts
const visible = footerVisible || temporarilyVisible
```

底部高度改成動態：

```ts
const footerLayoutHeight = footerVisible || temporarilyVisible
  ? "var(--app-footer-height)"
  : "0rem"
```

layout 使用：

```ts
"--app-footer-layout-height": footerLayoutHeight
```

sidebar 高度扣這個值，footer 隱藏時 sidebar 用滿高度；footer 顯示時 sidebar 自動讓出空間。

## Public API

```ts
window.dodo.controller.footer.show()
window.dodo.controller.footer.hide()
window.dodo.controller.footer.toggle()
window.dodo.controller.footer.getState()
window.dodo.controller.footer.getElement()
```

`getState()` 會多回傳：

```ts
{
  visible: boolean,
  temporarilyVisible: boolean
}
```

## UX Notes

| 項目 | 設定 |
|---|---|
| 底部感應區 | `fixed bottom-0 inset-x-0 h-1` |
| 顯示延遲 | `200ms` |
| 隱藏延遲 | `400ms` |
| 動畫 | 使用 Tailwind `animate-in slide-in-from-bottom` |
| 視覺 | 不改目前 footer 內容與配色 |

## Test Plan

此階段不設計測試情境、不執行測試。進入測試階段時，再由使用者指定如何驗證與是否新增 Playwright 情境。

## Assumptions

- footer 預設顯示，但不是移除 hover 喚回能力。
- footer 被滑鼠暫時叫出時，也不能遮住 sidebar。
- `show()` 是固定顯示；滑鼠離開不會自動隱藏。
- `hide()` 後仍可透過底部 hover 暫時顯示。
- 本次只提出並保存計畫，不修改功能檔案。
