import { expect, test } from "@playwright/test"
import type { HeaderControlsApi } from "../src/components/Header/header-visibility"

/**
 * 對應完成計畫：
 * docs/執行計畫/完成計畫/Header顯示控制與滑鼠喚回.md
 *
 * 本檔案用於驗證該計畫實作的 Header 顯示控制功能。
 */

declare global {
  interface Window {
    headerControls?: HeaderControlsApi
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")

  await expect
    .poll(() => page.evaluate(() => Boolean(window.headerControls)))
    .toBe(true)
})

// 驗證 hideAppMenu 能隱藏功能選單並更新狀態
test("hideAppMenu() 隱藏 AppMenuBar", async ({ page }) => {
  const appMenu = page.getByRole("navigation", {
    name: "應用程式功能選單",
  })

  await page.evaluate(() => window.headerControls?.showAppMenu())
  await expect(appMenu).toBeVisible()

  await page.evaluate(() => window.headerControls?.hideAppMenu())

  await expect(appMenu).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => window.headerControls?.getState().appMenuVisible),
    )
    .toBe(false)
})

// 驗證 showAppMenu 能固定顯示功能選單並更新狀態
test("showAppMenu() 顯示 AppMenuBar", async ({ page }) => {
  const appMenu = page.getByRole("navigation", {
    name: "應用程式功能選單",
  })

  await page.evaluate(() => window.headerControls?.hideAppMenu())
  await expect(appMenu).toBeHidden()

  await page.evaluate(() => window.headerControls?.showAppMenu())

  await expect(appMenu).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => window.headerControls?.getState().appMenuVisible),
    )
    .toBe(true)
})

// 驗證 toggleAppMenu 能切換功能選單顯示狀態
test("toggleAppMenu() 切換 AppMenuBar 顯示狀態", async ({ page }) => {
  const appMenu = page.getByRole("navigation", {
    name: "應用程式功能選單",
  })

  await page.evaluate(() => window.headerControls?.hideAppMenu())
  await expect(appMenu).toBeHidden()

  await page.evaluate(() => window.headerControls?.toggleAppMenu())
  await expect(appMenu).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => window.headerControls?.getState().appMenuVisible),
    )
    .toBe(true)

  await page.evaluate(() => window.headerControls?.toggleAppMenu())
  await expect(appMenu).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(() => window.headerControls?.getState().appMenuVisible),
    )
    .toBe(false)
})

// 驗證 hideUserHeader 能隱藏使用者標頭並更新狀態
test("hideUserHeader() 隱藏 UserHeader", async ({ page }) => {
  const userHeader = page.getByText("管理平台", { exact: true })

  await expect(userHeader).toBeVisible()

  await page.evaluate(() => window.headerControls?.hideUserHeader())

  await expect(userHeader).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(
        () => window.headerControls?.getState().userHeaderVisible,
      ),
    )
    .toBe(false)
})

// 驗證 showUserHeader 能顯示使用者標頭並更新狀態
test("showUserHeader() 顯示 UserHeader", async ({ page }) => {
  const userHeader = page.getByText("管理平台", { exact: true })

  await page.evaluate(() => window.headerControls?.hideUserHeader())
  await expect(userHeader).toBeHidden()

  await page.evaluate(() => window.headerControls?.showUserHeader())

  await expect(userHeader).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () => window.headerControls?.getState().userHeaderVisible,
      ),
    )
    .toBe(true)
})

// 驗證 toggleUserHeader 能切換使用者標頭顯示狀態
test("toggleUserHeader() 切換 UserHeader 顯示狀態", async ({ page }) => {
  const userHeader = page.getByText("管理平台", { exact: true })

  await expect(userHeader).toBeVisible()

  await page.evaluate(() => window.headerControls?.toggleUserHeader())
  await expect(userHeader).toBeHidden()
  await expect
    .poll(() =>
      page.evaluate(
        () => window.headerControls?.getState().userHeaderVisible,
      ),
    )
    .toBe(false)

  await page.evaluate(() => window.headerControls?.toggleUserHeader())
  await expect(userHeader).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () => window.headerControls?.getState().userHeaderVisible,
      ),
    )
    .toBe(true)
})

// 驗證 hideAll 能同時隱藏兩個 Header
test("hideAll() 隱藏兩個 Header", async ({ page }) => {
  const appMenu = page.getByRole("navigation", {
    name: "應用程式功能選單",
  })
  const userHeader = page.getByText("管理平台", { exact: true })

  await page.evaluate(() => window.headerControls?.showAppMenu())
  await expect(appMenu).toBeVisible()
  await expect(userHeader).toBeVisible()

  await page.evaluate(() => window.headerControls?.hideAll())

  await expect(appMenu).toBeHidden()
  await expect(userHeader).toBeHidden()
  await expect
    .poll(() => page.evaluate(() => window.headerControls?.getState()))
    .toEqual({ appMenuVisible: false, userHeaderVisible: false })
})

// 驗證 showAll 能同時顯示兩個 Header
test("showAll() 顯示兩個 Header", async ({ page }) => {
  const appMenu = page.getByRole("navigation", {
    name: "應用程式功能選單",
  })
  const userHeader = page.getByText("管理平台", { exact: true })

  await page.evaluate(() => window.headerControls?.hideAll())
  await expect(appMenu).toBeHidden()
  await expect(userHeader).toBeHidden()

  await page.evaluate(() => window.headerControls?.showAll())

  await expect(appMenu).toBeVisible()
  await expect(userHeader).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => window.headerControls?.getState()))
    .toEqual({ appMenuVisible: true, userHeaderVisible: true })
})

// 驗證 getState 回傳的狀態與實際顯示一致
test("getState() 取得目前兩個 Header 的顯示狀態", async ({ page }) => {
  const initialState = await page.evaluate(() =>
    window.headerControls?.getState(),
  )
  expect(initialState).toEqual({
    appMenuVisible: false,
    userHeaderVisible: true,
  })

  await page.evaluate(() => window.headerControls?.showAppMenu())
  await page.evaluate(() => window.headerControls?.hideUserHeader())

  const updatedState = await page.evaluate(() =>
    window.headerControls?.getState(),
  )
  expect(updatedState).toEqual({
    appMenuVisible: true,
    userHeaderVisible: false,
  })
})
