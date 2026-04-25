import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }: any) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 🔥 IMPORTANT: this syncs session internally
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("MIDDLEWARE USER:", user)

  // protect routes
  if (!user && request.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // prevent logged-in users from login page
  if (
    user &&
    (request.nextUrl.pathname === '/auth/login' ||
      request.nextUrl.pathname === '/auth/signup')
  ) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return response
}

export const config = {
  matcher: ['/chat/:path*', '/auth/login', '/auth/signup'],
}