// Clean shots of the live booking app for the gig gallery.
//   node capture.cjs
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const U = 'https://marigold-pi-lyart.vercel.app'
const OUT = path.resolve(__dirname, 'shots')

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })

  // Desktop
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
  })
  await page.goto(U, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(OUT, 'book-top.png') })

  await page.evaluate(() => window.scrollBy(0, 640))
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(OUT, 'book-times.png') })

  await page.goto(U + '/staff/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(OUT, 'staff-login.png') })
  await page.click('text=Open the demo book')
  await page.waitForURL('**/staff', { timeout: 30000 })
  await page.waitForTimeout(2500)

  // Step to a day that actually has appointments in it.
  const link = await page.$('a[href^="/staff?d="]')
  if (link) { await link.click(); await page.waitForTimeout(2500) }
  await page.screenshot({ path: path.join(OUT, 'staff-day.png') })

  await page.goto(U + '/staff/settings', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(OUT, 'staff-settings.png') })

  // Phone. This is the shot that proves it works in a hand.
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true,
  })
  await phone.goto(U, { waitUntil: 'networkidle' })
  await phone.waitForTimeout(2500)
  await phone.screenshot({ path: path.join(OUT, 'phone-top.png') })
  await phone.evaluate(() => window.scrollBy(0, 900))
  await phone.waitForTimeout(1200)
  await phone.screenshot({ path: path.join(OUT, 'phone-times.png') })

  console.log('shots written to', OUT)
  await browser.close()
})()
