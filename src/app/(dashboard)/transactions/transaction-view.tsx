"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addTransaction, deleteTransaction, updateTransaction } from "./actions";
import { parseExpenseInput } from "@/lib/categorizer";
import { formatCurrency, formatDate, exportToCSV } from "@/lib/utils";
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Download,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import { Transaction, Category, RecurrenceType } from "@/lib/types";

export default function TransactionsView({
  initialTransactions,
  categories,
}: {
  initialTransactions: Transaction[];
  categories: Category[];
}) {
  const router = useRouter();
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseExpenseInput>>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRecurring, setFilterRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Recurring fields for the add form
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("monthly");

  // Edit modal state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<string>("other");
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>("monthly");

  // Escape key closes edit modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditTx(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredTransactions = useMemo(
    () => initialTransactions.filter((tx) => {
      if (filterCategory !== "all" && tx.category !== filterCategory) return false;
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterRecurring && !tx.isRecurring) return false;
      return true;
    }),
    [initialTransactions, filterCategory, filterType, filterRecurring]
  );

  function openEdit(tx: Transaction) {
    setEditTx(tx);
    setEditDesc(tx.description);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditIsRecurring(tx.isRecurring);
    setEditRecurrence(tx.recurrence ?? "monthly");
  }

  function showFeedback(type: "success" | "error", message: string) {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (value.trim().length > 2) {
      setPreview(parseExpenseInput(value));
    } else {
      setPreview(null);
    }
  }

  async function handleAddExpense() {
    if (!preview) return;
    setLoading(true);

    const result = await addTransaction({
      description: preview.description,
      amount: preview.amount,
      type: preview.type,
      category: preview.category,
      date: new Date().toISOString().slice(0, 10),
      isRecurring,
      recurrence: isRecurring ? recurrence : undefined,
    });

    if (result?.error) {
      showFeedback("error", result.error);
      setLoading(false);
      return;
    }

    showFeedback("success", `Transaction added${isRecurring ? ` (repeats ${recurrence})` : ""}.`);
    setInput("");
    setPreview(null);
    setIsRecurring(false);
    setLoading(false);
    router.refresh();
  }

  async function handleEdit() {
    if (!editTx) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    setLoading(true);

    const result = await updateTransaction(editTx.id, {
      description: editDesc,
      amount,
      category: editCategory,
      isRecurring: editIsRecurring,
      recurrence: editIsRecurring ? editRecurrence : undefined,
    });

    setLoading(false);
    if (result?.error) {
      showFeedback("error", result.error);
      return;
    }

    showFeedback("success", "Transaction updated.");
    setEditTx(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      const result = await deleteTransaction(id);
      if (result?.error) {
        showFeedback("error", result.error);
        return;
      }
      showFeedback("success", "Transaction deleted successfully.");
      router.refresh();
    }
  }

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const recurringCount = initialTransactions.filter((t) => t.isRecurring).length;

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  };
  const modalBox: React.CSSProperties = {
    background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
    borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, position: "relative",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)",
    marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.06em",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1px solid var(--color-border)", background: "var(--color-bg-card)",
    color: "var(--color-text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4, letterSpacing: "-0.02em" }}>
          Transactions
        </h2>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          Add expenses using natural language — our AI categorizes them automatically.
        </p>
        {status && (
          <div role="status" aria-live="polite" style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 10, fontSize: 13,
            color: status.type === "error" ? "#fca5a5" : "#6ee7b7",
            border: status.type === "error" ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)",
            background: status.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
          }}>
            {status.message}
          </div>
        )}
      </div>

      {/* Smart Expense Input */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Sparkles size={16} color="#10b981" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
            AI Expense Categorizer
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              aria-label="Add transaction using natural language"
              className="smart-input"
              placeholder='Try: "Spent RM12 on a burrito" or "Earned RM800 freelancing"'
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddExpense(); }}
              disabled={loading}
            />

            {/* Live Preview */}
            {preview && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginTop: 12,
                padding: "10px 14px", background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Preview:</span>
                <span className="category-badge" style={{ color: catMap.get(preview.category)?.color }}>
                  {catMap.get(preview.category)?.icon} {catMap.get(preview.category)?.name}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: preview.type === "income" ? "#10b981" : "var(--color-text-primary)" }}>
                  {preview.type === "income" ? "+" : "-"}{formatCurrency(preview.amount)}
                </span>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                  {preview.description}
                </span>
              </div>
            )}

            {/* Recurring toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ accentColor: "#10b981", width: 15, height: 15 }}
                />
                <RefreshCw size={13} color={isRecurring ? "#10b981" : "var(--color-text-muted)"} />
                <span style={{ fontSize: 13, color: isRecurring ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  Make recurring
                </span>
              </label>

              {isRecurring && (
                <div style={{ display: "flex", gap: 6 }}>
                  {(["weekly", "monthly"] as RecurrenceType[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRecurrence(r)}
                      style={{
                        padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        background: recurrence === r ? "#10b981" : "var(--color-bg-card)",
                        color: recurrence === r ? "#022c22" : "var(--color-text-secondary)",
                        border: recurrence === r ? "1px solid #10b981" : "1px solid var(--color-border)",
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleAddExpense}
            disabled={!preview || loading}
            style={{ opacity: preview && !loading ? 1 : 0.4, height: 48, minWidth: 120 }}
          >
            <Plus size={16} />
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {/* Filters & Totals */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color="var(--color-text-muted)" />
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Filters:</span>
          </div>
          <select
            aria-label="Filter by transaction type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-medium)", borderRadius: 8, padding: "6px 12px", color: "var(--color-text-primary)", fontSize: 13, outline: "none" }}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>

          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-medium)", borderRadius: 8, padding: "6px 12px", color: "var(--color-text-primary)", fontSize: 13, outline: "none" }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          {/* Recurring filter toggle */}
          <button
            type="button"
            onClick={() => setFilterRecurring((prev) => !prev)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              background: filterRecurring ? "rgba(16,185,129,0.1)" : "var(--color-bg-card)",
              color: filterRecurring ? "#10b981" : "var(--color-text-secondary)",
              border: filterRecurring ? "1px solid rgba(16,185,129,0.4)" : "1px solid var(--color-border-medium)",
            }}
          >
            <RefreshCw size={13} />
            Recurring {recurringCount > 0 && `(${recurringCount})`}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => exportToCSV(filteredTransactions, undefined, catMap)}
            disabled={filteredTransactions.length === 0}
            title="Export visible transactions as CSV"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              background: "transparent", border: "1px solid var(--color-border-medium)",
              borderRadius: 8, color: filteredTransactions.length === 0 ? "var(--color-text-dim)" : "var(--color-text-secondary)",
              fontSize: 13, fontWeight: 500, cursor: filteredTransactions.length === 0 ? "not-allowed" : "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { if (filteredTransactions.length > 0) { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-medium)"; e.currentTarget.style.color = filteredTransactions.length === 0 ? "var(--color-text-dim)" : "var(--color-text-secondary)"; }}
          >
            <Download size={13} />
            Export CSV
          </button>

          <div style={{ width: 1, height: 28, background: "var(--color-border)" }} />

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Income</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>+{formatCurrency(totalIncome)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Expenses</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ef4444" }}>-{formatCurrency(totalExpenses)}</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div className="transaction-grid" style={{ padding: "14px 24px", borderBottom: "1px solid var(--color-border)", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <span>Description</span>
          <span>Category</span>
          <span>Date</span>
          <span style={{ textAlign: "right" }}>Amount</span>
          <span></span>
        </div>

        {filteredTransactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} catMap={catMap} onDelete={handleDelete} onEdit={openEdit} />
        ))}

        {filteredTransactions.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
            No transactions found.
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editTx && (
        <div style={modalOverlay} onClick={() => setEditTx(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              onClick={() => setEditTx(null)}
              style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: "none", cursor: "pointer", opacity: 0.6 }}
            >
              <X size={18} color="var(--color-text-primary)" />
            </button>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 20 }}>
              Edit Transaction
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Amount (MYR)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                style={inputStyle}
              >
                {Object.values(categories).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={editIsRecurring}
                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                  style={{ accentColor: "#10b981", width: 15, height: 15 }}
                />
                <RefreshCw size={13} color={editIsRecurring ? "#10b981" : "var(--color-text-muted)"} />
                <span style={{ fontSize: 13, color: editIsRecurring ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  Recurring transaction
                </span>
              </label>

              {editIsRecurring && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {(["weekly", "monthly"] as RecurrenceType[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRecurrence(r)}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        background: editRecurrence === r ? "#10b981" : "var(--color-bg-card)",
                        color: editRecurrence === r ? "#022c22" : "var(--color-text-secondary)",
                        border: editRecurrence === r ? "1px solid #10b981" : "1px solid var(--color-border)",
                      }}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading || !editDesc.trim() || parseFloat(editAmount) <= 0}
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

function TransactionRow({
  tx,
  catMap,
  onDelete,
  onEdit,
}: {
  tx: Transaction;
  catMap: Map<string, Category>;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}) {
  const cat = catMap.get(tx.category);
  const isIncome = tx.type === "income";

  return (
    <div
      className="transaction-grid"
      style={{
        padding: "14px 24px",
        borderBottom: "1px solid var(--color-border-subtle)",
        alignItems: "center",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      {/* Description */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cat?.color || "#6b7280"}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
          {cat?.icon || "📦"}
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {tx.description}
          </span>
          {tx.isRecurring && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <RefreshCw size={10} color="#10b981" />
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, textTransform: "capitalize" }}>
                {tx.recurrence}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category */}
      <span className="category-badge" style={{ color: cat?.color || "var(--color-text-secondary)", width: "fit-content" }}>
        {cat?.name || tx.category}
      </span>

      {/* Date */}
      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
        {formatDate(tx.date)}
      </span>

      {/* Amount */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
        {isIncome ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownLeft size={14} color="#ef4444" />}
        <span style={{ fontSize: 14, fontWeight: 600, color: isIncome ? "#10b981" : "var(--color-text-primary)" }}>
          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          aria-label={`Edit transaction ${tx.description}`}
          title="Edit transaction"
          onClick={() => onEdit(tx)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, transition: "opacity 0.15s ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.4"; }}
        >
          <Pencil size={13} color="var(--color-text-secondary)" />
        </button>
        <button
          aria-label={`Delete transaction ${tx.description}`}
          title="Delete transaction"
          onClick={() => onDelete(tx.id)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, transition: "opacity 0.15s ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.4"; }}
        >
          <Trash2 size={14} color="#ef4444" />
        </button>
      </div>
    </div>
  );
}
