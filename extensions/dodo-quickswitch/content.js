// 在登入頁右上角注入快速切換帳號的下拉選單
function injectQuickSwitchPanel() {
  const emailInput = document.querySelector('[data-testid="email-input"]')
  const passwordInput = document.querySelector('[data-testid="password-input"]')

  // 找不到登入表單就不執行，避免頁面結構改了套件報錯
  if (!emailInput || !passwordInput) return
  if (document.getElementById("dodo-quickswitch-panel")) return

  const accounts = window.__DODO_ACCOUNTS__ || []

  const panel = document.createElement("div")
  panel.id = "dodo-quickswitch-panel"
  panel.style.position = "fixed"
  panel.style.top = "16px"
  panel.style.right = "16px"
  panel.style.zIndex = "999999"
  panel.style.background = "#ffffff"
  panel.style.border = "1px solid #dbe5ee"
  panel.style.borderRadius = "8px"
  panel.style.boxShadow = "0 10px 35px rgba(15, 23, 42, 0.12)"
  panel.style.padding = "10px 12px"
  panel.style.fontFamily = "Segoe UI, Microsoft JhengHei, Arial, sans-serif"
  panel.style.fontSize = "13px"

  const label = document.createElement("div")
  label.textContent = "QuickSwitch 快速登入"
  label.style.marginBottom = "6px"
  label.style.fontWeight = "700"
  label.style.color = "#475569"
  panel.appendChild(label)

  const select = document.createElement("select")
  select.style.width = "180px"
  select.style.padding = "6px"

  const placeholderOption = document.createElement("option")
  placeholderOption.textContent = "選擇角色帳號..."
  placeholderOption.value = ""
  select.appendChild(placeholderOption)

  for (const account of accounts) {
    const option = document.createElement("option")
    option.value = account.email
    option.textContent = account.label
    select.appendChild(option)
  }

  select.addEventListener("change", () => {
    const account = accounts.find((item) => item.email === select.value)
    if (!account) return
    fillLoginForm(emailInput, passwordInput, account.email, account.password)
  })

  panel.appendChild(select)
  document.body.appendChild(panel)
}

// React controlled input 必須透過 native setter + dispatchEvent 才能讓表單狀態同步更新
function setNativeInputValue(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  ).set
  nativeInputValueSetter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

// 填入帳密並自動送出登入表單
function fillLoginForm(emailInput, passwordInput, email, password) {
  setNativeInputValue(emailInput, email)
  setNativeInputValue(passwordInput, password)

  const form = emailInput.closest("form")
  const submitButton = form?.querySelector('button[type="submit"]')
  submitButton?.click()
}

// 移除面板，離開登入頁（client-side 路由跳轉）時用
function removeQuickSwitchPanel() {
  document.getElementById("dodo-quickswitch-panel")?.remove()
}

// React 是 SPA，document_idle 觸發時表單可能還沒渲染完，輪詢直到找到表單或逾時為止
const quickSwitchRetryTimer = setInterval(() => {
  const ready = document.querySelector('[data-testid="email-input"]')
  if (ready) {
    injectQuickSwitchPanel()
    clearInterval(quickSwitchRetryTimer)
  }
}, 300)

setTimeout(() => clearInterval(quickSwitchRetryTimer), 10000)

// SPA 路由跳轉不會整頁刷新，輪詢網址判斷是否離開登入頁，離開就移除面板
let lastQuickSwitchPath = window.location.pathname
setInterval(() => {
  if (window.location.pathname === lastQuickSwitchPath) return
  lastQuickSwitchPath = window.location.pathname
  if (!lastQuickSwitchPath.startsWith("/login")) {
    removeQuickSwitchPanel()
  }
}, 300)
