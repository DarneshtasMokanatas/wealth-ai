import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { getBudgetStatuses, buildBudgetNotifications, getCategories } from "@/lib/data";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [budgetStatuses, categories] = await Promise.all([
    getBudgetStatuses(),
    getCategories(),
  ]);
  const notifications = buildBudgetNotifications(budgetStatuses, categories);

  const alertStatuses = budgetStatuses.filter((s) => s.isWarning);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header initialNotifications={notifications} />
        <main className="app-content">
          {/* Budget alert banner — shown on every dashboard page when a limit is hit */}
          {alertStatuses.length > 0 && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                borderRadius: 12,
                background: alertStatuses.some((s) => s.isExceeded)
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(245,158,11,0.08)",
                border: alertStatuses.some((s) => s.isExceeded)
                  ? "1px solid rgba(239,68,68,0.3)"
                  : "1px solid rgba(245,158,11,0.3)",
                display: "flex",
                flexWrap: "wrap" as const,
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: alertStatuses.some((s) => s.isExceeded) ? "#fca5a5" : "#fcd34d",
                  marginRight: 4,
                }}
              >
                {alertStatuses.some((s) => s.isExceeded) ? "⛔" : "⚠️"} Budget Alert
              </span>
              {alertStatuses.map((s) => (
                <span
                  key={s.id}
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: s.isExceeded
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(245,158,11,0.12)",
                    color: s.isExceeded ? "#fca5a5" : "#fcd34d",
                    border: `1px solid ${
                      s.isExceeded ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"
                    }`,
                  }}
                >
                  {s.isExceeded ? "🔴" : "🟡"}{" "}
                  {/* category name via import would import CATEGORIES server-side; use raw id */}
                  {s.category.charAt(0).toUpperCase() + s.category.slice(1)} —{" "}
                  {Math.round(s.percentage)}%
                </span>
              ))}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
