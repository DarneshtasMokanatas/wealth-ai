import { createClient } from '@/lib/supabase/server'
import { Transaction, Goal, Category, Budget, BudgetStatus } from './types'

// ─── Data Mapping ───────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
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

/** Returns system categories + the current user's custom categories. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`)

  // System (user_id IS NULL) first, then custom sorted alphabetically
  const rows = (data || []).map(mapCategory)
  rows.sort((a, b) => {
    if (a.is_system !== b.is_system) return a.is_system ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return rows
}

export async function getDashboardStats() {
  const transactions = await getTransactions()

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Current month expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Burn rate: daily average spending this month
  const dayOfMonth = now.getDate();
  const burnRate = dayOfMonth > 0 ? monthlyExpenses / dayOfMonth : 0;

  // Savings rate
  const monthlyIncome = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "income" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

  return {
    balance,
    totalIncome,
    totalExpenses,
    monthlyExpenses,
    burnRate,
    savingsRate,
    monthlyIncome,
  };
}

export async function getCategoryBreakdown(prefetchedCategories?: Category[]) {
  const [transactions, categories] = await Promise.all([
    getTransactions(),
    prefetchedCategories ? Promise.resolve(prefetchedCategories) : getCategories(),
  ])
  const catMap = new Map(categories.map((c) => [c.id, c]))

  const expensesByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
    });

  return Object.entries(expensesByCategory)
    .map(([catId, amount]) => ({
      category: catMap.get(catId)?.name || catId,
      amount,
      color: catMap.get(catId)?.color || "#6b7280",
      icon: catMap.get(catId)?.icon || "📦",
    }))
    .sort((a, b) => b.amount - a.amount);
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
  const transactions = await getTransactions()
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

export interface DayOfWeekPoint {
  day: string        // "Mon" … "Sun"
  total: number
  average: number
  count: number
}

export async function getDayOfWeekBreakdown(): Promise<DayOfWeekPoint[]> {
  const transactions = await getTransactions()
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const acc: { total: number; count: number }[] = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }))

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const idx = new Date(t.date + 'T00:00:00').getDay()
      acc[idx].total += Math.abs(t.amount)
      acc[idx].count += 1
    })

  // Return Mon–Sun order
  const ordered = [1, 2, 3, 4, 5, 6, 0]
  return ordered.map((i) => ({
    day: DAYS[i],
    total: acc[i].total,
    average: acc[i].count > 0 ? acc[i].total / acc[i].count : 0,
    count: acc[i].count,
  }))
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
  const transactions = await getTransactions()
  const now = new Date()
  const curYear = now.getFullYear(), curMonth = now.getMonth()
  const prevYear = curMonth === 0 ? curYear - 1 : curYear
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1

  const current: Record<string, number> = {}
  const previous: Record<string, number> = {}

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const d = new Date(t.date + 'T00:00:00')
      const y = d.getFullYear(), m = d.getMonth()
      const amt = Math.abs(t.amount)
      if (y === curYear && m === curMonth) {
        current[t.category] = (current[t.category] || 0) + amt
      } else if (y === prevYear && m === prevMonth) {
        previous[t.category] = (previous[t.category] || 0) + amt
      }
    })

  const allCats = new Set([...Object.keys(current), ...Object.keys(previous)])
  const categories = await getCategories()
  const catMap = new Map(categories.map((c) => [c.id, c]))

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

// Compact analytics summary for the Gemini prompt
export async function getAnalyticsSummary() {
  const categories = await getCategories()
  const [trend6, dayOfWeek, mom, categoryBreakdown] = await Promise.all([
    getMonthlyTrend(6),
    getDayOfWeekBreakdown(),
    getCategoryMoM(),
    getCategoryBreakdown(categories),
  ])

  const peakDay = [...dayOfWeek].sort((a, b) => b.average - a.average)[0]
  const quietDay = [...dayOfWeek].sort((a, b) => a.average - b.average)[0]

  return {
    monthlyTrend: trend6,
    dayOfWeek,
    categoryMoM: mom,
    topCategories: categoryBreakdown.slice(0, 5),
    peakSpendingDay: peakDay?.day,
    quietestDay: quietDay?.average === 0 ? null : quietDay?.day,
  }
}

export async function getMonthlyHistory() {
  const transactions = await getTransactions();
  const months: Record<string, { income: number; expense: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      months[key] = { income: 0, expense: 0 };
  }

  transactions.forEach(t => {
      const d = new Date(t.date);
      const key = d.toLocaleString('default', { month: 'short' });
      if (months[key]) {
          if (t.type === 'income') months[key].income += t.amount;
          else months[key].expense += t.amount;
      }
  });

  return Object.entries(months).map(([month, data]) => ({
      month,
      amount: data.expense, // For spending
      income: data.income
  }));
}
