"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Search, Menu, LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { useTheme } from "./theme-context";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  severity?: "warning" | "exceeded";
}

export default function Header({
  initialNotifications = [],
}: {
  initialNotifications?: AppNotification[];
}) {
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ displayName: "", email: "", avatarUrl: null });
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  // Sync when server re-renders with fresh data (e.g. after adding a transaction)
  useEffect(() => {
    setNotifications(initialNotifications);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialNotifications)]);

  const notificationsRef = useRef<HTMLDivElement | null>(null);

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
      setUserProfile({
        displayName:
          profile?.display_name ||
          (typeof meta.display_name === "string" ? meta.display_name : "") ||
          user.email?.split("@")[0] ||
          "User",
        email: user.email ?? "",
        avatarUrl: profile?.avatar_url || null,
      });
    }
    loadProfile();
  }, [supabase]);

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
          <Menu size={20} color="var(--color-text-primary)" />
        </button>

        {/* Search */}
        <div className="header-search" style={{ maxWidth: 340, width: "100%" }}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search transactions..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text-primary)",
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
              background: "var(--color-bg-card)",
              border: isNotificationsOpen ? "1px solid #10b981" : "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            <Bell size={16} color="var(--color-text-secondary)" />
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
                  border: "2px solid var(--color-bg-card)",
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
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                padding: 12,
                maxHeight: "60vh",
                overflowY: "auto",
                zIndex: 200,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: 14 }}>Notifications</span>
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
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: 14,
                    color: "var(--color-text-secondary)",
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
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        padding: 10,
                        background: "var(--color-bg-hover-strong)",
                      }}
                    >
                      <div
                        style={{
                          color:
                            item.severity === "exceeded"
                              ? "#fca5a5"
                              : item.severity === "warning"
                              ? "#fcd34d"
                              : "var(--color-text-primary)",
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: 12, marginBottom: 6 }}>{item.body}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: 11 }}>{item.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
        >
          {theme === "dark"
            ? <Sun size={16} color="var(--color-text-secondary)" />
            : <Moon size={16} color="var(--color-text-secondary)" />}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          style={{
            height: 38,
            padding: "0 12px",
            borderRadius: 10,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
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
              overflow: "hidden",
            }}
          >
            {userProfile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userProfile.avatarUrl} alt={userProfile.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              userProfile.displayName.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div className="header-avatar-text">
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {userProfile.displayName || "Loading..."}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{userProfile.email || ""}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
