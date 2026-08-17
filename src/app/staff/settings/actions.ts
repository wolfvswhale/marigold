'use server'

import { revalidatePath } from 'next/cache'
import { serverClient } from '@/lib/supabase/server'

// Every write below goes through the signed-in user's own session, so the
// database decides what they may touch. Nothing here trusts the form.

export async function saveShop(form: FormData) {
  const sb = await serverClient()
  await sb.from('bk_businesses').update({
    name: String(form.get('name') ?? '').trim(),
    tagline: String(form.get('tagline') ?? '').trim(),
    phone: String(form.get('phone') ?? '').trim(),
    address: String(form.get('address') ?? '').trim(),
  }).eq('id', String(form.get('id')))
  revalidatePath('/staff/settings'); revalidatePath('/')
}

export async function saveService(form: FormData) {
  const dollars = Number(form.get('price') ?? 0)
  const sb = await serverClient()
  await sb.from('bk_services').update({
    name: String(form.get('name') ?? '').trim(),
    blurb: String(form.get('blurb') ?? '').trim(),
    minutes: Math.max(5, Number(form.get('minutes') ?? 45)),
    price_cents: Math.max(0, Math.round(dollars * 100)),
    active: form.get('active') === 'on',
  }).eq('id', String(form.get('id')))
  revalidatePath('/staff/settings'); revalidatePath('/')
}

export async function saveHours(form: FormData) {
  const sb = await serverClient()
  const businessId = String(form.get('business_id'))
  for (let wd = 0; wd < 7; wd++) {
    await sb.from('bk_hours').update({
      closed: form.get(`closed_${wd}`) === 'on',
      open_min: toMinutes(String(form.get(`open_${wd}`) ?? '09:00')),
      close_min: toMinutes(String(form.get(`close_${wd}`) ?? '17:00')),
    }).eq('business_id', businessId).eq('weekday', wd)
  }
  revalidatePath('/staff/settings'); revalidatePath('/')
}

/** "09:30" -> 570 */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
