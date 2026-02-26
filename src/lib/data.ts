import { createClient } from '@/lib/supabase/server'
import { Transaction, Goal, Category, Budget, BudgetStatus } from './types'

// ─── Data Mapping ───────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
    createdAt: row.created_at,
    isRecurring: row.is_recurring ?? false,
    recurrence: row.recurrence ?? null,
    nextDueDate: row.next_due_date ?? null,
  }
}

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    emoji: row.emoji,
    deadline: row.deadline,
    createdAt: row.created_at,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Data Fetching ──────────────────────────────────────────────────
export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return (data || []).map(mapTransaction)
}

export async function getTransactionsForMonth(year: number, month: number): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const firstDay = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  const lastDay  = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return (data || []).map(mapTransaction)
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('deadline', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`)
  }

  return (data || []).map(mapGoal)
}

// ─── Categories ─────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type ?? 'expense',
    user_id: row.user_id ?? null,
    is_system: row.user_id === null,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function sortCategories(rows: Category[]): Category[] {
  return rows.slice().sort((a, b) => {
    if (a.is_system !== b.is_system) return a.is_system ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

/** Returns system categories + the current user's custom categories. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch system (user_id IS NULL) + user's own categories without string interpolation
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or('user_id.is.null,user_id.eq.' + user.id)

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`)

  return sortCategories((data || []).map(mapCategory))
}

// ─── Pure Compute Functions ─────────────────────────────────────────────────
// Operate on pre-fetched data — zero additional DB calls.

function _computeDashboardStats(transactions: Transaction[]) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const isCurrentMonth = (t: Transaction) => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpenses
  const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && isCurrentMonth(t)).reduce((sum, t) => sum + t.amount, 0)
  const monthlyIncome = transactions.filter((t) => t.type === 'income' && isCurrentMonth(t)).reduce((sum, t) => sum + t.amount, 0)
  const burnRate = now.getDate() > 0 ? monthlyExpenses / now.getDate() : 0
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
  return { balance, totalIncome, totalExpenses, monthlyExpenses, burnRate, savingsRate, monthlyIncome }
}

function _computeCategoryBreakdown(transactions: Transaction[], categories: Category[]) {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const expensesByCategory: Record<string, number> = {}
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount)
  })
  return Object.entries(expensesByCategory)
    .map(([catId, amount]) => ({
      category: catMap.get(catId)?.name || catId,
      amount,
      color: catMap.get(catId)?.color || '#6b7280',
      icon: catMap.get(catId)?.icon || '📦',
    }))
    .sort((a, b) => b.amount - a.amount)
}

function _computeMonthlyHistory(transactions: Transaction[]) {
  const months: Record<string, { income: number; expense: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleString('default', { month: 'short' })
    months[key] = { income: 0, expense: 0 }
  }
  transactions.forEach((t) => {
    const d = new Date(t.date)
    const key = d.toLocaleString('default', { month: 'short' })
    if (months[key]) {
      if (t.type === 'income') months[key].income += t.amount
      else months[key].expense += t.amount
    }
  })
  return Object.entries(months).map(([month, data]) => ({
    month,
    amount: data.expense,
    income: data.income,
  }))
}

function _computeMonthlyTrend(transactions: Transaction[], months: number) {
  const now = new Date()
  const buckets: Record<string, { income: number; expenses: number }> = {}
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('en-MY', { month: 'short', year: 'numeric' })
    buckets[key] = { income: 0, expenses: 0 }
  }
  transactions.forEach((t) => {
    const d = new Date(t.date + 'T00:00:00')
    const key = d.toLocaleString('en-MY', { month: 'short', year: 'numeric' })
    if (!buckets[key]) return
    if (t.type === 'income') buckets[key].income += t.amount
    else buckets[key].expenses += Math.abs(t.amount)
  })
  return Object.entries(buckets).map(([month, v]) => ({
    month,
    income: v.income,
    expenses: v.expenses,
    net: v.income - v.expenses,
  }))
}

function _computeDayOfWeekBreakdown(transactions: Transaction[]) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const acc: { total: number; count: number }[] = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }))
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    const idx = new Date(t.date + 'T00:00:00').getDay()
    acc[idx].total += Math.abs(t.amount)
    acc[idx].count += 1
  })
  const ordered = [1, 2, 3, 4, 5, 6, 0]
  return ordered.map((i) => ({
    day: DAYS[i],
    total: acc[i].total,
    average: acc[i].count > 0 ? acc[i].total / acc[i].count : 0,
    count: acc[i].count,
  }))
}

function _computeCategoryMoM(transactions: Transaction[], categories: Category[]): CategoryMoMPoint[] {
  const now = new Date()
  const curYear = now.getFullYear(), curMonth = now.getMonth()
  const prevYear = curMonth === 0 ? curYear - 1 : curYear
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1
  const current: Record<string, number> = {}
  const previous: Record<string, number> = {}
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    const d = new Date(t.date + 'T00:00:00')
    const y = d.getFullYear(), m = d.getMonth()
    const amt = Math.abs(t.amount)
    if (y === curYear && m === curMonth) current[t.category] = (current[t.category] || 0) + amt
    else if (y === prevYear && m === prevMonth) previous[t.category] = (previous[t.category] || 0) + amt
  })
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const allCats = new Set([...Object.keys(current), ...Object.keys(previous)])
  return Array.from(allCats)
    .map((catId) => {
      const cat = catMap.get(catId)
      const cur = current[catId] || 0
      const prev = previous[catId] || 0
      const change = prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0
      return {
        category: cat?.name ?? catId,
        categoryId: catId,
        color: cat?.color ?? '#6b7280',
        icon: cat?.icon ?? '📦',
        current: cur,
        previous: prev,
        change,
      }
    })
    .filter((c) => c.current > 0 || c.previous > 0)
    .sort((a, b) => b.current - a.current)
}

// ─── Composite Fetchers ──────────────────────────────────────────────────────
// 1 auth call + 2 parallel DB queries per page load.

/** Dashboard fetch using SQL aggregates — no full table scan, always fresh (uncached). */
export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 5 parallel queries returning only aggregated/limited data
  const [statsResult, trendResult, catSpendResult, recentResult, catResult] = await Promise.all([
    supabase.rpc('dashboard_stats'),
    supabase.rpc('analytics_monthly_trend', { p_months: 6 }),
    supabase.rpc('analytics_category_spending'),
    supabase
      .from('transactions')
      .select('id,description,amount,type,category,date,created_at,is_recurring,recurrence,next_due_date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(6),
    supabase.from('categories').select('*').or('user_id.is.null,user_id.eq.' + user.id),
  ])

  if (statsResult.error)    throw new Error(`dashboard_stats: ${statsResult.error.message}`)
  if (trendResult.error)    throw new Error(`analytics_monthly_trend: ${trendResult.error.message}`)
  if (catSpendResult.error) throw new Error(`analytics_category_spending: ${catSpendResult.error.message}`)
  if (recentResult.error)   throw new Error(`recent transactions: ${recentResult.error.message}`)
  if (catResult.error)      throw new Error(`categories: ${catResult.error.message}`)

  const categories = sortCategories((catResult.data || []).map(mapCategory))
  const catMap = new Map(categories.map((c) => [c.id, c]))

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const statsRow = (statsResult.data as any[])?.[0] ?? {}
  const totalIncome    = Number(statsRow.total_income    ?? 0)
  const totalExpenses  = Number(statsRow.total_expenses  ?? 0)
  const monthlyIncome  = Number(statsRow.monthly_income  ?? 0)
  const monthlyExpenses= Number(statsRow.monthly_expenses?? 0)
  const burnRate       = Number(statsRow.burn_rate       ?? 0)
  const savingsRate    = Number(statsRow.savings_rate    ?? 0)

  const categoryBreakdown = (catSpendResult.data as any[] || []).map((r: any) => ({
    category: catMap.get(r.category_id as string)?.name  ?? (r.category_id as string),
    amount:   Number(r.total),
    color:    catMap.get(r.category_id as string)?.color ?? '#6b7280',
    icon:     catMap.get(r.category_id as string)?.icon  ?? '📦',
  }))

  // 'Jan 2025' → 'Jan' for the SpendingChart x-axis
  const monthlyHistory = (trendResult.data as any[] || []).map((r: any) => ({
    month:  (r.month_label as string).split(' ')[0],
    amount: Number(r.expenses),
    income: Number(r.income),
  }))
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    stats: { balance: totalIncome - totalExpenses, totalIncome, totalExpenses, monthlyExpenses, burnRate, savingsRate, monthlyIncome },
    categoryBreakdown,
    monthlyHistory,
    recentTransactions: (recentResult.data || []).map(mapTransaction),
    categories,
  }
}

// ─── Analytics Fetch ──────────────────────────────────────────────────────
// Note: createClient() calls cookies() which is a Next.js dynamic API.
// It MUST run in request context and cannot be placed inside unstable_cache.
/* eslint-disable @typescript-eslint/no-explicit-any */

/** SQL-aggregate analytics fetch — always runs in request context. */
export async function getAnalyticsData(months: 3 | 6 | 12 = 6) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userId = user.id

  const [trendResult, dowResult, momResult, catSpendResult, catResult] = await Promise.all([
    supabase.rpc('analytics_monthly_trend', { p_months: months }),
    supabase.rpc('analytics_day_of_week'),
    supabase.rpc('analytics_category_mom'),
    supabase.rpc('analytics_category_spending'),
    supabase.from('categories').select('*').or('user_id.is.null,user_id.eq.' + userId),
  ])

  if (trendResult.error)    throw new Error(`analytics_monthly_trend: ${trendResult.error.message}`)
  if (dowResult.error)      throw new Error(`analytics_day_of_week: ${dowResult.error.message}`)
  if (momResult.error)      throw new Error(`analytics_category_mom: ${momResult.error.message}`)
  if (catSpendResult.error) throw new Error(`analytics_category_spending: ${catSpendResult.error.message}`)
  if (catResult.error)      throw new Error(`categories: ${catResult.error.message}`)

  const categories = sortCategories((catResult.data || []).map(mapCategory))
  const catMap = new Map(categories.map((c) => [c.id, c]))

  const monthlyTrend: MonthlyTrendPoint[] = (trendResult.data as any[] || []).map((r: any) => ({
    month:    r.month_label as string,
    income:   Number(r.income),
    expenses: Number(r.expenses),
    net:      Number(r.net),
  }))

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowMap = new Map((dowResult.data as any[] || []).map((r: any) => [Number(r.dow), r]))
  const ordered = [1, 2, 3, 4, 5, 6, 0]
  const dayOfWeek: DayOfWeekPoint[] = ordered.map((i) => {
    const row = dowMap.get(i)
    const total = row ? Number(row.total) : 0
    const count = row ? Number(row.tx_count) : 0
    return { day: DAYS[i], total, average: count > 0 ? total / count : 0, count }
  })

  const categoryMoM: CategoryMoMPoint[] = (momResult.data as any[] || []).map((r: any) => {
    const cat = catMap.get(r.category_id as string)
    const cur  = Number(r.current_total)
    const prev = Number(r.previous_total)
    const change = prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0
    return {
      category:   cat?.name  ?? (r.category_id as string),
      categoryId: r.category_id as string,
      color:      cat?.color ?? '#6b7280',
      icon:       cat?.icon  ?? '📦',
      current: cur, previous: prev, change,
    }
  })

  const topCategories = (catSpendResult.data as any[] || []).map((r: any) => ({
    category: catMap.get(r.category_id as string)?.name  ?? (r.category_id as string),
    amount:   Number(r.total),
    color:    catMap.get(r.category_id as string)?.color ?? '#6b7280',
    icon:     catMap.get(r.category_id as string)?.icon  ?? '📦',
  }))

  const peakSpendingDay = [...dayOfWeek].sort((a, b) => b.average - a.average)[0]?.day
  const q = [...dayOfWeek].sort((a, b) => a.average - b.average)[0]
  const quietestDay = q?.average === 0 ? null : q?.day

  return { monthlyTrend, dayOfWeek, categoryMoM, topCategories, peakSpendingDay, quietestDay, categories }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getDashboardStats() {
  return _computeDashboardStats(await getTransactions())
}

export async function getCategoryBreakdown(prefetchedCategories?: Category[]) {
  const [transactions, categories] = await Promise.all([
    getTransactions(),
    prefetchedCategories ? Promise.resolve(prefetchedCategories) : getCategories(),
  ])
  return _computeCategoryBreakdown(transactions, categories)
}

// ─── Budget Helpers ─────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapBudget(row: any): Budget {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    period: row.period,
    createdAt: row.created_at,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch budgets: ${error.message}`)
  return (data || []).map(mapBudget)
}

export async function getBudgetStatuses(): Promise<BudgetStatus[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const budgets = await getBudgets()
  if (budgets.length === 0) return []

  // Current calendar month boundaries (UTC)
  const now = new Date()
  const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
    .toISOString()
    .slice(0, 10)
  const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
    .toISOString()
    .slice(0, 10)

  // Aggregate current-month expenses per category in one query
  const { data: spendRows, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('date', firstDay)
    .lte('date', lastDay)

  if (error) throw new Error(`Failed to aggregate spending: ${error.message}`)

  const spendByCategory: Record<string, number> = {}
  for (const row of spendRows || []) {
    // Use abs to handle both positive and negative storage conventions
    spendByCategory[row.category] = (spendByCategory[row.category] || 0) + Math.abs(Number(row.amount))
  }

  return budgets
    .map((budget): BudgetStatus => {
      const spent = spendByCategory[budget.category] || 0
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      return {
        ...budget,
        spent,
        percentage,
        isWarning: percentage >= 80,
        isExceeded: percentage >= 100,
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
}

// ─── Notification Objects ────────────────────────────────────────────────────
export interface BudgetNotification {
  id: string
  title: string
  body: string
  time: string
  severity: 'warning' | 'exceeded'
}

export function buildBudgetNotifications(statuses: BudgetStatus[], categories: Category[]): BudgetNotification[] {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  return statuses
    .filter((s) => s.isWarning)
    .map((s) => {
      const cat = catMap.get(s.category)
      const name = cat?.name ?? s.category
      const icon = cat?.icon ?? '📦'
      const exceeded = s.isExceeded
      return {
        id: `budget-${s.id}`,
        title: exceeded
          ? `${icon} ${name} — budget exceeded`
          : `${icon} ${name} — 80% of budget reached`,
        body: `Spent MYR ${s.spent.toFixed(2)} of MYR ${s.amount.toFixed(2)} this month (${Math.round(s.percentage)}%).`,
        time: 'This month',
        severity: exceeded ? 'exceeded' : 'warning',
      }
    })
}

// ─── Analytics Data Functions ──────────────────────────────────────────────

export interface MonthlyTrendPoint {
  month: string      // e.g. "Jan 2025"
  income: number
  expenses: number
  net: number
}

export async function getMonthlyTrend(months: 3 | 6 | 12 = 6): Promise<MonthlyTrendPoint[]> {
  return _computeMonthlyTrend(await getTransactions(), months)
}

export interface DayOfWeekPoint {
  day: string        // "Mon" … "Sun"
  total: number
  average: number
  count: number
}

export async function getDayOfWeekBreakdown(): Promise<DayOfWeekPoint[]> {
  return _computeDayOfWeekBreakdown(await getTransactions())
}

export interface CategoryMoMPoint {
  category: string
  categoryId: string
  color: string
  icon: string
  current: number
  previous: number
  change: number        // percentage change, null treated as 0 base
}

export async function getCategoryMoM(): Promise<CategoryMoMPoint[]> {
  const [transactions, categories] = await Promise.all([getTransactions(), getCategories()])
  return _computeCategoryMoM(transactions, categories)
}

// Compact analytics summary for the Gemini prompt
export async function getAnalyticsSummary() {
  const data = await getAnalyticsData(6)
  if (!data) {
    return { monthlyTrend: [], dayOfWeek: [], categoryMoM: [], topCategories: [], peakSpendingDay: undefined, quietestDay: null }
  }
  return {
    monthlyTrend: data.monthlyTrend,
    dayOfWeek: data.dayOfWeek,
    categoryMoM: data.categoryMoM,
    topCategories: data.topCategories.slice(0, 5),
    peakSpendingDay: data.peakSpendingDay,
    quietestDay: data.quietestDay,
  }
}

export async function getMonthlyHistory() {
  return _computeMonthlyHistory(await getTransactions())
}
