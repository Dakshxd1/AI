import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split('; ')
            .filter(Boolean)
            .map((c) => {
              const [name, ...rest] = c.split('=')
              return { name, value: rest.join('=') }
            })
        },

        setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
          cookies.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}; path=/`

            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
            if (options?.domain) cookie += `; domain=${options.domain}`
            if (options?.secure) cookie += `; secure`
            if (options?.sameSite) cookie += `; samesite=${options.sameSite}`

            document.cookie = cookie
          })
        },
      },
    }
  )
}