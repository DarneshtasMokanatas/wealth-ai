"use client";

import { useMemo } from "react";
import { Transaction, Category } from "@/lib/types";
import { formatCurrency, getRelativeTime } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function RecentTransactions({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}
          >
            Recent Transactions
          </h3>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Your latest activity
          </p>
        </div>
        <a
          href="/transactions"
          style={{
            fontSize: 13,
            color: "#10b981",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          View All →
        </a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {transactions.map((tx) => {
          const cat = catMap.get(tx.category);
          const isIncome = tx.type === "income";

          return (
            <div
              key={tx.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 8px",
                borderRadius: 10,
                transition: "background 0.15s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${cat?.color || "#6b7280"}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {cat?.icon || "📦"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      marginBottom: 2,
                    }}
                  >
                    {tx.description}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      className="category-badge"
                      style={{ color: cat?.color || "var(--color-text-secondary)" }}
                    >
                      {cat?.name || tx.category}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-text-dim)" }}>•</span>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {getRelativeTime(tx.date)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isIncome ? (
                  <ArrowUpRight size={14} color="#10b981" />
                ) : (
                  <ArrowDownLeft size={14} color="#ef4444" />
                )}
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: isIncome ? "#10b981" : "var(--color-text-primary)",
                  }}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
