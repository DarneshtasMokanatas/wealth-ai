'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isValidIsoDate, isValidUuid, toBoundedString, toPositiveAmount, safeErrorMessage } from '@/lib/validation'
import type { RecurrenceType } from '@/lib/types'

const allowedTransactionTypes = new Set(['expense', 'income'])
const allowedRecurrenceTypes = new Set<string>(['weekly', 'monthly'])

function computeNextDueDate(fromDate: string, recurrence: RecurrenceType): string {
  const d = new Date(`${fromDate}T00:00:00Z`)
  if (recurrence === 'weekly') {
    d.setUTCDate(d.getUTCDate() + 7)
  } else {
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return d.toISOString().slice(0, 10)
}

export async function addTransaction(data: {
  description: string
  amount: number
  category: string
  type: string
  date: string
  isRecurring?: boolean
  recurrence?: string
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

  // Validate category exists and belongs to this user (or is a system category)
  if (!isValidUuid(data.category)) {
    return { error: 'Invalid transaction category' }
  }
  // Defensive: user.id comes from supabase.auth.getUser() but validate UUID shape
  // before interpolating into a filter string to prevent accidental injection.
  if (!isValidUuid(user.id)) return { error: 'Session error' }
  const { data: catRow } = await supabase
    .from('categories')
    .select('id')
    .eq('id', data.category)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .single()
  if (!catRow) {
    return { error: 'Invalid transaction category' }
  }

  if (!isValidIsoDate(data.date)) {
    return { error: 'Invalid transaction date' }
  }

  const isRecurring = data.isRecurring === true
  let recurrence: RecurrenceType | null = null
  let nextDueDate: string | null = null

  if (isRecurring) {
    if (!data.recurrence || !allowedRecurrenceTypes.has(data.recurrence)) {
      return { error: 'Recurrence must be weekly or monthly' }
    }
    recurrence = data.recurrence as RecurrenceType
    nextDueDate = computeNextDueDate(data.date, recurrence)
  }

  const { error } = await supabase.from('transactions').insert({
    description,
    amount,
    category: data.category,
    type: data.type,
    date: data.date,
    user_id: user.id,
    is_recurring: isRecurring,
    recurrence,
    next_due_date: nextDueDate,
  })

  if (error) return { error: safeErrorMessage(error, 'Failed to add transaction.') }

  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true as const }
}

export async function updateTransaction(id: string, data: {
  description: string
  amount: number
  category: string
  isRecurring: boolean
  recurrence?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) return { error: 'Invalid transaction id' }

  const description = toBoundedString(data.description, { minLength: 2, maxLength: 180 })
  if (!description) return { error: 'Description must be between 2 and 180 characters' }

  const amount = toPositiveAmount(data.amount)
  if (!amount) return { error: 'Amount must be greater than zero' }

  // Validate category exists and belongs to this user (or is a system category)
  if (!isValidUuid(data.category)) return { error: 'Invalid category' }
  if (!isValidUuid(user.id)) return { error: 'Session error' }
  const { data: catRow } = await supabase
    .from('categories')
    .select('id')
    .eq('id', data.category)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .single()
  if (!catRow) return { error: 'Invalid category' }

  const isRecurring = data.isRecurring === true
  let recurrence: RecurrenceType | null = null
  let nextDueDate: string | null = null

  if (isRecurring) {
    if (!data.recurrence || !allowedRecurrenceTypes.has(data.recurrence)) {
      return { error: 'Recurrence must be weekly or monthly' }
    }
    recurrence = data.recurrence as RecurrenceType
    // Fetch the existing date so next_due_date is computed from it
    const { data: existing } = await supabase
      .from('transactions')
      .select('date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    const baseDate = existing?.date ?? new Date().toISOString().slice(0, 10)
    nextDueDate = computeNextDueDate(baseDate, recurrence)
  }

  const { error } = await supabase
    .from('transactions')
    .update({ description, amount, category: data.category, is_recurring: isRecurring, recurrence, next_due_date: nextDueDate })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: safeErrorMessage(error, 'Failed to update transaction.') }

  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true as const }
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

  if (error) return { error: safeErrorMessage(error, 'Failed to delete transaction.') }

  revalidatePath('/transactions')
  revalidatePath('/')
  return { success: true as const }
}
