"use client";

import { formatCurrency } from "@/lib/utils";
import { Flame, PiggyBank, TrendingDown, Wallet } from "lucide-react";

const cardIcons = {
  Wallet,
  TrendingDown,
  Flame,
  PiggyBank,
};

type StatCardIconName = keyof typeof cardIcons;

interface StatCardProps {
  label: string;
  value: string | number;
  // pass the icon name from server components (plain string)
  icon: StatCardIconName;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  prefix?: string;
  suffix?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  iconColor = "#10b981",
  prefix = "",
  suffix = "",
}: StatCardProps) {
  const Icon = cardIcons[icon] ?? Wallet;
  return (
    <div className="glass-card stat-card" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: `${iconColor}15`,
            border: `1px solid ${iconColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={iconColor} />
        </div>

        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: trend.isPositive
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              color: trend.isPositive ? "#10b981" : "#ef4444",
              border: `1px solid ${
                trend.isPositive
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(239, 68, 68, 0.2)"
              }`,
            }}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 500, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fafafa", letterSpacing: "-0.02em" }}>
        {prefix}
        {typeof value === "number" ? formatCurrency(value) : value}
        {suffix}
      </div>
    </div>
  );
}
