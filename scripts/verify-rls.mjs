// Proves the two claims this app makes about privacy, from the outside, using
// only the public key a browser would have.
//   node scripts/verify-rls.mjs
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2))
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const get = (p) => fetch(`${url}/rest/v1/${p}`, { headers: { apikey: key } }).then((r) => r.json())

const bookings = await get('bk_bookings?select=customer_name,customer_email')
const busy = await get('bk_busy?select=starts_at,minutes&limit=3')
const services = await get('bk_services?select=name&limit=3')

let bad = 0
const check = (name, ok, detail) => {
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? ' - ' + detail : ''}`)
  if (!ok) bad++
}

check('a stranger cannot read who booked',
  Array.isArray(bookings) && bookings.length === 0,
  Array.isArray(bookings) ? `${bookings.length} rows` : JSON.stringify(bookings).slice(0, 80))

check('a stranger can read which times are taken',
  Array.isArray(busy) && busy.length > 0 && !('customer_name' in (busy[0] ?? {})),
  `${busy.length ?? 0} rows, times only`)

check('a stranger can read the price list',
  Array.isArray(services) && services.length > 0, `${services.length ?? 0} services`)

process.exit(bad ? 1 : 0)
