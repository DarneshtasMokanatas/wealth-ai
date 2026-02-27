import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

export async function updateSession(request: NextRequest) {
  // Generate a per-request CSP nonce for inline scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // Re-apply nonce header after response recreation
          supabaseResponse.headers.set('x-nonce', nonce)
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protected routes logic
  // If user is NOT logged in and trying to access protected routes
  if (
    !user &&
    !path.startsWith('/login') &&
    !path.startsWith('/auth') &&
    !path.startsWith('/_next') &&
    !path.startsWith('/favicon.ico') && 
    !path.match(/\.(png|jpg|jpeg|svg|gif|webp)$/) // Exclude static assets
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user IS logged in and trying to access login page
  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Attach the nonce header so layout.tsx can read it, and apply nonce-based CSP
  supabaseResponse.headers.set('x-nonce', nonce)

  // Dynamic CSP with per-request nonce — replaces the static 'unsafe-inline'
  const supabaseHost = env.supabaseUrl ? new URL(env.supabaseUrl).host : '*.supabase.co'
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    "img-src 'self' blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://www.gravatar.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
  supabaseResponse.headers.set('Content-Security-Policy', csp)

  return supabaseResponse
}
