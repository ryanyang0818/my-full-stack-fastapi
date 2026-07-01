import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/users/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        email: "admin@example.com",
        full_name: "Admin User",
        id: "00000000-0000-0000-0000-000000000001",
        is_active: true,
        is_superuser: true,
      },
    })
  })

  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("access_token", "test-token")
  })
  await page.goto("/")

  await expect
    .poll(() => page.evaluate(() => Boolean(window.dodo?.controller)))
    .toBe(true)
})

// 驗證全域 controller 能集中控制兩個 Header 區塊
test("window.dodo.controller exposes header controllers", async ({ page }) => {
  const appMenu = page.getByRole("navigation", {
    name: "應用程式功能選單",
  })
  const userHeader = page.getByText("DoDo Admin", { exact: true })

  await page.evaluate(() => window.dodo?.controller.appHeader.show())
  await expect(appMenu).toBeVisible()

  await page.evaluate(() => window.dodo?.controller.appHeader.hide())
  await expect(appMenu).toBeHidden()

  await page.evaluate(() => window.dodo?.controller.userHeader.hide())
  await expect(userHeader).toBeHidden()

  await page.evaluate(() => window.dodo?.controller.userHeader.show())
  await expect(userHeader).toBeVisible()
})

// 驗證 sidebar controller 沿用既有 sidebar 收合狀態
test("window.dodo.controller exposes sidebar controller", async ({ page }) => {
  await page.evaluate(() => window.dodo?.controller.sidebar.expand())
  await expect
    .poll(() => page.evaluate(() => window.dodo?.controller.sidebar.getState()))
    .toMatchObject({
      isMobile: false,
      name: "sidebar",
      open: true,
      state: "expanded",
    })

  await page.evaluate(() => window.dodo?.controller.sidebar.collapse())
  await expect
    .poll(() => page.evaluate(() => window.dodo?.controller.sidebar.getState()))
    .toMatchObject({
      isMobile: false,
      name: "sidebar",
      open: false,
      state: "collapsed",
    })

  await page.evaluate(() => window.dodo?.controller.sidebar.toggle())
  await expect
    .poll(() => page.evaluate(() => window.dodo?.controller.sidebar.getState()))
    .toMatchObject({
      isMobile: false,
      name: "sidebar",
      open: true,
      state: "expanded",
    })
})

// 驗證 mainContent controller 能查詢中央內容區
test("window.dodo.controller exposes mainContent controller", async ({
  page,
}) => {
  await expect
    .poll(() =>
      page.evaluate(() => window.dodo?.controller.mainContent.getState()),
    )
    .toEqual({
      mounted: true,
      name: "mainContent",
    })

  const sectionName = await page.evaluate(() =>
    window.dodo?.controller.mainContent
      .getElement()
      ?.getAttribute("data-dodo-section"),
  )

  expect(sectionName).toBe("mainContent")
})

// 驗證 footer controller 能查詢 ERP 底部狀態列
test("window.dodo.controller exposes footer controller", async ({ page }) => {
  const footer = page.locator('[data-dodo-section="footer"]')

  await expect(footer.getByText("已連線", { exact: true })).toBeVisible()
})
