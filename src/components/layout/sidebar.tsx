"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  UserCircle,
  Wallet,
  X,
  PieChart,
  Tag,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/categories", label: "Categories", icon: Tag },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const supabase = useMemo(() => createClient(), []);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();
      const meta = user.user_metadata ?? {};
      setProfileName(
        profile?.display_name ||
        (typeof meta.display_name === "string" ? meta.display_name : "") ||
        user.email?.split("@")[0] ||
        "User"
      );
      setProfileAvatar(profile?.avatar_url || null);
    }
    loadProfile();
  }, [supabase]);

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
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                FinanceAI
              </h1>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--color-text-muted)",
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
            <X size={20} color="var(--color-text-secondary)" />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-dim)",
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
        <div style={{ marginTop: "auto", padding: "0 8px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Profile card */}
          <Link
            href="/profile"
            onClick={close}
            style={{ textDecoration: "none" }}
          >
            <div
              className="glass-card"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: pathname === "/profile"
                  ? "1px solid rgba(16, 185, 129, 0.5)"
                  : "1px solid var(--color-border)",
                background: pathname === "/profile"
                  ? "rgba(16, 185, 129, 0.08)"
                  : undefined,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#022c22",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {profileAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileAvatar} alt={profileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : profileName ? (
                  profileName.charAt(0).toUpperCase()
                ) : (
                  <UserCircle size={18} color="#022c22" />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profileName || "Profile"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Edit profile</div>
              </div>
            </div>
          </Link>
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
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>
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
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
              vs last month
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
