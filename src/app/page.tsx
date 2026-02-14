"use client";

import { getDashboardStats } from "@/lib/data";
import StatCard from "@/components/dashboard/stat-card";
import SpendingChart from "@/components/dashboard/spending-chart";
import CategoryChart from "@/components/dashboard/category-chart";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import {
  Wallet,
  TrendingDown,
  Flame,
  PiggyBank,
} from "lucide-react";

export default function DashboardPage() {
  const stats = getDashboardStats();

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fafafa",
            marginBottom: 4,
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h2>
        <p style={{ fontSize: 14, color: "#71717a" }}>
          Welcome back! Here&apos;s your financial overview.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div
        className="grid-cols-4"
        style={{
          display: "grid",
          gap: 20,
          marginBottom: 24,
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        <StatCard
          label="Total Balance"
          value={stats.balance}
          icon={Wallet}
          iconColor="#10b981"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          label="Monthly Spending"
          value={stats.monthlyExpenses}
          icon={TrendingDown}
          iconColor="#f97316"
          trend={{ value: 3.1, isPositive: false }}
        />
        <StatCard
          label="Daily Burn Rate"
          value={stats.burnRate}
          icon={Flame}
          iconColor="#ef4444"
        />
        <StatCard
          label="Savings Rate"
          value={`${stats.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          iconColor="#06b6d4"
          trend={{ value: 5.4, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div
        className="grid-chart-row"
        style={{
          display: "grid",
          gap: 20,
          marginBottom: 24,
          gridTemplateColumns: "1.6fr 1fr",
        }}
      >
        <SpendingChart />
        <CategoryChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
}
