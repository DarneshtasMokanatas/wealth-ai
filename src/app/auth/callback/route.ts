import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/login?mode=login&error=Authentication%20failed', requestUrl.origin))
    }

    // Write profile data that was stored in user_metadata at signup time
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta = user.user_metadata ?? {}
      const displayName = typeof meta.display_name === 'string' ? meta.display_name : null
      const phoneNumber = typeof meta.phone_number === 'string' ? meta.phone_number : null
      if (displayName || phoneNumber) {
        await supabase.from('profiles').upsert({
          id: user.id,
          ...(displayName ? { display_name: displayName } : {}),
          ...(phoneNumber ? { phone_number: phoneNumber } : {}),
        })
      }
    }
  }

  // Reject protocol-relative URLs (//evil.com) and anything that isn't
  // a plain relative path. Only a single leading slash is allowed.
  const safeNext = /^\/[^/\\]/.test(next) ? next : '/'
  return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
}
