'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCategories } from '@/lib/data'
import { toBoundedString, isValidUuid } from '@/lib/validation'
import type { Category } from '@/lib/types'

export { getCategories as getUserCategories }

const ALLOWED_TYPES = new Set(['expense', 'income', 'savings'])

export async function addCategory(data: {
  name: string
  icon: string
  color: string
  type: string
}): Promise<{ success: true; category: Category } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = toBoundedString(data.name, { minLength: 2, maxLength: 40 })
  if (!name) return { error: 'Name must be between 2 and 40 characters' }

  const icon = (data.icon ?? '').trim().slice(0, 8)
  if (!icon) return { error: 'Icon is required' }

  const color = /^#[0-9a-fA-F]{6}$/.test(data.color) ? data.color : null
  if (!color) return { error: 'Color must be a valid hex value (e.g. #ff6600)' }

  if (!ALLOWED_TYPES.has(data.type)) return { error: 'Type must be expense, income, or savings' }

  const id = crypto.randomUUID()

  const { data: row, error } = await supabase
    .from('categories')
    .insert({ id, name, icon, color, type: data.type, user_id: user.id })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return { error: `You already have a category named "${name}"` }
    return { error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  revalidatePath('/budgets')

  return {
    success: true,
    category: {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      user_id: row.user_id,
      is_system: false,
    },
  }
}

export async function updateCategory(
  id: string,
  data: { name?: string; icon?: string; color?: string; type?: string }
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) return { error: 'Invalid category id' }

  // Only allow updating own custom categories
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id) // system rows have user_id = null, so they won't match
    .single()

  if (!existing) return { error: 'Category not found or cannot be edited' }

  const updates: Record<string, string> = {}

  if (data.name !== undefined) {
    const name = toBoundedString(data.name, { minLength: 2, maxLength: 40 })
    if (!name) return { error: 'Name must be between 2 and 40 characters' }
    updates.name = name
  }

  if (data.icon !== undefined) {
    const icon = data.icon.trim().slice(0, 8)
    if (!icon) return { error: 'Icon is required' }
    updates.icon = icon
  }

  if (data.color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(data.color)) return { error: 'Color must be a valid hex value' }
    updates.color = data.color
  }

  if (data.type !== undefined) {
    if (!ALLOWED_TYPES.has(data.type)) return { error: 'Type must be expense, income, or savings' }
    updates.type = data.type
  }

  if (Object.keys(updates).length === 0) return { success: true }

  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23505') return { error: `You already have a category with that name` }
    return { error: error.message }
  }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  revalidatePath('/budgets')
  return { success: true }
}

export async function deleteCategory(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isValidUuid(id)) return { error: 'Invalid category id' }

  // Verify it's the user's own custom category
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) return { error: 'Category not found or cannot be deleted' }

  // Check references
  const [{ count: txCount }, { count: budgetCount }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', id),
    supabase
      .from('budgets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', id),
  ])

  const parts: string[] = []
  if ((txCount ?? 0) > 0) parts.push(`${txCount} transaction${txCount === 1 ? '' : 's'}`)
  if ((budgetCount ?? 0) > 0) parts.push(`${budgetCount} budget${budgetCount === 1 ? '' : 's'}`)

  if (parts.length > 0) {
    return {
      error: `Cannot delete — this category is used by ${parts.join(' and ')}. Reassign them first.`,
    }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/categories')
  revalidatePath('/transactions')
  revalidatePath('/budgets')
  return { success: true }
}
