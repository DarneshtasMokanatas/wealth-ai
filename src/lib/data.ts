import { createClient } from '@/lib/supabase/server'
import { Transaction, Goal, CategoryType } from './types'
import { CATEGORIES } from './categorizer'

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

export async function getCategoryBreakdown() {
  const transactions = await getTransactions()
  const expensesByCategory: Record<string, number> = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    });

  return Object.entries(expensesByCategory)
    .map(([catId, amount]) => ({
      category: CATEGORIES[catId as CategoryType]?.name || catId,
      amount,
      color: CATEGORIES[catId as CategoryType]?.color || "#6b7280",
      icon: CATEGORIES[catId as CategoryType]?.icon || "📦",
    }))
    .sort((a, b) => b.amount - a.amount);
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
