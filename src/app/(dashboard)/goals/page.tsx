import { getGoals } from "@/lib/data";
import GoalsView from "./goals-view";

export default async function GoalsPage() {
  const goals = await getGoals();

  return <GoalsView initialGoals={goals} />;
}
