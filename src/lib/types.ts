/** Union of built-in system category IDs — used by the auto-categorizer keyword engine. */
export type CategoryType =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "health"
  | "travel"
  | "education"
  | "income"
  | "savings"
  | "other";

export interface Category {
  /** Primary key — short slug for system categories, UUID string for custom ones. */
  id: string;
  name: string;
  icon: string;
  color: string;
  /** Determines eligibility: expense categories appear in budgets; income/savings do not. */
  type: "expense" | "income" | "savings";
  /** null for system (built-in) categories, user's UUID for custom ones. */
  user_id: string | null;
  /** true when user_id is null (built-in system category). */
  is_system: boolean;
}

export type RecurrenceType = "weekly" | "monthly";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  /** Category ID — may be a system slug or a custom UUID string. */
  category: string;
  date: string;
  createdAt: string;
  isRecurring: boolean;
  recurrence: RecurrenceType | null;
  nextDueDate: string | null;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  deadline: string;
  createdAt: string;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
}

export interface Budget {
  id: string;
  /** Category ID — may be a system slug or a custom UUID string. */
  category: string;
  amount: number;
  period: "monthly" | "weekly";
  createdAt: string;
}

export interface BudgetStatus extends Budget {
  /** Total spent in the current period for this category */
  spent: number;
  /** (spent / amount) * 100, capped display logic left to UI */
  percentage: number;
  /** true when percentage >= 80 */
  isWarning: boolean;
  /** true when percentage >= 100 */
  isExceeded: boolean;
}
