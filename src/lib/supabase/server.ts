import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function serverClient() {
  const jar = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          // Server components are not allowed to set cookies. The proxy
          // refreshes the session instead, so swallowing this is correct
          // rather than lazy.
          try {
            list.forEach(({ name, value, options }) => jar.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
