'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isValidIsoDate, isValidUuid, toBoundedString, toPositiveAmount, safeErrorMessage } from '@/lib/validation'

export async function addGoal(data: {
  name: string
  targetAmount: number
  emoji: string
  deadline: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = toBoundedString(data.name, { minLength: 2, maxLength: 120 })
  if (!name) {
    return { error: 'Goal name must be between 2 and 120 characters' }
  }

  const targetAmount = toPositiveAmount(data.targetAmount)
  if (!targetAmount) {
    return { error: 'Target amount must be greater than zero' }
  }

  const emoji = toBoundedString(data.emoji, { minLength: 1, maxLength: 16 })
  if (!emoji) {
    return { error: 'Goal emoji is required' }
  }

  if (!isValidIsoDate(data.deadline)) {
    return { error: 'Invalid goal deadline' }
  }

  const { error } = await supabase.from('goals').insert({
    name,
    target_amount: targetAmount,
    current_amount: 0,
    emoji,
    deadline: data.deadline,
    user_id: user.id
  })

  if (error) return { error: safeErrorMessage(error, 'Failed to create goal.') }
  revalidatePath('/goals')
  return { success: true }
}

export async function addContribution(goalId: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(goalId)) {
    return { error: 'Invalid goal id' }
  }

  const safeAmount = toPositiveAmount(amount)
  if (!safeAmount) {
    return { error: 'Contribution amount must be greater than zero' }
  }

  const { error } = await supabase.rpc('add_goal_contribution', {
    p_goal_id: goalId,
    p_amount: safeAmount,
  })

  if (error) return { error: safeErrorMessage(error, 'Failed to add contribution.') }
  
  revalidatePath('/goals')
  return { success: true }
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) {
    return { error: 'Invalid goal id' }
  }

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return { error: safeErrorMessage(error, 'Failed to delete goal.') }
  
  revalidatePath('/goals')
  return { success: true }
}
