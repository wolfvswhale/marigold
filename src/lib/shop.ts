// Shared shapes and the small amount of date arithmetic this app needs.
// Everything is wall-clock local to the shop. No time zones: a 9am
// appointment is 9am on the wall, which is how a salon actually thinks.

export type Business = {
  id: string; slug: string; name: string
  tagline: string; phone: string; address: string
}
export type Service = {
  id: string; name: string; blurb: string
  minutes: number; price_cents: number; sort: number; active?: boolean
}
export type Hours = { weekday: number; open_min: number; close_min: number; closed: boolean }
export type Booking = {
  id: string; service_id: string; starts_at: string; minutes: number
  customer_name: string; customer_email: string; customer_phone: string
  note: string; status: string
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const money = (cents: number) =>
  cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`

export const clock = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60
  const ampm = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, '0')}${ampm}`
}

/** "2026-08-19" -> a Date at local midnight, with no time-zone surprises. */
export const dayFromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const isoFromDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** What the database stores: "2026-08-19T14:30:00", no zone marker. */
export const stamp = (dayISO: string, minutes: number) =>
  `${dayISO}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`

export const minutesOf = (stampStr: string) => {
  const t = stampStr.split('T')[1] ?? '00:00:00'
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const prettyDay = (iso: string) =>
  dayFromISO(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

/** Every start time the shop could offer on a given day, in 15-minute steps. */
export function candidateSlots(hours: Hours | undefined, serviceMinutes: number): number[] {
  if (!hours || hours.closed) return []
  const out: number[] = []
  for (let t = hours.open_min; t + serviceMinutes <= hours.close_min; t += 15) out.push(t)
  return out
}

/** A slot is gone if it overlaps a booking that is still standing. */
export function slotTaken(
  start: number, serviceMinutes: number,
  taken: { start: number; minutes: number }[]
) {
  const end = start + serviceMinutes
  return taken.some((b) => start < b.start + b.minutes && b.start < end)
}
