'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { browserClient } from '@/lib/supabase/client'
import {
  Business, Service, Hours,
  candidateSlots, slotTaken, clock, money, stamp, minutesOf, isoFromDay, prettyDay,
} from '@/lib/shop'

type Props = { shop: Business; services: Service[]; hours: Hours[] }

// Fourteen days is enough choice to feel real and few enough to fit on a phone.
function nextDays(count: number) {
  const out: string[] = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    out.push(isoFromDay(d))
  }
  return out
}

export default function BookingFlow({ shop, services, hours }: Props) {
  const router = useRouter()
  const days = useMemo(() => nextDays(14), [])

  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  // Open on the first day the shop is actually open. Landing a visitor on
  // "we are closed" is a bad first thing to read.
  const firstOpen =
    days.find((d) => !hours.find((h) => h.weekday === new Date(d + 'T00:00:00').getDay())?.closed)
    ?? days[0]
  const [dayISO, setDayISO] = useState(firstOpen)
  const [slot, setSlot] = useState<number | null>(null)
  const [busy, setBusy] = useState<{ start: number; minutes: number }[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const service = services.find((s) => s.id === serviceId)
  const dayHours = hours.find((h) => h.weekday === new Date(dayISO + 'T00:00:00').getDay())

  // Which times are already gone on the chosen day. The view we read from
  // returns start times only, never a customer's name.
  useEffect(() => {
    let cancelled = false
    setSlot(null)
    ;(async () => {
      const sb = browserClient()
      const { data } = await sb
        .from('bk_busy')
        .select('starts_at, minutes')
        .eq('business_id', shop.id)
        .gte('starts_at', `${dayISO}T00:00:00`)
        .lte('starts_at', `${dayISO}T23:59:59`)
      if (cancelled) return
      setBusy((data ?? []).map((b: { starts_at: string; minutes: number }) =>
        ({ start: minutesOf(b.starts_at), minutes: b.minutes })))
    })()
    return () => { cancelled = true }
  }, [dayISO, shop.id])

  const slots = service ? candidateSlots(dayHours, service.minutes) : []

  // A time in the past today is not an option, whatever the shop hours say.
  const nowCutoff = (() => {
    const now = new Date()
    return isoFromDay(now) === dayISO ? now.getHours() * 60 + now.getMinutes() : -1
  })()

  const ready = Boolean(service && slot !== null && name.trim() && email.trim())

  async function book() {
    if (!service || slot === null) return
    setSaving(true); setError('')
    const sb = browserClient()

    // We make the id here rather than asking the database to hand it back.
    // Anyone may create a booking; nobody anonymous may read one. Asking for
    // the new row in return counts as reading it, and the database says no.
    const id = crypto.randomUUID()

    const { error: err } = await sb
      .from('bk_bookings')
      .insert({
        id,
        business_id: shop.id,
        service_id: service.id,
        starts_at: stamp(dayISO, slot),
        minutes: service.minutes,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        note: note.trim(),
      })

    if (err) {
      // The database has a unique index on the slot, so two people racing for
      // the same time cannot both win. The loser gets told plainly.
      setError(
        err.code === '23505'
          ? 'Someone just took that time. Pick another and we will get you in.'
          : 'That did not go through. Try again in a moment.'
      )
      setSaving(false)
      return
    }
    router.push(`/booked/${id}`)
  }

  return (
    <section id="book" className="mx-auto max-w-5xl px-6">
      <div className="mg-card p-6 sm:p-10">

        <h2 className="mg-display text-3xl mb-8">What are you coming in for?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => {
            const on = s.id === serviceId
            return (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                aria-pressed={on}
                className="text-left rounded-2xl border p-5 transition"
                style={{
                  borderColor: on ? 'var(--ink)' : 'var(--line)',
                  background: on ? 'var(--paper-2)' : '#fff',
                }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="mg-display text-xl">{s.name}</span>
                  <span className="font-semibold">{money(s.price_cents)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--body)' }}>
                  {s.blurb}
                </p>
                <p className="mt-3 text-xs uppercase tracking-widest" style={{ color: 'var(--dim)' }}>
                  {s.minutes} minutes {on ? '· chosen' : ''}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mg-rule my-10" />

        <h2 className="mg-display text-3xl mb-6">Which day?</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {days.map((d) => {
            const dt = new Date(d + 'T00:00:00')
            const shut = hours.find((h) => h.weekday === dt.getDay())?.closed
            const on = d === dayISO
            return (
              <button
                key={d}
                disabled={shut}
                onClick={() => setDayISO(d)}
                className="shrink-0 w-[4.5rem] rounded-2xl border py-3 disabled:opacity-30"
                style={{
                  borderColor: on ? 'var(--ink)' : 'var(--line)',
                  background: on ? 'var(--ink)' : '#fff',
                  color: on ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                <div className="text-[.7rem] uppercase tracking-widest opacity-70">
                  {dt.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="mg-display text-2xl mt-1">{dt.getDate()}</div>
              </button>
            )
          })}
        </div>

        <div className="mg-rule my-10" />

        <h2 className="mg-display text-3xl mb-2">What time?</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--dim)' }}>
          {prettyDay(dayISO)} · times already booked are crossed out
        </p>

        {slots.length === 0 ? (
          <p style={{ color: 'var(--body)' }}>We are closed that day. Try another.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {slots.map((t) => {
              const gone = slotTaken(t, service!.minutes, busy) || t <= nowCutoff
              const on = slot === t
              return (
                <button
                  key={t}
                  disabled={gone}
                  data-on={on}
                  onClick={() => setSlot(t)}
                  className="mg-slot"
                >
                  {on ? '✓ ' : ''}{clock(t)}
                </button>
              )
            })}
          </div>
        )}

        <div className="mg-rule my-10" />

        <h2 className="mg-display text-3xl mb-6">And who are we expecting?</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mg-label" htmlFor="n">Your name</label>
            <input id="n" className="mg-input" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="First and last" />
          </div>
          <div>
            <label className="mg-label" htmlFor="e">Email</label>
            <input id="e" type="email" className="mg-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mg-label" htmlFor="p">Phone (optional)</label>
            <input id="p" className="mg-input" value={phone}
              onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000 0000" />
          </div>
          <div>
            <label className="mg-label" htmlFor="no">Anything we should know?</label>
            <input id="no" className="mg-input" value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="Growing it out, going shorter…" />
          </div>
        </div>

        {error && (
          <p className="mt-8 rounded-2xl px-5 py-4 text-sm"
             style={{ background: '#fdecec', color: 'var(--stop)' }}>
            <strong>Not booked.</strong> {error}
          </p>
        )}

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <button className="mg-btn mg-btn-gold w-full sm:w-auto"
                  disabled={!ready || saving} onClick={book}>
            {saving ? 'Booking…' : 'Book it'}
          </button>
          <p className="text-sm" style={{ color: 'var(--body)' }}>
            {service && slot !== null
              ? `${service.name}, ${prettyDay(dayISO)} at ${clock(slot)}. ${money(service.price_cents)}, paid at the shop.`
              : 'Pick a service and a time and this lights up.'}
          </p>
        </div>
      </div>
    </section>
  )
}
