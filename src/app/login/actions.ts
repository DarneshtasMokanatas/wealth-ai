'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

const buildAuthRedirect = (params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params)
  return `/login?${searchParams.toString()}`
}

async function getBaseUrl() {
  const headerStore = await headers()
  const origin = headerStore.get('origin')
  if (origin) {
    return origin
  }

  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'

  if (host) {
    return `${protocol}://${host}`
  }

  return env.siteUrl || 'http://localhost:3000'
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const mode = (formData.get('mode') as string) || 'login'

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect(buildAuthRedirect({ mode, error: 'Invalid login credentials' }))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const mode = (formData.get('mode') as string) || 'signup'

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: { session }, error } = await supabase.auth.signUp(data)

  if (error) {
    return redirect(buildAuthRedirect({ mode, error: 'Could not authenticate user' }))
  }
  
  if (!session) {
    return redirect(buildAuthRedirect({ mode: 'login', success: 'Check your email to verify your account.' }))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function forgotPassword(formData: FormData) {
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
