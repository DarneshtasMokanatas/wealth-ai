"use client";

import dynamic from "next/dynamic";

const CategoryChart = dynamic(
  () => import("@/components/dashboard/category-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card" style={{ padding: 24, height: 380, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Loading chart…</span>
      </div>
    ),
  }
);

export default CategoryChart;
