import { serverClient } from '@/lib/supabase/server'
import StaffHeader from '@/components/staff-header'
import { Business, Service, Hours, DAY_NAMES } from '@/lib/shop'
import { saveShop, saveService, saveHours } from './actions'

export const dynamic = 'force-dynamic'

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export default async function Settings() {
  const sb = await serverClient()
  const slug = process.env.NEXT_PUBLIC_SHOP_SLUG ?? 'marigold'
  const { data: shop } = await sb
    .from('bk_businesses').select('*').eq('slug', slug).single<Business>()
  const [{ data: services }, { data: hours }] = await Promise.all([
    sb.from('bk_services').select('*').order('sort').returns<Service[]>(),
    sb.from('bk_hours').select('*').order('weekday').returns<Hours[]>(),
  ])

  return (
    <main className="mg-wash min-h-screen pb-24">
      <StaffHeader shopName={shop?.name ?? 'Settings'} />

      <div className="mx-auto max-w-4xl px-6 pt-14 mg-rise">
        <h1 className="mg-display text-[clamp(2rem,6vw,3.5rem)] mb-3">Settings</h1>
        <p className="text-lg mb-12" style={{ color: 'var(--body)' }}>
          Change these and the booking page changes with them.
        </p>

        <form action={saveShop} className="mg-card p-8 mb-6">
          <h2 className="mg-display text-2xl mb-6">The shop</h2>
          <input type="hidden" name="id" value={shop?.id} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mg-label" htmlFor="s-name">Name</label>
              <input id="s-name" name="name" className="mg-input" defaultValue={shop?.name} />
            </div>
            <div>
              <label className="mg-label" htmlFor="s-phone">Phone</label>
              <input id="s-phone" name="phone" className="mg-input" defaultValue={shop?.phone} />
            </div>
            <div className="sm:col-span-2">
              <label className="mg-label" htmlFor="s-addr">Address</label>
              <input id="s-addr" name="address" className="mg-input" defaultValue={shop?.address} />
            </div>
            <div className="sm:col-span-2">
              <label className="mg-label" htmlFor="s-tag">The line under the name</label>
              <input id="s-tag" name="tagline" className="mg-input" defaultValue={shop?.tagline} />
            </div>
          </div>
          <button className="mg-btn mt-7">Save the shop</button>
        </form>

        <div className="mg-card p-8 mb-6">
          <h2 className="mg-display text-2xl mb-6">What you offer</h2>
          <div className="space-y-8">
            {(services ?? []).map((s) => (
              <form key={s.id} action={saveService}>
                <input type="hidden" name="id" value={s.id} />
                <div className="grid gap-4 sm:grid-cols-[1fr_7rem_7rem]">
                  <div>
                    <label className="mg-label">Name</label>
                    <input name="name" className="mg-input" defaultValue={s.name} />
                  </div>
                  <div>
                    <label className="mg-label">Minutes</label>
                    <input name="minutes" type="number" min={5} step={5}
                      className="mg-input" defaultValue={s.minutes} />
                  </div>
                  <div>
                    <label className="mg-label">Price</label>
                    <input name="price" type="number" min={0} step={1}
                      className="mg-input" defaultValue={s.price_cents / 100} />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mg-label">Description</label>
                  <input name="blurb" className="mg-input" defaultValue={s.blurb} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--body)' }}>
                    <input type="checkbox" name="active" defaultChecked={s.active !== false} />
                    Show this on the booking page
                  </label>
                  <button className="mg-btn mg-btn-quiet !h-11">Save</button>
                </div>
                <div className="mg-rule mt-8" />
              </form>
            ))}
          </div>
        </div>

        <form action={saveHours} className="mg-card p-8">
          <h2 className="mg-display text-2xl mb-6">When you are open</h2>
          <input type="hidden" name="business_id" value={shop?.id} />
          <div className="space-y-4">
            {(hours ?? []).map((h) => (
              <div key={h.weekday} className="grid gap-3 sm:grid-cols-[8rem_auto_7rem_7rem] sm:items-center">
                <span className="mg-display text-lg">{DAY_NAMES[h.weekday]}</span>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--body)' }}>
                  <input type="checkbox" name={`closed_${h.weekday}`} defaultChecked={h.closed} />
                  Closed
                </label>
                <input type="time" name={`open_${h.weekday}`} className="mg-input !h-12"
                  defaultValue={hhmm(h.open_min)} />
                <input type="time" name={`close_${h.weekday}`} className="mg-input !h-12"
                  defaultValue={hhmm(h.close_min)} />
              </div>
            ))}
          </div>
          <button className="mg-btn mt-8">Save the hours</button>
        </form>
      </div>
    </main>
  )
}
