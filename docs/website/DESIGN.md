<!-- SEED: re-run /impeccable document once there's real code/markup to capture actual tokens and components. -->

---
name: Dodo Admin 產品定位介紹網站
description: 冷靜、結構化、可信賴的儀表板美學,用來介紹 Dodo Admin 的定位與邊界
colors:
  primary-navy: "#0E2A47"
  primary-teal-alt: "#104052"
  action-blue: "#0A74DA"
  bg-light: "#F8F9FA"
  bg-mid: "#E9ECEF"
  surface-white: "#FFFFFF"
  border-hairline: "#D1D5DB"
  verify-gold: "#C7A054"
  verify-green: "#166534"
  text-body: "#374151"
  text-heading: "#111827"
typography:
  display:
    fontFamily: "[serif 標題字體待選, fallback: Georgia, serif]"
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "[無襯線內文字體待選, fallback: system-ui, sans-serif]"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#085ec0"
  badge-verified:
    backgroundColor: "{colors.verify-green}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
---

# Design System: Dodo Admin 產品定位介紹網站

## 1. Overview

**Creative North Star: "冷靜指揮室(The Calm Command Room)"**

這是一個以「信任與安全」為核心情緒的定位介紹頁,視覺語言刻意向儀表板(dashboard)美學靠攏:深藍/深青主色帶出冷靜篤定的氣場,淺灰背景與白色內容區塊維持乾淨的結構秩序,金色與綠色只在「驗證通過、安全鎖定」這類明確語意下出現,不做裝飾用途。整體不追求熱情或誇張的行銷腔調,而是用近似 admin 產品的沉穩結構語言,讓讀者(主要是營運/管理層)在閱讀定位與邊界說明時,產生「這是一套可信賴的基礎設施」的直覺。

這是一次刻意的方向決策:內容定位仍是介紹/行銷頁(brand register),但視覺語言主動借用 product register 的儀表板秩序感,而非典型行銷頁的誠容化排版。

**Key Characteristics:**
- 深藍/深青主色只用於強調位置(導覽、標題強調、關鍵狀態),不大面積鋪色
- 淺灰背景 + 白色區塊 + 淺灰藍分隔線,構成清楚的區塊秩序
- 金色/綠色驗證色語意明確,只對應「通過檢查、安全確認」
- 排版克制,不用漸層、不用誇大數字樣板

## 2. Colors

冷色系為主體,搭配語意明確的驗證色與單一行動色,整體低飽和、高秩序。

### Primary
- **深藍 Deep Navy** (#0E2A47): 主要強調色。用於左側導覽背景、重要區塊標題、關鍵強調文字。象徵信任、冷靜、安全。
- **深青 Deep Teal (替代方案)** (#104052): 與深藍功能相同,依整體氛圍二選一,不與深藍混用於同一頁面。

### Neutral
- **淺灰背景 Light Gray** (#F8F9FA – #E9ECEF): 主體內容區域底色,保持乾淨、不搶內容。
- **純白 White** (#FFFFFF): 表格與內容區塊(卡片式結構)背景,讓資訊本身被凸顯。
- **淺灰藍分隔線 Hairline Border** (#D1D5DB): 用於區塊分隔與邊框,微妙劃分版面,不搶眼。
- **正文深灰 Body Gray** (#374151): 內文文字。
- **標題黑 Heading Black** (#111827): 標題文字,不是純黑,略帶灰階降低刺眼感。

### Verification (語意色,非裝飾色)
- **驗證金 Verify Gold** (#C7A054): 安全驗證、鎖頭圖示等「可信賴」語意的強調。
- **驗證綠 Verify Green** (#166534): 通過檢查、成功狀態標記。

### Action
- **行動藍 Action Blue** (#0A74DA): 唯一的行動呼籲色(CTA 按鈕),與主色深藍區隔開,避免主色與行動色混淆。

### Named Rules
**The One Action Color Rule.** 全站只有一種行動呼籲色(#0A74DA)。深藍/深青主色不得同時兼做按鈕色,避免使用者混淆「這是強調」還是「這可以點」。

**The Verification-Only Rule.** 金色與綠色只能用在明確的驗證/通過語意(鎖頭、勾選、狀態標記),不得作為裝飾性強調色使用在標題或背景。

## 3. Typography

**Display Font:** [襯線標題字體待選,暫以 Georgia, serif 佔位]
**Body Font:** [無襯線內文字體待選,暫以 system-ui, sans-serif 佔位]

**Character:** 標題用襯線字體帶出一點「文件感、正式感」,呼應「可信賴」的定位;內文維持無襯線以確保可讀性與資訊密度下的清晰度。字體家族將在實作階段選定,再重新執行 `/impeccable document` 捕捉實際 token。

### Hierarchy
- **Display**(600, clamp(1.75rem, 4vw, 2.75rem), line-height 1.2): 段落主標題,如「產品意圖」「權限說明」
- **Title**(500, 1.25rem, line-height 1.4): 小節子標題
- **Body**(400, 1rem, line-height 1.7): 內文,行寬控制在 65–75ch 內
- **Label**(500, 0.8125rem, letter-spacing 0.02em): 驗證標記、狀態徽章等小型標籤文字

## 4. Elevation

整體採「扁平為主,結構分層」的策略:不使用陰影堆疊出立體感,而是用「淺灰背景 vs. 白色區塊 vs. 淺灰藍邊框」三層對比來表達結構層次。這呼應「克制」的動效能量決策——畫面本身也不靠陰影製造動態感或戲劇性。

### Named Rules
**The Flat-Structure Rule.** 深度不靠陰影表達,靠背景色階與邊框表達。若某個區塊需要被視覺上「拉出來」,先試著改變背景色(白 vs 淺灰),而不是加陰影。

## 5. Components

### Buttons
- **Shape:** 4px 圓角(`rounded.sm`)
- **Primary:** 行動藍背景(#0A74DA)+ 白色文字,padding 12px 24px
- **Hover:** 背景加深至 #085EC0,無位移動畫(克制動效原則)
- **Secondary/Ghost:** 透明背景 + 深藍文字 + 1px 淺灰藍邊框

### Badges / Verification Marks
- **Style:** 8px 圓角小標籤,背景使用驗證金或驗證綠,白色文字
- **語意限制:** 只能標示「已驗證」「已通過」等明確狀態,不作裝飾使用

### Cards / Containers
- **Corner Style:** 8px 圓角(`rounded.md`)
- **Background:** 白色(#FFFFFF),置於淺灰背景(#F8F9FA)之上
- **Border:** 1px 淺灰藍邊框(#D1D5DB),不加陰影
- **Internal Padding:** 16–32px(依內容密度選用 `spacing.md` / `spacing.lg`)

### Navigation
- 深藍(或深青)背景,白色/淺灰文字,選中項目以行動藍或淺色底標示,不使用側邊色條(side-stripe)做選中標記

## 6. Do's and Don'ts

### Do:
- **Do** 讓深藍/深青只出現在導覽、標題強調、關鍵狀態——維持低比例、高辨識度
- **Do** 用背景色階(白/淺灰)表達結構層次,取代陰影
- **Do** 讓金色/綠色驗證色語意單一,只對應「通過、安全」
- **Do** 依 PRODUCT.md 的篇幅原則,讓「產品意圖」「權限說明」段落的視覺份量大於「功能規格」段落

### Don't:
- **Don't** 使用 hero-metric 樣板(大數字 + 小標籤 + 漸層強調)
- **Don't** 使用漸層文字(gradient text)做標題強調
- **Don't** 用千篇一律的圖示 + 標題卡片網格鋪滿整頁
- **Don't** 用 `border-left` / `border-right` 色條做選中或強調標記
- **Don't** 把「產品意圖」「常見問題」這類定位性內容畫成技術流程圖
- **Don't** 讓深藍主色同時兼做按鈕行動色(見 The One Action Color Rule)
