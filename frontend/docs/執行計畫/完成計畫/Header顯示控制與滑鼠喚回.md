# Header 顯示控制與滑鼠喚回執行計畫

## 計畫內容

- 建立 `HeaderVisibilityProvider` 管理 `AppMenuBar` 與 `UserHeader` 的顯示狀態。
- React 元件透過 `useHeaderVisibility()` 控制 Header。
- 外部 JavaScript 與瀏覽器 Console 透過 `window.headerControls` 控制 Header。
- Header 隱藏後，同步調整 Layout 上方間距與 Sidebar 起點，不保留空白。
- `AppMenuBar` 預設為隱藏狀態。
- `AppMenuBar` 隱藏後保留畫面頂端透明感應區。
- 滑鼠碰到頂端時，AppMenuBar 以浮動覆蓋方式暫時顯示。
- 滑鼠離開後延遲 `1000ms` 收起，避免快速移動造成閃爍。
- 透過 `showAppMenu()` 顯示時，AppMenuBar 維持固定顯示，直到執行隱藏或切換指令。
- `UserHeader` 隱藏後只透過 JavaScript 或 React API 恢復。
- 重新整理後，`AppMenuBar` 恢復隱藏，`UserHeader` 恢復顯示，不使用 `localStorage`。

## 手動修改程式

本次程式修改由開發者手動執行，Codex 只更新計畫文件。

修改 `src/components/Header/header-visibility.tsx`：

```tsx
// 修改前
const [appMenuVisible, setAppMenuVisible] = useState(true)

// 修改後
const [appMenuVisible, setAppMenuVisible] = useState(false)
```

不需要修改 `AppMenuBar.tsx`。目前的 `temporarilyVisible`、`scheduleHide()` 與
`onMouseLeave={scheduleHide}` 已經負責滑鼠離開後延遲 `1000ms` 自動隱藏。

## JavaScript API

```ts
window.headerControls?.hideAppMenu()
window.headerControls?.showAppMenu()
window.headerControls?.toggleAppMenu()
window.headerControls?.hideUserHeader()
window.headerControls?.showUserHeader()
window.headerControls?.toggleUserHeader()
window.headerControls?.hideAll()
window.headerControls?.showAll()
window.headerControls?.getState()
```

| 指令 | 中文說明 |
|---|---|
| `hideAppMenu()` | 隱藏 `AppMenuBar` |
| `showAppMenu()` | 顯示 `AppMenuBar` |
| `toggleAppMenu()` | 切換 `AppMenuBar` 顯示狀態 |
| `hideUserHeader()` | 隱藏 `UserHeader` |
| `showUserHeader()` | 顯示 `UserHeader` |
| `toggleUserHeader()` | 切換 `UserHeader` 顯示狀態 |
| `hideAll()` | 隱藏兩個 Header |
| `showAll()` | 顯示兩個 Header |
| `getState()` | 取得目前兩個 Header 的顯示狀態 |

## 預計影響檔案

- 新增 `docs/執行計畫/Header顯示控制與滑鼠喚回.md`
- 新增 `src/components/Header/header-visibility.tsx`
- 修改 `src/components/Header/AppMenuBar.tsx`
- 修改 `src/components/Header/UserHeader.tsx`
- 修改 `src/routes/_layout.tsx`
- 修改 `src/components/Sidebar/AppSidebar.tsx`

## 使用技術棧

- React Context
- React Hooks
- TypeScript 全域 Window 型別擴充
- Tailwind CSS 4
- CSS Variables

## 驗證方式

- 執行 `bun run build`。
- 重新整理頁面，確認 `AppMenuBar` 預設隱藏。
- 測試所有 `window.headerControls` 方法與 `getState()`。
- 驗證 Header 隱藏後 Layout 與 Sidebar 不留空白。
- 驗證頂端 hover 喚回與 `1000ms` 延遲收起。
- 執行 `showAppMenu()`，確認 AppMenuBar 可切換為固定顯示。
- 驗證浮動 AppMenuBar 不推動頁面。
- 驗證手機版、桌面版與亮暗主題。
