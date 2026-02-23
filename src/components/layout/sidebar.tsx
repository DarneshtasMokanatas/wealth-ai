"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/goals", label: "Goals", icon: Target },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          aria-label="Close sidebar overlay"
          onClick={close}
        />
      )}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Header row with logo + close button on mobile */}
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                flexShrink: 0,
              }}
            >
              <Wallet size={20} color="#022c22" strokeWidth={2.5} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fafafa",
                  letterSpacing: "-0.02em",
                }}
              >
                FinanceAI
              </h1>
              <span
                style={{
                  fontSize: 11,
                  color: "#71717a",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Smart Money
              </span>
            </div>
          </div>

          {/* Close button — only visible on mobile */}
          <button className="sidebar-close-btn" onClick={close} aria-label="Close sidebar">
            <X size={20} color="#a1a1aa" />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#52525b",
              padding: "0 16px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Menu
          </span>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={close}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Stats */}
        <div style={{ marginTop: "auto", padding: "0 8px" }}>
          <div
            className="glass-card"
            style={{
              padding: 16,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <TrendingUp size={14} color="#10b981" />
              <span style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>
                Monthly Trend
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#10b981",
                fontWeight: 600,
              }}
            >
              +12.5% savings rate
            </div>
            <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>
              vs last month
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
