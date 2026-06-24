import { expect, test, type Page } from "@playwright/test"

const TAB_STORAGE_KEY = "dodo.tabs.v2"
const MAX_TABS = 20

// 取得正式 Tab Header 的 Radix viewport，避免抓到 Sidebar 按鈕
function getTabViewport(page: Page) {
  return page
    .locator("[data-radix-scroll-area-viewport]")
    .filter({
      has: page.getByRole("button", { exact: true, name: "Dashboard" }),
    })
}

// 取得側邊欄主選單按鈕
function getSidebarMenuButton(page: Page, name: string) {
  return page.locator('[data-sidebar="menu-button"]').filter({ hasText: name })
}

// 清空頁籤持久化資料後進入工作區
async function openCleanWorkspace(page: Page) {
  await page.addInitScript((storageKey) => {
    localStorage.removeItem(storageKey)
  }, TAB_STORAGE_KEY)
  await page.goto("/")
}

// 預先建立指定數量的 Items 頁籤，避免測試大量點擊側邊欄
async function openWorkspaceWithSeededItems(page: Page, itemCount: number) {
  await page.addInitScript(
    ({ storageKey, seededItemCount }) => {
      const itemTabs = Array.from({ length: seededItemCount }, (_, index) => ({
        id: `items-${index + 1}`,
        key: "items",
      }))

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: {
            tabs: [{ id: "dashboard", key: "dashboard" }, ...itemTabs],
            activeId: "dashboard",
          },
          version: 0,
        }),
      )
    },
    { storageKey: TAB_STORAGE_KEY, seededItemCount: itemCount },
  )
  await page.goto("/")
}

test("Initial workspace shows fixed Dashboard tab", async ({ page }) => {
  await openCleanWorkspace(page)

  const tabViewport = getTabViewport(page)
  await expect(
    tabViewport.getByRole("button", { exact: true, name: "Dashboard" }),
  ).toHaveCount(1)
  await expect(
    tabViewport.getByRole("button", { exact: true, name: "Items" }),
  ).toHaveCount(0)
  await expect(page.getByText("歡迎使用管理平台")).toBeVisible()
  await expect(page).toHaveURL("/")
})

test("Sidebar can open duplicated Items tabs", async ({ page }) => {
  await openCleanWorkspace(page)

  const itemsMenuButton = getSidebarMenuButton(page, "Items")
  await expect(itemsMenuButton).toHaveCount(1)
  await itemsMenuButton.click()
  await itemsMenuButton.click()

  const tabViewport = getTabViewport(page)
  await expect(
    tabViewport.getByRole("button", { exact: true, name: "Items" }),
  ).toHaveCount(2)
  await expect(page.getByRole("heading", { name: "Items" })).toBeVisible()
  await expect(page).toHaveURL("/")
})

test("Sidebar Admin opens Admin content inside Tab Header", async ({ page }) => {
  await openCleanWorkspace(page)

  const adminMenuButton = getSidebarMenuButton(page, "Admin").first()
  await expect(adminMenuButton).toBeVisible()
  await adminMenuButton.click()

  const tabViewport = getTabViewport(page)
  await expect(
    tabViewport.getByRole("button", { exact: true, name: "Admin" }),
  ).toHaveCount(1)
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible()
  await expect(
    page.getByText("Manage user accounts and permissions"),
  ).toBeVisible()
  await expect(page).toHaveURL("/")
})

test("Many tabs do not create document-level horizontal scroll", async ({ page }) => {
  await openWorkspaceWithSeededItems(page, MAX_TABS - 1)

  const documentWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(documentWidth.scrollWidth).toBeLessThanOrEqual(documentWidth.clientWidth + 1)
})

test("Many tabs scroll inside Tab Header viewport", async ({ page }) => {
  await openWorkspaceWithSeededItems(page, MAX_TABS - 1)

  const tabViewport = getTabViewport(page)
  const tabViewportWidth = await tabViewport.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))

  expect(tabViewportWidth.scrollWidth).toBeGreaterThan(tabViewportWidth.clientWidth)
})

test("Confirming close dialog removes the tab", async ({ page }) => {
  await openCleanWorkspace(page)

  const itemsMenuButton = getSidebarMenuButton(page, "Items")
  await itemsMenuButton.click()

  // 不靠「名稱數量為 0」判斷，改讀 localStorage 抓出剛開的這個 tab id，
  // 確保驗證的是「這個特定 tab 真的消失了」，不受其他同名 Items tab 影響
  const newTabId = await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : null
    const tabs: Array<{ id: string }> = parsed?.state?.tabs ?? []
    return tabs.find((t) => t.id !== "dashboard")?.id ?? null
  }, TAB_STORAGE_KEY)
  expect(newTabId).not.toBeNull()

  const newTab = page.locator(`[data-tab-id="${newTabId}"]`)
  await expect(newTab).toHaveCount(1)

  await newTab.getByRole("button", { name: "關閉 Items" }).click()
  await page.getByRole("button", { name: "確認關閉" }).click()

  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(newTab).toHaveCount(0)
})

test("Max tab limit still returns from router page to tab workspace", async ({ page }) => {
  await openWorkspaceWithSeededItems(page, MAX_TABS - 1)
  await page.goto("/test-tab")

  const itemsMenuButton = getSidebarMenuButton(page, "Items")
  await expect(itemsMenuButton).toHaveCount(1)
  await itemsMenuButton.click()

  await expect(page.getByText(`已達上限（${MAX_TABS}），請先關閉再開`)).toBeVisible()
  await expect(page).toHaveURL("/")
})
