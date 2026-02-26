"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  isToday,
} from "date-fns"
import { ChevronLeft, ChevronRight, X, CalendarDays } from "lucide-react"
import { Transaction, Category } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialTransactions: Transaction[]
  categories: Category[]
  year: number
  month: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const first = startOfMonth(new Date(year, month, 1))
  const last  = endOfMonth(first)
  const days  = eachDayOfInterval({ start: first, end: last })
  const leadingBlanks = getDay(first) // 0=Sun … 6=Sat
  const grid: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...days,
  ]
  // Pad to complete rows of 7
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return map
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarView({ initialTransactions, categories, year, month }: Props) {
  const router   = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])

  const grid       = useMemo(() => buildCalendarGrid(year, month), [year, month])
  const byDate     = useMemo(() => groupByDate(initialTransactions), [initialTransactions])
  const currentDate = new Date()

  // Year options: ±5 years from today
  const thisYear = currentDate.getFullYear()
  const yearOptions = Array.from({ length: 11 }, (_, i) => thisYear - 5 + i)

  // ─── Navigation ────────────────────────────────────────────────────

  function navigate(y: number, m: number) {
    // Normalise overflow e.g. month=12 → year+1, month=0
    const d = new Date(y, m, 1)
    router.push(`/calendar?year=${d.getFullYear()}&month=${d.getMonth()}`)
  }

  function handlePrev() { navigate(year, month - 1) }
  function handleNext() { navigate(year, month + 1) }

  // ─── Panel close on Escape / outside click ─────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedDate(null)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  function handleOverlayClick(e: React.MouseEvent) {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setSelectedDate(null)
    }
  }

  // ─── Derived data for selected day ─────────────────────────────────

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null
  const selectedTxs = selectedKey ? (byDate.get(selectedKey) ?? []) : []

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "0 0 40px" }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(16,185,129,0.3)",
        }}>
          <CalendarDays size={20} color="#022c22" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Calendar
          </h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
            Spot spending patterns by browsing daily transactions
          </p>
        </div>
      </div>

      {/* ── Calendar card ─────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: "20px 20px 24px", overflow: "hidden" }}>

        {/* Month / year navigation */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, marginBottom: 20,
        }}>
          {/* Prev chevron */}
          <button
            onClick={handlePrev}
            style={{
              background: "var(--color-bg-hover)", border: "1px solid var(--color-border)",
              borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex",
              alignItems: "center", color: "var(--color-text-secondary)",
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Month + Year selects */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={month}
              onChange={e => navigate(year, parseInt(e.target.value, 10))}
              style={{
                background: "var(--color-bg-hover)", border: "1px solid var(--color-border)",
                borderRadius: 8, padding: "6px 10px", color: "var(--color-text-primary)",
                fontSize: 14, fontWeight: 600, cursor: "pointer", outline: "none",
              }}
              aria-label="Select month"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={e => navigate(parseInt(e.target.value, 10), month)}
              style={{
                background: "var(--color-bg-hover)", border: "1px solid var(--color-border)",
                borderRadius: 8, padding: "6px 10px", color: "var(--color-text-primary)",
                fontSize: 14, fontWeight: 600, cursor: "pointer", outline: "none",
              }}
              aria-label="Select year"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Next chevron */}
          <button
            onClick={handleNext}
            style={{
              background: "var(--color-bg-hover)", border: "1px solid var(--color-border)",
              borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex",
              alignItems: "center", color: "var(--color-text-secondary)",
            }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4, marginBottom: 4,
        }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{
              textAlign: "center", fontSize: 11, fontWeight: 600,
              color: "var(--color-text-muted)", letterSpacing: "0.06em",
              textTransform: "uppercase", padding: "4px 0",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
        }}>
          {grid.map((day, i) => {
            if (!day) {
              return <div key={`blank-${i}`} />
            }

            const key   = format(day, "yyyy-MM-dd")
            const txs   = byDate.get(key) ?? []
            const today = isToday(day)
            const selected = selectedDate ? isSameDay(day, selectedDate) : false

            // Separate income and expense totals — coerce to number to handle
            // Supabase numeric columns that may arrive as strings
            let totalIncome   = 0
            let totalExpenses = 0
            for (const tx of txs) {
              const amt = Math.abs(Number(tx.amount))
              if (tx.type === "income") totalIncome   += amt
              else                      totalExpenses += amt
            }

            const hasData     = txs.length > 0
            const hasIncome   = totalIncome   > 0
            const hasExpenses = totalExpenses > 0
            const borderColor = selected ? "#10b981"
              : today ? "rgba(16,185,129,0.5)" : "transparent"

            return (
              <button
                key={key}
                onClick={() => {
                  if (hasData) setSelectedDate(selected ? null : day)
                }}
                style={{
                  background: selected
                    ? "rgba(16,185,129,0.12)"
                    : hasData ? "var(--color-bg-hover)" : "transparent",
                  border: `2px solid ${borderColor}`,
                  borderRadius: 8,
                  padding: "6px 4px",
                  cursor: hasData ? "pointer" : "default",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 2, minHeight: 64, transition: "background 0.15s, border-color 0.15s",
                  position: "relative",
                }}
                aria-label={`${format(day, "MMMM d, yyyy")}${hasData ? `: ${txs.length} transaction(s)` : ""}`}
              >
                {/* Day number */}
                <span style={{
                  fontSize: 13, fontWeight: today ? 700 : 500,
                  color: today ? "#10b981" : "var(--color-text-secondary)",
                  lineHeight: 1,
                }}>
                  {format(day, "d")}
                </span>

                {/* Income total — always green */}
                {hasIncome && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#10b981",
                    lineHeight: 1, textAlign: "center", wordBreak: "break-all",
                    maxWidth: "100%", overflow: "hidden",
                  }}>
                    +{formatCurrency(totalIncome)}
                  </span>
                )}

                {/* Expense total — always red */}
                {hasExpenses && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#ef4444",
                    lineHeight: 1, textAlign: "center", wordBreak: "break-all",
                    maxWidth: "100%", overflow: "hidden",
                  }}>
                    -{formatCurrency(totalExpenses)}
                  </span>
                )}

                {/* Count badge */}
                {hasData && (
                  <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: "var(--color-text-muted)",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 4, padding: "1px 4px",
                      lineHeight: 1.4,
                    }}>
                      {txs.length} tx{txs.length !== 1 ? "s" : ""}
                    </span>
                  )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)",
          display: "flex", gap: 20, flexWrap: "wrap",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            Income
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            Expense
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2, border: "2px solid rgba(16,185,129,0.5)",
              display: "inline-block",
            }} />
            Today
          </span>
        </div>
      </div>

      {/* ── Monthly summary strip ─────────────────────────────────────── */}
      <MonthlySummary transactions={initialTransactions} />

      {/* ── Slide-in day panel ───────────────────────────────────────── */}
      {selectedDate && (
        <>
          {/* Scrim */}
          <div
            onClick={handleOverlayClick}
            style={{
              position: "fixed", top: 64, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)",
              zIndex: 40, backdropFilter: "blur(2px)",
            }}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            style={{
              position: "fixed", top: 64, right: 0, bottom: 0, width: "min(400px, 100vw)",
              background: "var(--color-bg-card)", borderLeft: "1px solid var(--color-border)",
              zIndex: 50, overflowY: "auto", padding: 24,
              boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
              transform: "translateX(0)", transition: "transform 0.25s ease",
            }}
          >
            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 20,
            }}>
              <div>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 500 }}>
                  {format(selectedDate, "EEEE")}
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 2 }}>
                  {format(selectedDate, "MMMM d, yyyy")}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  background: "var(--color-bg-hover)", border: "1px solid var(--color-border)",
                  borderRadius: 8, padding: "6px 8px", cursor: "pointer",
                  display: "flex", alignItems: "center", color: "var(--color-text-secondary)",
                }}
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Day totals */}
            <DayTotals transactions={selectedTxs} />

            {/* Transaction list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {selectedTxs.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center", padding: "24px 0" }}>
                  No transactions on this day.
                </p>
              ) : (
                selectedTxs
                  .slice()
                  .sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))
                  .map(tx => {
                    const cat = catMap.get(tx.category)
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px", borderRadius: 10,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {/* Category icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          background: cat?.color ? `${cat.color}22` : "rgba(255,255,255,0.08)",
                          border: `1px solid ${cat?.color ?? "var(--color-border)"}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 17,
                        }}>
                          {cat?.icon ?? "💳"}
                        </div>

                        {/* Description + category name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {tx.description}
                          </p>
                          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                            {cat?.name ?? tx.category}
                            {tx.isRecurring && (
                              <span style={{ marginLeft: 6, color: "#10b981" }}>↻ recurring</span>
                            )}
                          </p>
                        </div>

                        {/* Amount */}
                        <span style={{
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                          color: tx.type === "income" ? "#10b981" : "#ef4444",
                        }}>
                          {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(Number(tx.amount)))}
                        </span>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DayTotals({ transactions }: { transactions: Transaction[] }) {
  const income   = transactions.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const net      = income - expenses

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8, padding: "12px", borderRadius: 10,
      background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)",
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Income</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginTop: 4 }}>{formatCurrency(income)}</p>
      </div>
      <div style={{ textAlign: "center", borderLeft: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expenses</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", marginTop: 4 }}>{formatCurrency(expenses)}</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Net</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: net >= 0 ? "#10b981" : "#ef4444", marginTop: 4 }}>
          {net >= 0 ? "+" : ""}{formatCurrency(Math.abs(net))}
        </p>
      </div>
    </div>
  )
}

function MonthlySummary({ transactions }: { transactions: Transaction[] }) {
  const income     = transactions.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const expenses   = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const activeDays = new Set(transactions.map(t => t.date.slice(0, 10))).size

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12, marginTop: 16,
    }}>
      {[
        { label: "Month income",   value: formatCurrency(income),         color: "#10b981" },
        { label: "Month expenses", value: formatCurrency(expenses),        color: "#ef4444" },
        { label: "Active days",    value: String(activeDays),              color: "var(--color-text-primary)" },
      ].map(({ label, value, color }) => (
        <div key={label} className="glass-card" style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
          <p style={{ fontSize: 18, fontWeight: 700, color, marginTop: 6 }}>{value}</p>
        </div>
      ))}
    </div>
  )
}
