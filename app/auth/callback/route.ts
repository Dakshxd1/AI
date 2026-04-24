import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from Supabase (e.g. expired OTP)
  if (error) {
    const msg = errorDescription || error
    return NextResponse.redirect(
      `${origin}/auth/login?message=${encodeURIComponent(msg)}`
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (sessionError) {
      return NextResponse.redirect(
        `${origin}/auth/login?message=${encodeURIComponent(sessionError.message)}`
      )
    }
  }

  return NextResponse.redirect(`${origin}/chat`)
}
