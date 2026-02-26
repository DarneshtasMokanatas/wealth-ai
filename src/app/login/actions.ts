'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { validatePassword } from '@/lib/validation'
import { checkRateLimit, LOGIN_LIMIT, FORGOT_PASSWORD_LIMIT } from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/security-logger'

const buildAuthRedirect = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params)
  return `/login?${searchParams.toString()}`
}

async function getBaseUrl() {
  // ── Security: always prefer the explicit allow-listed origin ──────
  // NEXT_PUBLIC_SITE_URL must be set in production. The header-derived
  // fallback is intentionally restricted to localhost so that a spoofed
  // x-forwarded-host header can never poison a password-reset link in
  // production.
  if (env.siteUrl) {
    return env.siteUrl.replace(/\/$/, '')
  }

  // Dev-only fallback — accept host header only when it is localhost / 127.x
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? ''
  const isLocalhost =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    /^127\.0\.0\.\d+/.test(host)

  if (isLocalhost) {
    const protocol = headerStore.get('x-forwarded-proto') ?? 'http'
    return `${protocol}://${host}`
  }

  // Hard-coded safe fallback — never an attacker-controlled value
  return 'http://localhost:3000'
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const mode = (formData.get('mode') as string) || 'login'

  // Rate limit by IP (from x-forwarded-for) to prevent brute-force attacks
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(LOGIN_LIMIT, ip)
  if (!rl.allowed) {
    logSecurityEvent({ event: 'rate_limit:exceeded', ip, meta: { limiter: 'login' } })
    return redirect(buildAuthRedirect({ mode, error: 'Too many login attempts. Please wait a minute.' }))
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const passwordError = validatePassword(data.password)
  if (passwordError) {
    return redirect(buildAuthRedirect({ mode, error: passwordError }))
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    logSecurityEvent({ event: 'auth:login_failure', ip })
    return redirect(buildAuthRedirect({ mode, error: 'Invalid login credentials' }))
  }

  logSecurityEvent({ event: 'auth:login_success', ip })
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const mode = (formData.get('mode') as string) || 'signup'

  const displayName = (formData.get('display_name') as string | null)?.trim() ?? ''
  const phoneNumber = (formData.get('phone_number') as string | null)?.trim() ?? ''

  if (!displayName) {
    return redirect(buildAuthRedirect({ mode, error: 'Display name is required.' }))
  }
  if (!phoneNumber) {
    return redirect(buildAuthRedirect({ mode, error: 'Phone number is required.' }))
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        display_name: displayName,
        phone_number: phoneNumber,
      },
    },
  }

  const passwordError = validatePassword(data.password)
  if (passwordError) {
    return redirect(buildAuthRedirect({ mode, error: passwordError }))
  }

  const { data: { user, session }, error } = await supabase.auth.signUp(data)

  if (error) {
    return redirect(buildAuthRedirect({ mode, error: 'Could not authenticate user' }))
  }

  // Email confirmation is disabled — session is returned immediately
  if (session && user) {
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      phone_number: phoneNumber,
    })

    revalidatePath('/', 'layout')
    redirect('/')
  }

  // Email confirmation is enabled — profile will be written in the auth callback
  return redirect(buildAuthRedirect({ mode: 'login', success: 'Check your email to verify your account.' }))
}

export async function forgotPassword(formData: FormData) {
  // Rate limit forgot-password by IP to prevent email flooding
  const headerStore2 = await headers()
  const ip2 = headerStore2.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl2 = checkRateLimit(FORGOT_PASSWORD_LIMIT, ip2)
  if (!rl2.allowed) {
    redirect(buildAuthRedirect({ mode: 'forgot', error: 'Too many requests. Please wait a minute.' }))
  }

  const supabase = await createClient()
  const email = String(formData.get('email') ?? '').trim()

  if (!email) {
    redirect(buildAuthRedirect({ mode: 'forgot', error: 'Email is required.' }))
  }

  const baseUrl = await getBaseUrl()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/login?message=Password%20reset%20verified.%20Please%20set%20a%20new%20password.`,
  })

  if (error) {
    redirect(buildAuthRedirect({ mode: 'forgot', error: 'Unable to send reset email. Please try again.' }))
  }

  redirect(buildAuthRedirect({ mode: 'forgot', success: 'If that account exists, a reset link has been sent.' }))
}

export async function socialAuth(formData: FormData) {
  const supabase = await createClient()
  const provider = String(formData.get('provider') ?? '').trim().toLowerCase()

  if (provider !== 'google' && provider !== 'facebook') {
    redirect(buildAuthRedirect({ mode: 'login', error: 'Social login provider is not supported.' }))
  }

  const baseUrl = await getBaseUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=/`,
    },
  })

  if (error || !data.url) {
    redirect(buildAuthRedirect({ mode: 'login', error: 'Social login is unavailable right now.' }))
  }

  redirect(data.url)
}
