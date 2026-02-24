import { getTransactions, getCategories } from "@/lib/data";
import TransactionsView from "./transaction-view";

export default async function TransactionsPage() {
  const [transactions, categories] = await Promise.all([
    getTransactions(),
    getCategories(),
  ]);

  return <TransactionsView initialTransactions={transactions} categories={categories} />;
}
