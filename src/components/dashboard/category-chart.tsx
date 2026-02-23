"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #3f3f46",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span>{data.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fafafa" }}>
          {data.category}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: data.color }}>
        {formatCurrency(data.amount)}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function CategoryChart({
  data,
}: {
  data: { category: string; amount: number; color: string; icon: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#fafafa",
            marginBottom: 4,
          }}
        >
          Spending by Category
        </h3>
        <p style={{ fontSize: 13, color: "#71717a" }}>
          Where your money goes
        </p>
      </div>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="amount"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        {data.slice(0, 5).map((item) => (
          <div
            key={item.category}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.color,
                }}
              />
              <span style={{ color: "#a1a1aa" }}>{item.category}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#fafafa", fontWeight: 600 }}>
                {formatCurrency(item.amount)}
              </span>
              <span style={{ color: "#71717a", fontSize: 12 }}>
                {total > 0 ? ((item.amount / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
