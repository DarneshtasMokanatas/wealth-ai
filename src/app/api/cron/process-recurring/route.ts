import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function addInterval(dateStr: string, recurrence: 'weekly' | 'monthly'): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (recurrence === 'weekly') {
    d.setUTCDate(d.getUTCDate() + 7)
  } else {
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  // ── Auth: validate cron secret ──────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!env.cronSecret || token !== env.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  // ── Fetch all due recurring transactions ─────────────────────────────────
  const { data: due, error: fetchError } = await supabase
    .from('transactions')
    .select('id, user_id, description, amount, type, category, recurrence, next_due_date')
    .eq('is_recurring', true)
    .lte('next_due_date', today)

  if (fetchError) {
    console.error('[cron] fetch error:', fetchError.message)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let processed = 0
  const errors: string[] = []

  for (const tx of due) {
    const recurrence = tx.recurrence as 'weekly' | 'monthly'
    const occurrenceDate = tx.next_due_date as string
    const newNextDueDate = addInterval(occurrenceDate, recurrence)

    // Insert the new occurrence
    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: tx.user_id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: occurrenceDate,
      is_recurring: true,
      recurrence,
      next_due_date: newNextDueDate,
    })

    if (insertError) {
      errors.push(`Insert for ${tx.id}: ${insertError.message}`)
      continue
    }

    // Advance the source row's next_due_date (it acts as the "series anchor")
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ next_due_date: newNextDueDate })
      .eq('id', tx.id)

    if (updateError) {
      errors.push(`Advance for ${tx.id}: ${updateError.message}`)
      continue
    }

    processed++
  }

  console.log(`[cron] process-recurring: processed=${processed}, errors=${errors.length}`)

  return NextResponse.json({
    processed,
    ...(errors.length > 0 ? { errors } : {}),
  })
}
