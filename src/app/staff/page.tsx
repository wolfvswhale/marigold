import Link from 'next/link'
import { serverClient } from '@/lib/supabase/server'
import StaffHeader from '@/components/staff-header'
import {
  Business, Service, clock, money, minutesOf, isoFromDay, dayFromISO, prettyDay,
} from '@/lib/shop'

export const dynamic = 'force-dynamic'

type Row = {
  id: string; starts_at: string; minutes: number
  customer_name: string; customer_email: string; customer_phone: string
  note: string; status: string; service_id: string
}

export default async function StaffDay({
  searchParams,
}: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams
  const dayISO = d ?? isoFromDay(new Date())

  const sb = await serverClient()
  const slug = process.env.NEXT_PUBLIC_SHOP_SLUG ?? 'marigold'
  const { data: shop } = await sb
    .from('bk_businesses').select('*').eq('slug', slug).single<Business>()

  const [{ data: services }, { data: rows }] = await Promise.all([
    sb.from('bk_services').select('*').returns<Service[]>(),
    sb.from('bk_bookings').select('*')
      .gte('starts_at', `${dayISO}T00:00:00`)
      .lte('starts_at', `${dayISO}T23:59:59`)
      .order('starts_at').returns<Row[]>(),
  ])

  const nameOf = (id: string) => services?.find((s) => s.id === id)?.name ?? 'Appointment'
  const priceOf = (id: string) => services?.find((s) => s.id === id)?.price_cents ?? 0

  const list = (rows ?? []).filter((r) => r.status !== 'cancelled')
  const takings = list.reduce((n, r) => n + priceOf(r.service_id), 0)

  const shift = (days: number) => {
    const x = dayFromISO(dayISO)
    x.setDate(x.getDate() + days)
    return `/staff?d=${isoFromDay(x)}`
  }

  return (
    <main className="mg-wash min-h-screen pb-24">
      <StaffHeader shopName={shop?.name ?? 'The book'} />

      <div className="mx-auto max-w-4xl px-6 pt-14 mg-rise">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>
              {list.length === 0 ? 'Nothing booked' :
               list.length === 1 ? '1 appointment' : `${list.length} appointments`}
              {list.length > 0 ? ` · ${money(takings)} on the day` : ''}
            </p>
            <h1 className="mg-display text-[clamp(2rem,6vw,3.5rem)]">{prettyDay(dayISO)}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={shift(-1)} className="mg-btn mg-btn-quiet !h-11 !px-4">←</Link>
            <Link href="/staff" className="mg-btn mg-btn-quiet !h-11">Today</Link>
            <Link href={shift(1)} className="mg-btn mg-btn-quiet !h-11 !px-4">→</Link>
          </div>
        </div>

        <div className="mt-12 space-y-3">
          {list.length === 0 && (
            <div className="mg-card p-12 text-center">
              <p className="mg-display text-2xl mb-3">An empty chair.</p>
              <p style={{ color: 'var(--body)' }}>
                Nothing is booked for this day yet.
              </p>
            </div>
          )}

          {list.map((r) => {
            const start = minutesOf(r.starts_at)
            return (
              <article key={r.id} className="mg-card p-6 sm:p-7 flex flex-col sm:flex-row gap-5">
                <div className="sm:w-32 shrink-0">
                  <div className="mg-display text-3xl">{clock(start)}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--dim)' }}>
                    to {clock(start + r.minutes)}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="mg-display text-2xl">{r.customer_name}</h2>
                    <span className="text-sm" style={{ color: 'var(--gold)' }}>
                      {nameOf(r.service_id)}
                    </span>
                  </div>

                  {r.note && (
                    <p className="mt-3 text-[.95rem] leading-relaxed" style={{ color: 'var(--body)' }}>
                      “{r.note}”
                    </p>
                  )}

                  <p className="mt-4 text-sm" style={{ color: 'var(--dim)' }}>
                    {r.customer_email}{r.customer_phone ? ` · ${r.customer_phone}` : ''}
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="font-semibold">{money(priceOf(r.service_id))}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest"
                       style={{ color: r.status === 'done' ? 'var(--ok)' : 'var(--dim)' }}>
                    {r.status === 'done' ? '✓ Done' : '· Booked'}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
