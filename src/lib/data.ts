"use client";

import { Transaction, Goal, CategoryType } from "./types";
import { CATEGORIES } from "./categorizer";

// ─── Sample Transactions ────────────────────────────────────────────
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    description: "Monthly Salary",
    amount: 5200,
    type: "income",
    category: "income",
    date: "2026-02-01",
    createdAt: "2026-02-01T09:00:00Z",
  },
  {
    id: "t2",
    description: "Apartment Rent",
    amount: 1400,
    type: "expense",
    category: "bills",
    date: "2026-02-01",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "t3",
    description: "Grocery Shopping at Whole Foods",
    amount: 87.5,
    type: "expense",
    category: "food",
    date: "2026-02-02",
    createdAt: "2026-02-02T14:30:00Z",
  },
  {
    id: "t4",
    description: "Uber ride to downtown",
    amount: 18.75,
    type: "expense",
    category: "transport",
    date: "2026-02-03",
    createdAt: "2026-02-03T08:15:00Z",
  },
  {
    id: "t5",
    description: "Netflix Subscription",
    amount: 15.99,
    type: "expense",
    category: "entertainment",
    date: "2026-02-03",
    createdAt: "2026-02-03T12:00:00Z",
  },
  {
    id: "t6",
    description: "Gym Membership",
    amount: 49.99,
    type: "expense",
    category: "health",
    date: "2026-02-04",
    createdAt: "2026-02-04T07:00:00Z",
  },
  {
    id: "t7",
    description: "New Running Shoes - Nike",
    amount: 129.99,
    type: "expense",
    category: "shopping",
    date: "2026-02-05",
    createdAt: "2026-02-05T16:45:00Z",
  },
  {
    id: "t8",
    description: "Chipotle Burrito Bowl",
    amount: 12.5,
    type: "expense",
    category: "food",
    date: "2026-02-06",
    createdAt: "2026-02-06T12:30:00Z",
  },
  {
    id: "t9",
    description: "Electricity Bill",
    amount: 95.0,
    type: "expense",
    category: "bills",
    date: "2026-02-07",
    createdAt: "2026-02-07T09:00:00Z",
  },
  {
    id: "t10",
    description: "Udemy Course - React Masterclass",
    amount: 14.99,
    type: "expense",
    category: "education",
    date: "2026-02-08",
    createdAt: "2026-02-08T20:00:00Z",
  },
  {
    id: "t11",
    description: "Freelance Web Design Payment",
    amount: 800,
    type: "income",
    category: "income",
    date: "2026-02-09",
    createdAt: "2026-02-09T11:00:00Z",
  },
  {
    id: "t12",
    description: "Starbucks Latte",
    amount: 6.5,
    type: "expense",
    category: "food",
    date: "2026-02-10",
    createdAt: "2026-02-10T08:30:00Z",
  },
  {
    id: "t13",
    description: "Internet Bill",
    amount: 65.0,
    type: "expense",
    category: "bills",
    date: "2026-02-10",
    createdAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "t14",
    description: "Gas Station Fill-up",
    amount: 45.0,
    type: "expense",
    category: "transport",
    date: "2026-02-11",
    createdAt: "2026-02-11T07:30:00Z",
  },
  {
    id: "t15",
    description: "Movie Tickets - Dune 3",
    amount: 28.0,
    type: "expense",
    category: "entertainment",
    date: "2026-02-12",
    createdAt: "2026-02-12T19:00:00Z",
  },
];

// ─── Sample Goals ───────────────────────────────────────────────────
const INITIAL_GOALS: Goal[] = [
  {
    id: "g1",
    name: "Japan Trip",
    targetAmount: 3000,
    currentAmount: 1250,
    emoji: "🗾",
    deadline: "2026-09-01",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "g2",
    name: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 6500,
    emoji: "🏦",
    deadline: "2026-12-31",
    createdAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "g3",
    name: "New MacBook Pro",
    targetAmount: 2500,
    currentAmount: 800,
    emoji: "💻",
    deadline: "2026-06-01",
    createdAt: "2026-01-20T10:00:00Z",
  },
];

// ─── Monthly History Data (for charts) ──────────────────────────────
export const MONTHLY_SPENDING = [
  { month: "Sep", amount: 2100 },
  { month: "Oct", amount: 2450 },
  { month: "Nov", amount: 1980 },
  { month: "Dec", amount: 2800 },
  { month: "Jan", amount: 2350 },
  { month: "Feb", amount: 1969 },
];

export const MONTHLY_INCOME = [
  { month: "Sep", amount: 5200 },
  { month: "Oct", amount: 5200 },
  { month: "Nov", amount: 5800 },
  { month: "Dec", amount: 5200 },
  { month: "Jan", amount: 6000 },
  { month: "Feb", amount: 6000 },
];

// ─── In-Memory Store ────────────────────────────────────────────────
let transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let goals: Goal[] = [...INITIAL_GOALS];

// ─── Transaction CRUD ───────────────────────────────────────────────
export function getTransactions(): Transaction[] {
  return [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function addTransaction(
  data: Omit<Transaction, "id" | "createdAt">
): Transaction {
  const tx: Transaction = {
    ...data,
    id: `t${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  transactions = [tx, ...transactions];
  return tx;
}

export function deleteTransaction(id: string): void {
  transactions = transactions.filter((t) => t.id !== id);
}

// ─── Goal CRUD ──────────────────────────────────────────────────────
export function getGoals(): Goal[] {
  return [...goals].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );
}

export function addGoal(
  data: Omit<Goal, "id" | "createdAt" | "currentAmount">
): Goal {
  const goal: Goal = {
    ...data,
    currentAmount: 0,
    id: `g${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  goals = [goal, ...goals];
  return goal;
}

export function addContribution(goalId: string, amount: number): Goal | null {
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx === -1) return null;

  goals[idx] = {
    ...goals[idx],
    currentAmount: Math.min(
      goals[idx].currentAmount + amount,
      goals[idx].targetAmount
    ),
  };
  return goals[idx];
}

export function deleteGoal(id: string): void {
  goals = goals.filter((g) => g.id !== id);
}

// ─── Computed Stats ─────────────────────────────────────────────────
export function getDashboardStats() {
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

export function getCategoryBreakdown(): { category: string; amount: number; color: string; icon: string }[] {
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
