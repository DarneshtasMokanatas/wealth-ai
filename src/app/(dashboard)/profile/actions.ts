'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { toBoundedString, validatePassword } from '@/lib/validation'

export async function updateProfile(data: {
  displayName: string
  phoneNumber: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const displayName = toBoundedString(data.displayName, { minLength: 2, maxLength: 80 })
  if (!displayName) {
    return { error: 'Display name must be between 2 and 80 characters' }
  }

  const phoneNumber = toBoundedString(data.phoneNumber, { minLength: 0, maxLength: 30 }) ?? ''

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, phone_number: phoneNumber || null })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // Keep auth user_metadata in sync so all fallback sources agree
  await supabase.auth.updateUser({ data: { display_name: displayName } })

  revalidatePath('/profile')
  revalidatePath('/')
  return { success: true }
}

export async function updatePassword(data: {
  newPassword: string
  confirmPassword: string
}) {
  if (data.newPassword !== data.confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const passwordError = validatePassword(data.newPassword)
  if (passwordError) return { error: passwordError }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.auth.updateUser({ password: data.newPassword })
  if (error) return { error: error.message }

  return { success: true }
}
