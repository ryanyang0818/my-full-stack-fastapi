import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/test-tab")({
  component: TestTab,
  head: () => ({
    meta: [
      {
        title: "TestTab - DoDo ERP",
      },
    ],
  }),
})

// TestTab 頁面（測試用）
function TestTab() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">TestTab</h1>
      <p className="text-muted-foreground">這是 TestTab 頁面的測試內容。</p>
    </div>
  )
}
