import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return document.cookie
            .split('; ')
            .map((c) => {
              const [name, ...rest] = c.split('=')
              return { name, value: rest.join('=') }
            })
        },

        setAll(
          cookies: Array<{
            name: string
            value: string
            options: CookieOptions
          }>
        ) {
          cookies.forEach(({ name, value }) => {
            document.cookie = `${name}=${value}; path=/`
          })
        },
      },
    }
  )
}