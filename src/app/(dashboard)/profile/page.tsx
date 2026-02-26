import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileView from './profile-view'

export const metadata = { title: 'Profile — Wealth AI' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch base profile first (same columns as header — known to work)
  const { data: baseProfile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, created_at')
    .eq('id', user.id)
    .single()

  // Fetch phone separately so a missing column never silences the whole row
  const { data: phoneRow } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', user.id)
    .single()

  // Fallback chain: profiles table → auth user_metadata (set at signup) → email prefix
  const meta = user.user_metadata ?? {}
  const displayName =
    baseProfile?.display_name ||
    (typeof meta.display_name === 'string' ? meta.display_name : '') ||
    user.email?.split('@')[0] ||
    ''

  return (
    <ProfileView
      email={user.email ?? ''}
      displayName={displayName}
      phoneNumber={phoneRow?.phone_number ?? ''}
      avatarUrl={baseProfile?.avatar_url ?? null}
      memberSince={baseProfile?.created_at ?? user.created_at}
    />
  )
}
