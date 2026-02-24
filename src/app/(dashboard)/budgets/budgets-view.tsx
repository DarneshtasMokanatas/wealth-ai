"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, X, AlertTriangle, CheckCircle2, PieChart } from "lucide-react";
import { addBudget, updateBudget, deleteBudget } from "./actions";
import { formatCurrency } from "@/lib/utils";
import { BudgetStatus, Category } from "@/lib/types";

function ProgressBar({ percentage }: { percentage: number }) {
  const clamped = Math.min(percentage, 100);
  const color =
    percentage >= 100 ? "#ef4444" : percentage >= 80 ? "#f59e0b" : "#10b981";

  return (
    <div
      style={{
        height: 8,
        borderRadius: 99,
        background: "var(--color-bg-hover-strong)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${clamped}%`,
          borderRadius: 99,
          background: color,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

export default function BudgetsView({
  initialStatuses,
  categories,
}: {
  initialStatuses: BudgetStatus[];
  categories: Category[];
}) {
  const router = useRouter();
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  /** Categories eligible for budgets: everything except income type. */
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type !== "income"),
    [categories]
  );
  const [statuses, setStatuses] = useState(initialStatuses);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<string>(expenseCategories[0]?.id ?? "");
  const [newAmount, setNewAmount] = useState("");

  // Edit modal
  const [editBudget, setEditBudget] = useState<BudgetStatus | null>(null);
  const [editAmount, setEditAmount] = useState("");

  // Keep in sync with server refreshes
  useEffect(() => {
    setStatuses(initialStatuses);
  }, [initialStatuses]);

  // Escape key closes modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setEditBudget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function showFeedback(type: "success" | "error", message: string) {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleAdd() {
    const amount = parseFloat(newAmount);
    if (!newCategory || isNaN(amount) || amount <= 0) return;
    setLoading(true);
    const result = await addBudget(newCategory, amount);
    setLoading(false);

    if (result?.error) {
      showFeedback("error", result.error);
      return;
    }

    showFeedback("success", "Budget created successfully.");
    setShowAddModal(false);
    setNewAmount("");
    setNewCategory(expenseCategories[0]?.id ?? "");
    router.refresh();
  }

  async function handleEdit() {
    if (!editBudget) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    setLoading(true);
    const result = await updateBudget(editBudget.id, amount);
    setLoading(false);

    if (result?.error) {
      showFeedback("error", result.error);
      return;
    }

    showFeedback("success", "Budget updated successfully.");
    setEditBudget(null);
    setEditAmount("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    const result = await deleteBudget(id);
    if (result?.error) {
      showFeedback("error", result.error);
      return;
    }
    showFeedback("success", "Budget deleted.");
    router.refresh();
  }

  // Categories already assigned
  const usedCategories = new Set(statuses.map((s) => s.category));
  const availableCategories = expenseCategories.filter(
    (c) => !usedCategories.has(c.id)
  );

  const totalBudget = statuses.reduce((s, b) => s + b.amount, 0);
  const totalSpent = statuses.reduce((s, b) => s + b.spent, 0);
  const alertCount = statuses.filter((s) => s.isWarning).length;

  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };

  const modalBoxStyle: React.CSSProperties = {
    background: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    position: "relative",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-text-secondary)",
    marginBottom: 6,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-card)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 4,
              letterSpacing: "-0.02em",
            }}
          >
            Budgets
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            Set monthly spending limits and get alerts at 80% and 100%.
          </p>
          {status && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                color: status.type === "error" ? "#fca5a5" : "#6ee7b7",
                border:
                  status.type === "error"
                    ? "1px solid rgba(239, 68, 68, 0.25)"
                    : "1px solid rgba(16, 185, 129, 0.25)",
                background:
                  status.type === "error"
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(16, 185, 129, 0.1)",
              }}
            >
              {status.message}
            </div>
          )}
        </div>
        {availableCategories.length > 0 && (
          <button
            className="btn-primary"
            onClick={() => {
              setNewCategory(availableCategories[0]?.id ?? "");
              setNewAmount("");
              setShowAddModal(true);
            }}
          >
            <Plus size={16} />
            New Budget
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="stat-grid-3" style={{ marginBottom: 28 }}>
        <div className="glass-card stat-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
            Active Budgets
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {statuses.length}
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
            Total Budget
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {formatCurrency(totalBudget)}
          </div>
        </div>
        <div className="glass-card stat-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
            Alerts Active
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: alertCount > 0 ? "#f59e0b" : "#10b981",
            }}
          >
            {alertCount}
          </div>
        </div>
      </div>

      {/* Budget cards */}
      {statuses.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: 48,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <PieChart size={40} color="var(--color-text-dim)" />
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            No budgets set yet
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Create your first budget to start tracking spending limits.
          </p>
          {availableCategories.length > 0 && (
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => {
                setNewCategory(availableCategories[0]?.id ?? "");
                setShowAddModal(true);
              }}
            >
              <Plus size={16} />
              New Budget
            </button>
          )}
        </div>
      ) : (
        <div className="goals-grid">
          {statuses.map((b) => {
            const cat = catMap.get(b.category);
            const pct = Math.round(b.percentage);
            const remaining = Math.max(0, b.amount - b.spent);

            return (
              <div key={b.id} className="glass-card" style={{ padding: 24 }}>
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: b.isExceeded
                          ? "rgba(239,68,68,0.12)"
                          : b.isWarning
                          ? "rgba(245,158,11,0.12)"
                          : "var(--color-bg-hover-strong)",
                        border: `1px solid ${
                          b.isExceeded
                            ? "rgba(239,68,68,0.35)"
                            : b.isWarning
                            ? "rgba(245,158,11,0.35)"
                            : "var(--color-border-medium)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {cat?.icon ?? "📦"}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {cat?.name ?? b.category}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        Monthly budget
                      </div>
                    </div>
                  </div>

                  {/* Alert badge */}
                  {b.isExceeded ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#ef4444",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: 99,
                        padding: "3px 8px",
                      }}
                    >
                      <AlertTriangle size={11} />
                      Exceeded
                    </span>
                  ) : b.isWarning ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#f59e0b",
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.25)",
                        borderRadius: 99,
                        padding: "3px 8px",
                      }}
                    >
                      <AlertTriangle size={11} />
                      Warning
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#10b981",
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: 99,
                        padding: "3px 8px",
                      }}
                    >
                      <CheckCircle2 size={11} />
                      On track
                    </span>
                  )}
                </div>

                {/* Amounts */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {formatCurrency(b.spent)}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                    of {formatCurrency(b.amount)}
                  </span>
                </div>

                {/* Progress bar */}
                <ProgressBar percentage={b.percentage} />

                {/* Percentage + remaining */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        b.isExceeded ? "#ef4444" : b.isWarning ? "#f59e0b" : "#10b981",
                    }}
                  >
                    {pct}%
                  </span>
                  <span>
                    {b.isExceeded
                      ? `${formatCurrency(b.spent - b.amount)} over budget`
                      : `${formatCurrency(remaining)} remaining`}
                  </span>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <button
                    onClick={() => {
                      setEditBudget(b);
                      setEditAmount(String(b.amount));
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-card)",
                      color: "var(--color-text-secondary)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(239,68,68,0.06)",
                      color: "#ef4444",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total spend bar (only when there are budgets) */}
      {statuses.length > 0 && (
        <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
              Total Monthly Overview
            </span>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {formatCurrency(totalSpent)} spent of {formatCurrency(totalBudget)}
            </span>
          </div>
          <ProgressBar
            percentage={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
          />
        </div>
      )}

      {/* ── Add Budget Modal ── */}
      {showAddModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              onClick={() => setShowAddModal(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                opacity: 0.6,
              }}
            >
              <X size={18} color="var(--color-text-primary)" />
            </button>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 20 }}>
              New Monthly Budget
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={inputStyle}
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Monthly Limit (MYR)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 500"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                style={inputStyle}
                autoFocus
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading || !newAmount || parseFloat(newAmount) <= 0}
              onClick={handleAdd}
            >
              {loading ? "Creating…" : "Create Budget"}
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Budget Modal ── */}
      {editBudget && (
        <div style={modalOverlayStyle} onClick={() => setEditBudget(null)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              onClick={() => setEditBudget(null)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                opacity: 0.6,
              }}
            >
              <X size={18} color="var(--color-text-primary)" />
            </button>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
              Edit Budget
            </h3>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
              {catMap.get(editBudget.category)?.icon}{" "}
              {catMap.get(editBudget.category)?.name ?? editBudget.category}
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>New Monthly Limit (MYR)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                style={inputStyle}
                autoFocus
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading || !editAmount || parseFloat(editAmount) <= 0}
              onClick={handleEdit}
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
