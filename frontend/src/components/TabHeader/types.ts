// 頁籤註冊表的 key，例如 "dashboard" | "items"；對應 tabRegistry 的索引
export type TabKey = string

// 頁籤實例：只持有識別資訊；title/icon/component 一律在 render 時由 tabRegistry[key] 取得
// 不把 title/icon 存進來，是為了讓持久化只需序列化純資料 {id,key}，不碰 React 元件
export type TabItem = {
  id: string
  key: TabKey
}
