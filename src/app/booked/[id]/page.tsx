import Link from 'next/link'
import { serverClient } from '@/lib/supabase/server'
import { clock, minutesOf, money, prettyDay } from '@/lib/shop'

export const dynamic = 'force-dynamic'

type Receipt = {
  id: string; starts_at: string; minutes: number
  customer_name: string; note: string; status: string
  service_name: string; price_cents: number
  shop_name: string; shop_address: string; shop_phone: string
}

export default async function Booked({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await serverClient()
  const { data } = await sb.rpc('bk_receipt', { p_id: id })
  const r = (data as Receipt[] | null)?.[0]

  if (!r) {
    return (
      <main className="mg-wash min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <h1 className="mg-display text-4xl mb-4">We cannot find that booking.</h1>
          <Link href="/" className="mg-btn mg-btn-quiet">Start again</Link>
        </div>
      </main>
    )
  }

  const dayISO = r.starts_at.split('T')[0]

  return (
    <main className="mg-wash min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-20 mg-rise">
        <p className="text-sm tracking-widest uppercase mb-6" style={{ color: 'var(--gold)' }}>
          ✓ Booked
        </p>
        <h1 className="mg-display text-[clamp(2.25rem,7vw,4rem)] mb-6">
          You are in the book, {r.customer_name.split(' ')[0]}.
        </h1>
        <p className="text-xl mb-12" style={{ color: 'var(--body)' }}>
          No email will arrive, because this is a demonstration. In a real shop
          this is where the confirmation would go out.
        </p>

        <div className="mg-card p-8 space-y-6">
          <Row label="What" value={r.service_name} />
          <Row label="When" value={`${prettyDay(dayISO)} at ${clock(minutesOf(r.starts_at))}`} />
          <Row label="How long" value={`${r.minutes} minutes`} />
          <Row label="Cost" value={`${money(r.price_cents)}, paid at the shop`} />
          {r.note ? <Row label="Your note" value={r.note} /> : null}
          <div className="mg-rule" />
          <Row label="Where" value={`${r.shop_name}, ${r.shop_address}`} />
          <Row label="Phone" value={r.shop_phone} />
        </div>

        <Link href="/" className="mg-btn mg-btn-quiet mt-10">Book another</Link>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
      <span className="mg-label mb-0 sm:w-28 shrink-0">{label}</span>
      <span className="text-lg">{value}</span>
    </div>
  )
}
