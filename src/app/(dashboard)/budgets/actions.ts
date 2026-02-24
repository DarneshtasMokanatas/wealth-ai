'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isValidUuid, toPositiveAmount } from '@/lib/validation'

export async function addBudget(category: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Validate category exists, belongs to this user (or is system), and is not income-type
  const { data: catRow } = await supabase
    .from('categories')
    .select('id, type')
    .eq('id', category)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .single()
  if (!catRow) return { error: 'Invalid category' }
  if (catRow.type === 'income') return { error: 'Income categories cannot have budgets' }

  const safeAmount = toPositiveAmount(amount)
  if (!safeAmount) {
    return { error: 'Amount must be greater than zero' }
  }

  const { error } = await supabase.from('budgets').insert({
    user_id: user.id,
    category,
    amount: safeAmount,
    period: 'monthly',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A monthly budget for that category already exists. Edit or delete it first.' }
    }
    return { error: error.message }
  }

  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true as const }
}

export async function updateBudget(id: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) {
    return { error: 'Invalid budget id' }
  }

  const safeAmount = toPositiveAmount(amount)
  if (!safeAmount) {
    return { error: 'Amount must be greater than zero' }
  }

  const { error } = await supabase
    .from('budgets')
    .update({ amount: safeAmount })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true as const }
}

export async function deleteBudget(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) {
    return { error: 'Invalid budget id' }
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/')
  return { success: true as const }
}
