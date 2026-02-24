"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Lock } from "lucide-react";
import { addCategory, updateCategory, deleteCategory } from "./actions";
import type { Category } from "@/lib/types";

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "savings", label: "Savings" },
] as const;

type FormState = {
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income" | "savings";
};

const BLANK: FormState = { name: "", icon: "", color: "#6b7280", type: "expense" };

export default function CategoriesView({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Inline feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  function openAdd() {
    setEditTarget(null);
    setForm(BLANK);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
    });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditTarget(null);
    setFormError(null);
  }

  async function handleSave() {
    setFormLoading(true);
    setFormError(null);

    const result = editTarget
      ? await updateCategory(editTarget.id, form)
      : await addCategory(form);

    setFormLoading(false);

    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    closeModal();
    showFeedback("success", editTarget ? "Category updated." : "Category created.");
    startTransition(() => router.refresh());
    // Optimistic local update
    if (!editTarget && "category" in result) {
      const added = (result as { success: true; category: Category }).category;
      setCategories((prev) => [...prev, added]);
    } else if (editTarget) {
      setCategories((prev): Category[] =>
        prev.map((c) =>
          c.id === editTarget.id
            ? { ...c, name: form.name, icon: form.icon, color: form.color, type: form.type }
            : c
        )
      );
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;

    const result = await deleteCategory(cat.id);
    if ("error" in result) {
      showFeedback("error", result.error);
      return;
    }
    showFeedback("success", `"${cat.name}" deleted.`);
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    startTransition(() => router.refresh());
  }

  const systemCats = categories.filter((c) => c.is_system);
  const customCats = categories.filter((c) => !c.is_system);

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
    maxWidth: 420,
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
            Categories
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            System categories are built-in. Create your own to tag transactions and budgets.
          </p>
          {feedback && (
            <div
              role="status"
              aria-live="polite"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                color: feedback.type === "error" ? "#fca5a5" : "#6ee7b7",
                border:
                  feedback.type === "error"
                    ? "1px solid rgba(239,68,68,0.25)"
                    : "1px solid rgba(16,185,129,0.25)",
                background:
                  feedback.type === "error"
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(16,185,129,0.1)",
              }}
            >
              {feedback.message}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={isPending}>
          <Plus size={16} />
          New Category
        </button>
      </div>

      {/* ── Custom categories ── */}
      {customCats.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 12,
            }}
          >
            Your Categories
          </h3>
          <div className="goals-grid">
            {customCats.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      {customCats.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: 40,
            textAlign: "center",
            marginBottom: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 32 }}>🏷️</span>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            No custom categories yet
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Create one to tag transactions or budgets with your own labels.
          </p>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={openAdd}>
            <Plus size={16} />
            New Category
          </button>
        </div>
      )}

      {/* ── System categories ── */}
      <section>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 12,
          }}
        >
          Built-in Categories
        </h3>
        <div className="goals-grid">
          {systemCats.map((cat) => (
            <CategoryCard key={cat.id} cat={cat} readonly />
          ))}
        </div>
      </section>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              onClick={closeModal}
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

            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginBottom: 20,
              }}
            >
              {editTarget ? "Edit Category" : "New Category"}
            </h3>

            {formError && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.1)",
                }}
              >
                {formError}
              </div>
            )}

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                placeholder="e.g. Hobbies"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                autoFocus
                maxLength={40}
              />
            </div>

            {/* Icon + Color in one row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Icon (emoji)</label>
                <input
                  type="text"
                  placeholder="🎯"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value.trim().slice(0, 8) }))}
                  style={{ ...inputStyle, fontSize: 20, textAlign: "center" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-card)",
                      cursor: "pointer",
                      padding: 2,
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setForm((f) => ({ ...f, color: v }));
                    }}
                    style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13 }}
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Type */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: opt.value }))}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background:
                        form.type === opt.value ? "#10b981" : "var(--color-bg-card)",
                      color:
                        form.type === opt.value ? "#022c22" : "var(--color-text-secondary)",
                      border:
                        form.type === opt.value
                          ? "1px solid #10b981"
                          : "1px solid var(--color-border)",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
                {form.type === "income"
                  ? "Income categories won't appear in budget planning."
                  : form.type === "savings"
                  ? "Savings categories can be budgeted but are tracked separately."
                  : "Expense categories appear in budgets and spending analytics."}
              </p>
            </div>

            {/* Preview */}
            {form.name && form.icon && (
              <div
                style={{
                  marginBottom: 20,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(16,185,129,0.05)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Preview:</span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${form.color}20`,
                    border: `1px solid ${form.color}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  {form.icon}
                </div>
                <span style={{ fontWeight: 600, color: form.color, fontSize: 14 }}>
                  {form.name}
                </span>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={
                formLoading ||
                !form.name.trim() ||
                !form.icon.trim() ||
                !/^#[0-9a-fA-F]{6}$/.test(form.color)
              }
              onClick={handleSave}
            >
              {formLoading
                ? editTarget
                  ? "Saving…"
                  : "Creating…"
                : editTarget
                ? "Save Changes"
                : "Create Category"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  cat,
  readonly = false,
  onEdit,
  onDelete,
}: {
  cat: Category;
  readonly?: boolean;
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
}) {
  const typeLabel =
    cat.type === "income" ? "Income" : cat.type === "savings" ? "Savings" : "Expense";
  const typeDot =
    cat.type === "income" ? "#22c55e" : cat.type === "savings" ? "#10b981" : "#f97316";

  return (
    <div
      className="glass-card"
      style={{ padding: 20, display: "flex", alignItems: "center", gap: 14 }}
    >
      {/* Icon orb */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${cat.color}18`,
          border: `1px solid ${cat.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {cat.icon}
      </div>

      {/* Name + type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cat.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: typeDot,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{typeLabel}</span>
          {readonly && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--color-text-dim)",
                background: "var(--color-bg-hover-strong)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                padding: "1px 5px",
                letterSpacing: "0.04em",
                marginLeft: 2,
              }}
            >
              BUILT-IN
            </span>
          )}
        </div>
      </div>

      {/* Color swatch */}
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: cat.color,
          border: "1px solid rgba(255,255,255,0.15)",
          flexShrink: 0,
        }}
        title={cat.color}
      />

      {/* Actions */}
      {readonly ? (
        <Lock
          size={14}
          color="var(--color-text-dim)"
          style={{ flexShrink: 0, opacity: 0.5 }}
        />
      ) : (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            aria-label={`Edit ${cat.name}`}
            title="Edit"
            onClick={() => onEdit?.(cat)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              opacity: 0.4,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.4";
            }}
          >
            <Pencil size={13} color="var(--color-text-secondary)" />
          </button>
          <button
            aria-label={`Delete ${cat.name}`}
            title="Delete"
            onClick={() => onDelete?.(cat)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              opacity: 0.4,
              transition: "opacity 0.15s",
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
      )}
    </div>
  );
}
