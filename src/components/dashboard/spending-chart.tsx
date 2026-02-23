"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #3f3f46",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 8 }}>
        {label}
      </div>
      {payload.map((p: any, idx: number) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: p.color,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
            }}
          />
          {p.name}: ${p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type ChartData = {
  month: string;
  spending: number;
  income: number;
};

export default function SpendingChart({ data }: { data: ChartData[] }) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#fafafa",
            marginBottom: 4,
          }}
        >
          Income vs Spending
        </h3>
        <p style={{ fontSize: 13, color: "#71717a" }}>
          Last 6 months overview
        </p>
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="spending"
              name="Spending"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#spendingGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 16,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#10b981",
            }}
          />
          <span style={{ fontSize: 12, color: "#a1a1aa" }}>Income</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#f97316",
            }}
          />
          <span style={{ fontSize: 12, color: "#a1a1aa" }}>Spending</span>
        </div>
      </div>
    </div>
  );
}
