"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { toggle } = useSidebar();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "goal-reminder",
      title: "Goal reminder",
      body: "Add a contribution to stay on track this week.",
      time: "2h ago",
    },
    {
      id: "spending-insight",
      title: "Spending insight",
      body: "Dining spend is up 12% compared to last week.",
      time: "1d ago",
    },
  ]);

  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isNotificationsOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login?message=Signed%20out%20successfully");
    router.refresh();
  }

  const unreadCount = notifications.length;

  return (
    <header className="app-header">
      {/* Left: hamburger + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        {/* Hamburger — visible only on mobile */}
        <button className="hamburger-btn" onClick={toggle} aria-label="Open sidebar menu">
          <Menu size={20} color="#fafafa" />
        </button>

        {/* Search */}
        <div className="header-search" style={{ maxWidth: 340, width: "100%" }}>
          <Search size={16} color="#71717a" />
          <input
            type="text"
            placeholder="Search transactions..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fafafa",
              fontSize: 14,
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, marginLeft: 16 }}>
        {/* Notification Bell */}
        <div ref={notificationsRef} style={{ position: "relative", zIndex: 110 }}>
          <button
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#18181b",
              border: isNotificationsOpen ? "1px solid #10b981" : "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            <Bell size={16} color="#a1a1aa" />
            {unreadCount > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10b981",
                  border: "2px solid #18181b",
                }}
              />
            )}
          </button>

          {isNotificationsOpen && (
            <div
              role="menu"
              aria-label="Notifications panel"
              style={{
                position: "fixed",
                top: 74,
                right: 20,
                width: "min(320px, calc(100vw - 24px))",
                background: "#111217",
                border: "1px solid #2a2c34",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                padding: 12,
                maxHeight: "60vh",
                overflowY: "auto",
                zIndex: 200,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 14 }}>Notifications</span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifications([])}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#10b981",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div
                  style={{
                    border: "1px solid #27272a",
                    borderRadius: 10,
                    padding: 14,
                    color: "#a1a1aa",
                    fontSize: 13,
                  }}
                >
                  You&apos;re all caught up.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #27272a",
                        borderRadius: 10,
                        padding: 10,
                        background: "rgba(24, 24, 27, 0.7)",
                      }}
                    >
                      <div style={{ color: "#fafafa", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>{item.body}</div>
                      <div style={{ color: "#71717a", fontSize: 11 }}>{item.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          style={{
            height: 38,
            padding: "0 12px",
            borderRadius: 10,
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#fafafa",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: isSigningOut ? "not-allowed" : "pointer",
            opacity: isSigningOut ? 0.75 : 1,
            flexShrink: 0,
          }}
        >
          <LogOut size={14} />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>

        {/* Avatar */}
        <div className="header-avatar" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#022c22",
              flexShrink: 0,
            }}
          >
            D
          </div>
          <div className="header-avatar-text">
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}>
              Darnesh
            </div>
            <div style={{ fontSize: 12, color: "#71717a" }}>Pro Account</div>
          </div>
        </div>
      </div>
    </header>
  );
}
