'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CATEGORIES } from '@/lib/categorizer'
import { isValidIsoDate, isValidUuid, toBoundedString, toPositiveAmount } from '@/lib/validation'

const allowedTransactionTypes = new Set(['expense', 'income'])

export async function addTransaction(data: {
  description: string
  amount: number
  category: string
  type: string
  date: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const description = toBoundedString(data.description, { minLength: 2, maxLength: 180 })
  if (!description) {
    return { error: 'Description must be between 2 and 180 characters' }
  }

  const amount = toPositiveAmount(data.amount)
  if (!amount) {
    return { error: 'Amount must be greater than zero' }
  }

  if (!allowedTransactionTypes.has(data.type)) {
    return { error: 'Invalid transaction type' }
  }

  if (!Object.hasOwn(CATEGORIES, data.category)) {
    return { error: 'Invalid transaction category' }
  }

  if (!isValidIsoDate(data.date)) {
    return { error: 'Invalid transaction date' }
  }

  const { error } = await supabase.from('transactions').insert({
    description,
    amount,
    category: data.category,
    type: data.type,
    date: data.date,
    user_id: user.id
  })

  if (error) return { error: error.message }
  
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) {
    return { error: 'Invalid transaction id' }
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  
  if (error) return { error: error.message }
  
  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true }
}
