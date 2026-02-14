"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export default function Header() {
  const { toggle } = useSidebar();

  return (
    <header className="app-header">
      {/* Left: hamburger + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Hamburger — visible only on mobile */}
        <button className="hamburger-btn" onClick={toggle}>
          <Menu size={20} color="#fafafa" />
        </button>

        {/* Search */}
        <div className="header-search">
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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Notification Bell */}
        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "#18181b",
            border: "1px solid #27272a",
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
        </button>

        {/* Avatar */}
        <div className="header-avatar">
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
