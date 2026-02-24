import { getBudgetStatuses, getCategories } from "@/lib/data";
import BudgetsView from "./budgets-view";

export default async function BudgetsPage() {
  const [budgetStatuses, categories] = await Promise.all([
    getBudgetStatuses(),
    getCategories(),
  ]);

  return <BudgetsView initialStatuses={budgetStatuses} categories={categories} />;
}
