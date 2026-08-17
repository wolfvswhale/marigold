import Link from 'next/link'
import { serverClient } from '@/lib/supabase/server'
import { Business, Service, Hours, DAY_NAMES, clock, money } from '@/lib/shop'
import BookingFlow from '@/components/booking-flow'
import SalonBackdrop from '@/components/salon-backdrop'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const sb = await serverClient()
  const slug = process.env.NEXT_PUBLIC_SHOP_SLUG ?? 'marigold'

  const { data: shop } = await sb
    .from('bk_businesses').select('*').eq('slug', slug).single<Business>()

  if (!shop) {
    return <main className="p-16 mg-display text-3xl">The shop is not set up yet.</main>
  }

  const [{ data: services }, { data: hours }] = await Promise.all([
    sb.from('bk_services').select('*').eq('business_id', shop.id)
      .eq('active', true).order('sort').returns<Service[]>(),
    sb.from('bk_hours').select('*').eq('business_id', shop.id)
      .order('weekday').returns<Hours[]>(),
  ])

  return (
    <main className="mg-wash min-h-screen relative">
      <SalonBackdrop />
      <header className="relative z-10 mx-auto max-w-5xl px-6 pt-8 flex items-center justify-between">
        <div className="mg-display text-xl">{shop.name}</div>
        {/* This sits over whichever picture is showing, so it carries its own
            cream background rather than trusting the photo behind it. */}
        <Link
          href="/staff"
          className="text-sm rounded-full px-4 py-2"
          style={{ color: 'var(--body)', background: 'rgba(251,246,238,.82)' }}
        >
          Staff sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-14 mg-rise">
        <p className="text-sm tracking-widest uppercase mb-6" style={{ color: 'var(--gold)' }}>
          {shop.address} &middot; {shop.phone}
        </p>
        <h1 className="mg-display text-[clamp(2.75rem,8vw,5.5rem)] max-w-3xl">
          Book a chair.
        </h1>
        <p className="mt-6 text-xl max-w-xl leading-relaxed" style={{ color: 'var(--body)' }}>
          {shop.tagline}
        </p>
      </section>

      <BookingFlow shop={shop} services={services ?? []} hours={hours ?? []} />

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mg-rule mb-10" />
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="mg-display text-2xl mb-5">When we are open</h2>
            <ul className="space-y-2">
              {(hours ?? []).map((h) => (
                <li key={h.weekday} className="flex justify-between max-w-xs">
                  <span style={{ color: 'var(--body)' }}>{DAY_NAMES[h.weekday]}</span>
                  <span style={{ color: h.closed ? 'var(--dim)' : 'var(--ink)' }}>
                    {h.closed ? 'Closed' : `${clock(h.open_min)} – ${clock(h.close_min)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mg-display text-2xl mb-5">What things cost</h2>
            <ul className="space-y-2">
              {(services ?? []).map((s) => (
                <li key={s.id} className="flex justify-between max-w-xs">
                  <span style={{ color: 'var(--body)' }}>{s.name}</span>
                  <span>{money(s.price_cents)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 pb-16 text-sm" style={{ color: 'var(--dim)' }}>
        {shop.name} is an invented business, built as a working demonstration.
        Every name, address and phone number here is made up.
      </footer>
    </main>
  )
}
