import { getTransactions } from "@/lib/data";
import TransactionsView from "./transaction-view";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return <TransactionsView initialTransactions={transactions} />;
}
