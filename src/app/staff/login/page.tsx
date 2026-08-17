'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { browserClient } from '@/lib/supabase/client'

export default function StaffLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error: err } = await browserClient().auth
      .signInWithPassword({ email, password })
    if (err) { setError(err.message); setBusy(false); return }
    router.push('/staff'); router.refresh()
  }

  async function demo() {
    setBusy(true); setError('')
    const { error: err } = await browserClient().auth
      .signInWithPassword({ email: 'demo@marigold.studio', password: 'marigold1234' })
    if (err) { setError(err.message); setBusy(false); return }
    router.push('/staff'); router.refresh()
  }

  return (
    <main className="mg-wash min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-md mg-rise">
        <Link href="/" className="mg-display text-xl">Marigold Studio</Link>
        <h1 className="mg-display text-4xl mt-8 mb-3">The book.</h1>
        <p className="mb-10 text-lg" style={{ color: 'var(--body)' }}>
          Everything booked today, in one list.
        </p>

        <form onSubmit={signIn} className="mg-card p-8 space-y-5">
          <div>
            <label className="mg-label" htmlFor="e">Email</label>
            <input id="e" type="email" className="mg-input" value={email}
              onChange={(ev) => setEmail(ev.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="mg-label" htmlFor="p">Password</label>
            <input id="p" type="password" className="mg-input" value={password}
              onChange={(ev) => setPassword(ev.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--stop)' }}>{error}</p>}
          <button className="mg-btn w-full" disabled={busy}>
            {busy ? 'One moment…' : 'Sign in'}
          </button>
        </form>

        <div className="mg-card p-6 mt-6">
          <p className="text-sm mb-4" style={{ color: 'var(--body)' }}>
            Have a look around without signing up. The demo account sees the
            same screens the shop owner does.
          </p>
          <button onClick={demo} disabled={busy} className="mg-btn mg-btn-quiet w-full">
            Open the demo book →
          </button>
        </div>
      </div>
    </main>
  )
}
