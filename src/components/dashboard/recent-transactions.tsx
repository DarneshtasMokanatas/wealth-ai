"use client";

import { getTransactions } from "@/lib/data";
import { CATEGORIES } from "@/lib/categorizer";
import { formatCurrency, getRelativeTime } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function RecentTransactions() {
  const transactions = getTransactions().slice(0, 6);

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
            style={{ fontSize: 16, fontWeight: 600, color: "#fafafa", marginBottom: 4 }}
          >
            Recent Transactions
          </h3>
          <p style={{ fontSize: 13, color: "#71717a" }}>
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
          const cat = CATEGORIES[tx.category];
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
                  "rgba(39, 39, 42, 0.4)";
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
                      color: "#fafafa",
                      marginBottom: 2,
                    }}
                  >
                    {tx.description}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      className="category-badge"
                      style={{ color: cat?.color || "#a1a1aa" }}
                    >
                      {cat?.name || tx.category}
                    </span>
                    <span style={{ fontSize: 12, color: "#52525b" }}>•</span>
                    <span style={{ fontSize: 12, color: "#71717a" }}>
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
                    color: isIncome ? "#10b981" : "#fafafa",
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
