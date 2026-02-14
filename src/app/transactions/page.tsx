"use client";

import { useState, useCallback } from "react";
import { getTransactions, addTransaction, deleteTransaction } from "@/lib/data";
import { parseExpenseInput, CATEGORIES } from "@/lib/categorizer";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { Transaction, CategoryType } from "@/lib/types";

export default function TransactionsPage() {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseExpenseInput>>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const transactions = getTransactions();

  const filteredTransactions = transactions.filter((tx) => {
    if (filterCategory !== "all" && tx.category !== filterCategory) return false;
    if (filterType !== "all" && tx.type !== filterType) return false;
    return true;
  });

  function handleInputChange(value: string) {
    setInput(value);
    if (value.trim().length > 2) {
      setPreview(parseExpenseInput(value));
    } else {
      setPreview(null);
    }
  }

  function handleAddExpense() {
    if (!preview) return;

    addTransaction({
      description: preview.description,
      amount: preview.amount,
      type: preview.type,
      category: preview.category,
      date: new Date().toISOString().split("T")[0],
    });

    setInput("");
    setPreview(null);
    refresh();
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
    refresh();
  }

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

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
          Transactions
        </h2>
        <p style={{ fontSize: 14, color: "#71717a" }}>
          Add expenses using natural language — our AI categorizes them automatically.
        </p>
      </div>

      {/* Smart Expense Input */}
      <div
        className="glass-card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Sparkles size={16} color="#10b981" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}>
            AI Expense Categorizer
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="smart-input"
              placeholder='Try: "Spent $12 on a burrito" or "Earned $800 freelancing"'
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddExpense();
              }}
            />

            {/* Live Preview */}
            {preview && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "rgba(16, 185, 129, 0.06)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 13, color: "#a1a1aa" }}>Preview:</span>
                <span
                  className="category-badge"
                  style={{ color: CATEGORIES[preview.category]?.color }}
                >
                  {CATEGORIES[preview.category]?.icon}{" "}
                  {CATEGORIES[preview.category]?.name}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: preview.type === "income" ? "#10b981" : "#fafafa",
                  }}
                >
                  {preview.type === "income" ? "+" : "-"}
                  {formatCurrency(preview.amount)}
                </span>
                <span
                  style={{ fontSize: 13, color: "#a1a1aa", fontStyle: "italic" }}
                >
                  {preview.description}
                </span>
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleAddExpense}
            disabled={!preview}
            style={{
              opacity: preview ? 1 : 0.4,
              height: 48,
              minWidth: 120,
            }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Filters & Totals */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={14} color="#71717a" />
            <span style={{ fontSize: 13, color: "#71717a" }}>Filters:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              padding: "6px 12px",
              color: "#fafafa",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              padding: "6px 12px",
              color: "#fafafa",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="all">All Categories</option>
            {Object.values(CATEGORIES).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase" }}>
              Income
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>
              +{formatCurrency(totalIncome)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase" }}>
              Expenses
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#ef4444" }}>
              -{formatCurrency(totalExpenses)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {/* Table Header */}
        <div
          className="transaction-grid"
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid #27272a",
            fontSize: 12,
            fontWeight: 600,
            color: "#71717a",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>Description</span>
          <span>Category</span>
          <span>Date</span>
          <span style={{ textAlign: "right" }}>Amount</span>
          <span></span>
        </div>

        {/* Rows */}
        {filteredTransactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} onDelete={handleDelete} />
        ))}

        {filteredTransactions.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#71717a",
              fontSize: 14,
            }}
          >
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({
  tx,
  onDelete,
}: {
  tx: Transaction;
  onDelete: (id: string) => void;
}) {
  const cat = CATEGORIES[tx.category as CategoryType];
  const isIncome = tx.type === "income";

  return (
    <div
      className="transaction-grid"
      style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(39, 39, 42, 0.5)",
        alignItems: "center",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(39, 39, 42, 0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Description */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `${cat?.color || "#6b7280"}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {cat?.icon || "📦"}
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa" }}>
          {tx.description}
        </span>
      </div>

      {/* Category */}
      <span
        className="category-badge"
        style={{
          color: cat?.color || "#a1a1aa",
          width: "fit-content",
        }}
      >
        {cat?.name || tx.category}
      </span>

      {/* Date */}
      <span style={{ fontSize: 13, color: "#a1a1aa" }}>
        {formatDate(tx.date)}
      </span>

      {/* Amount */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        {isIncome ? (
          <ArrowUpRight size={14} color="#10b981" />
        ) : (
          <ArrowDownLeft size={14} color="#ef4444" />
        )}
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: isIncome ? "#10b981" : "#fafafa",
          }}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(tx.amount)}
        </span>
      </div>

      {/* Actions */}
      <button
        onClick={() => onDelete(tx.id)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 6,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.4,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.4";
        }}
      >
        <Trash2 size={14} color="#ef4444" />
      </button>
    </div>
  );
}
