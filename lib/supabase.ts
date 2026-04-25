import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split('; ')
            .map((c) => {
              const [name, ...rest] = c.split('=')
              return { name, value: rest.join('=') }
            })
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=/`
          })
        },
      },
    }
  )
}