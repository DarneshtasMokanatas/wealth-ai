export default function BudgetsLoading() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
        Loading budgets...
      </h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Fetching your budget limits and current spending.
      </p>
    </div>
  );
}
