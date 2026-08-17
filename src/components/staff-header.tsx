'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { browserClient } from '@/lib/supabase/client'

export default function StaffHeader({ shopName }: { shopName: string }) {
  const router = useRouter()

  async function out() {
    await browserClient().auth.signOut()
    router.push('/staff/login')
    router.refresh()
  }

  return (
    <header className="mx-auto max-w-4xl px-6 pt-8 flex items-center justify-between">
      <Link href="/staff" className="mg-display text-xl">{shopName}</Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/staff" style={{ color: 'var(--body)' }}>Today</Link>
        <Link href="/staff/settings" style={{ color: 'var(--body)' }}>Settings</Link>
        <Link href="/" style={{ color: 'var(--body)' }}>Booking page</Link>
        <button onClick={out} style={{ color: 'var(--dim)' }}>Sign out</button>
      </nav>
    </header>
  )
}
