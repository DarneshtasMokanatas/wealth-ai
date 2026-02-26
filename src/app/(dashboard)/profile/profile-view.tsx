"use client";

import { useState } from "react";
import { updateProfile, updatePassword } from "./actions";
import { User, Phone, Lock, Eye, EyeOff, Save } from "lucide-react";

interface Props {
  email: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  memberSince: string;
}

export default function ProfileView({
  email,
  displayName: initialDisplayName,
  phoneNumber: initialPhoneNumber,
  avatarUrl,
  memberSince,
}: Props) {
  // Profile form state
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const initials = displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || "?";

  const formattedDate = new Date(memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileStatus(null);
    const result = await updateProfile({ displayName, phoneNumber });
    if (result?.error) {
      setProfileStatus({ type: "error", message: result.error });
    } else {
      setProfileStatus({ type: "success", message: "Profile updated successfully." });
    }
    setProfileLoading(false);
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordStatus(null);
    const result = await updatePassword({ currentPassword, newPassword, confirmPassword });
    if (result?.error) {
      setPasswordStatus({ type: "error", message: result.error });
    } else {
      setPasswordStatus({ type: "success", message: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    padding: 28,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--color-text-primary)",
    marginBottom: 4,
  };

  const sectionSubStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--color-text-muted)",
    marginBottom: 24,
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page heading */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>Profile</h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>Manage your personal details and account security.</p>
      </div>

      {/* Avatar / identity card */}
      <div className="glass-card" style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
            color: "#022c22",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>{displayName || email}</div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>{email}</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 11,
              color: "#10b981",
              fontWeight: 600,
            }}
          >
            Member since {formattedDate}
          </div>
        </div>
      </div>

      {/* Profile details form */}
      <div className="glass-card" style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <User size={18} color="#10b981" />
          <span style={sectionTitleStyle}>Personal Details</span>
        </div>
        <p style={sectionSubStyle}>Update your display name and phone number.</p>

        {profileStatus && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
              fontWeight: 500,
              background: profileStatus.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${profileStatus.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: profileStatus.type === "success" ? "#10b981" : "#f87171",
            }}
          >
            {profileStatus.message}
          </div>
        )}

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label htmlFor="displayName" style={labelStyle}>Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#10b981")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              style={{ ...inputStyle, color: "var(--color-text-muted)", cursor: "not-allowed", opacity: 0.7 }}
            />
            <p style={{ fontSize: 11, color: "var(--color-text-dim)", marginTop: 4 }}>Email cannot be changed.</p>
          </div>

          <div>
            <label htmlFor="phone" style={labelStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={12} /> Phone Number
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#10b981")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={profileLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: profileLoading ? "#059669" : "#10b981",
                border: "none",
                borderRadius: 10,
                color: "#022c22",
                fontWeight: 700,
                fontSize: 14,
                cursor: profileLoading ? "not-allowed" : "pointer",
                opacity: profileLoading ? 0.8 : 1,
                transition: "all 0.2s",
              }}
            >
              <Save size={14} />
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password form */}
      <div className="glass-card" style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Lock size={18} color="#10b981" />
          <span style={sectionTitleStyle}>Change Password</span>
        </div>
        <p style={sectionSubStyle}>Must be at least 12 characters.</p>

        {passwordStatus && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
              fontWeight: 500,
              background: passwordStatus.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${passwordStatus.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: passwordStatus.type === "success" ? "#10b981" : "#f87171",
            }}
          >
            {passwordStatus.message}
          </div>
        )}

        <form onSubmit={handlePasswordSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label htmlFor="currentPassword" style={labelStyle}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#10b981")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" style={labelStyle}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 12 characters"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#10b981")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#10b981")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: passwordLoading || !currentPassword || !newPassword || !confirmPassword ? "var(--color-border)" : "#10b981",
                border: "none",
                borderRadius: 10,
                color: passwordLoading || !currentPassword || !newPassword || !confirmPassword ? "var(--color-text-muted)" : "#022c22",
                fontWeight: 700,
                fontSize: 14,
                cursor: passwordLoading || !currentPassword || !newPassword || !confirmPassword ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <Lock size={14} />
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
