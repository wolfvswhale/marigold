// Renders "Book a chair." in a range of greens on the real page background,
// in the real typeface, with the contrast figure printed beside each one.
//
//   node scripts/green-swatches.mjs
//
// Contrast matters here because the headline is the first thing read. Large
// text needs 3:1 against its background to stay legible for everyone; the pale
// greens will not clear it, and the number says so rather than my opinion.

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const PAPER = '#fbf6ee'

const GREENS = [
  ['Forest', '#1f3d2b'],
  ['Pine', '#275a41'],
  ['Hunter', '#2e6b4a'],
  ['Emerald', '#157f5f'],
  ['Jade', '#2e8b72'],
  ['Moss', '#5f7355'],
  ['Surf', '#6fbf9b'],
  ['Seafoam', '#8fcfb6'],
  ['Teal', '#0f6f6c'],
  ['Deep teal', '#0b5350'],
]

const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const rows = GREENS.map(([name, hex]) => {
  const r = ratio(hex, PAPER)
  const verdict = r >= 4.5 ? 'clears every bar' : r >= 3 ? 'fine at this size' : 'too pale to read'
  const flag = r >= 3 ? '' : 'style="color:#b23b3b"'
  return `<tr>
    <td class="h" style="color:${hex}">Book a chair.</td>
    <td class="m">
      <b>${name}</b><br>
      <span class="hex">${hex}</span><br>
      <span class="r" ${flag}>${r.toFixed(2)} to 1 &middot; ${verdict}</span>
    </td>
  </tr>`
}).join('')

const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:56px 64px; background:${PAPER}; }
  table { border-collapse:collapse; }
  td { padding:14px 0; vertical-align:middle; border-bottom:1px solid #e6dbc9; }
  .h { font-family:Fraunces,Georgia,serif; font-size:64px; letter-spacing:-.015em; padding-right:56px; }
  .m { font-family:Inter,sans-serif; font-size:14px; color:#5d5548; line-height:1.5; white-space:nowrap; }
  .hex { color:#918776; font-variant-numeric:tabular-nums; }
  .r { font-variant-numeric:tabular-nums; }
  h1 { font-family:Fraunces,serif; font-weight:400; font-size:30px; color:#211d18; margin:0 0 8px; }
  p  { font-family:Inter,sans-serif; font-size:15px; color:#5d5548; margin:0 0 34px; max-width:640px; }
</style></head><body>
<h1>Book a chair, in green</h1>
<p>On the real page background, in the real typeface, at roughly the size the headline
actually prints. The number is contrast against the cream. A headline this big needs 3 to 1
to stay readable for everyone.</p>
<table>${rows}</table>
</body></html>`

const file = path.resolve(import.meta.dirname, '..', 'shots', '_greens.html')
await writeFile(file, html)

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1180, height: 1180 }, deviceScaleFactor: 2 })
await page.goto('file://' + file)
await page.waitForTimeout(2500)
await page.screenshot({ path: path.resolve(import.meta.dirname, '..', 'shots', 'greens.png'), fullPage: true })
await browser.close()
console.log('wrote shots/greens.png')
