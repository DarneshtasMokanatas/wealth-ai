'use client'

import { useState, useTransition } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Sparkles, Send, AlertCircle } from 'lucide-react'
import { fetchTrend, getAIInsights, askAnalyticsQuestion } from './actions'
import { formatCurrency } from '@/lib/utils'
import type { MonthlyTrendPoint, DayOfWeekPoint, CategoryMoMPoint } from '@/lib/data'

// ── Custom Tooltip ──────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-text-primary)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialTrend: MonthlyTrendPoint[]
  dayOfWeek: DayOfWeekPoint[]
  categoryMoM: CategoryMoMPoint[]
}

const RANGES: { label: string; value: 3 | 6 | 12 }[] = [
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: '12M', value: 12 },
]

const DAY_COLORS = ['#34d399', '#10b981', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AnalyticsView({ initialTrend, dayOfWeek, categoryMoM }: Props) {
  const [selectedRange, setSelectedRange] = useState<3 | 6 | 12>(6)
  const [trendData, setTrendData] = useState(initialTrend)
  const [isPending, startTransition] = useTransition()

  // AI state
  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState('')

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [answerError, setAnswerError] = useState('')

  function changeRange(r: 3 | 6 | 12) {
    setSelectedRange(r)
    startTransition(async () => {
      const data = await fetchTrend(r)
      setTrendData(data)
    })
  }

  async function handleGenerateInsights() {
    setInsightsLoading(true)
    setInsightsError('')
    setInsights([])
    const result = await getAIInsights()
    setInsightsLoading(false)
    if ('error' in result) {
      setInsightsError(result.error)
    } else {
      setInsights(result.insights)
    }
  }

  async function handleAsk() {
    if (!question.trim()) return
    setAnswerLoading(true)
    setAnswerError('')
    setAnswer('')
    const result = await askAnalyticsQuestion(question)
    setAnswerLoading(false)
    if ('error' in result) {
      setAnswerError(result.error)
    } else {
      setAnswer(result.answer)
    }
  }

  // Peak day for highlighting
  const peakDay = [...dayOfWeek].sort((a, b) => b.average - a.average)[0]?.day

  const sectionTitle: React.CSSProperties = {
    fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)',
    marginBottom: 4, letterSpacing: '-0.01em',
  }
  const sectionSubtitle: React.CSSProperties = {
    fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20,
  }
  const card: React.CSSProperties = { marginBottom: 24 }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Analytics
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Deeper insights into your spending patterns, trends, and habits.
        </p>
      </div>

      {/* ── AI Insights & Ask Anything ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* AI Insights */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} color="#a78bfa" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>AI Insights</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Gemini analyses your patterns and surfaces what matters.
          </p>

          {insights.length === 0 && !insightsLoading && !insightsError && (
            <button
              className="btn-primary"
              onClick={handleGenerateInsights}
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            >
              <Sparkles size={14} />
              Generate Insights
            </button>
          )}

          {insightsLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--color-border)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              Analysing your data…
            </div>
          )}

          {insightsError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>{insightsError}</span>
            </div>
          )}

          {insights.length > 0 && (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insights.map((insight, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderRadius: 99, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{insight}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleGenerateInsights}
                style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Regenerate
              </button>
            </>
          )}
        </div>

        {/* Ask Anything */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Send size={15} color="#34d399" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Ask Anything</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Ask Gemini a question about your finances.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="e.g. Which category am I overspending on?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAsk() }}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                border: '1px solid var(--color-border)', background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)', fontSize: 13, outline: 'none',
              }}
            />
            <button
              className="btn-primary"
              onClick={handleAsk}
              disabled={!question.trim() || answerLoading}
              style={{ padding: '10px 14px', opacity: question.trim() && !answerLoading ? 1 : 0.4 }}
            >
              <Send size={14} />
            </button>
          </div>

          {!answer && !answerLoading && !answerError && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'What is my biggest expense category?',
                'Am I saving enough this month?',
                'Which day should I avoid spending?',
                'How is my income trending?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); }}
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 99,
                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)', cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {answerLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)', fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: '2px solid var(--color-border)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              Thinking…
            </div>
          )}

          {answerError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
              <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: '#f87171' }}>{answerError}</span>
            </div>
          )}

          {answer && (
            <div style={{ flex: 1, padding: 14, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{answer}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: Spending Trends ─────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 24, ...card }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <p style={sectionTitle}>Spending Trends</p>
            <p style={{ ...sectionSubtitle, marginBottom: 0 }}>Income vs expenses over time</p>
          </div>
          {/* Range selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => changeRange(r.value)}
                disabled={isPending}
                style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  cursor: isPending ? 'wait' : 'pointer', transition: 'all 0.15s',
                  background: selectedRange === r.value ? '#10b981' : 'var(--color-bg-card)',
                  color: selectedRange === r.value ? '#022c22' : 'var(--color-text-secondary)',
                  border: selectedRange === r.value ? '1px solid #10b981' : '1px solid var(--color-border)',
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} width={52} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingTop: 12 }} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#6366f1" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Section 2: Day-of-Week Breakdown ──────────────────────────────── */}
      <div className="glass-card" style={{ padding: 24, ...card }}>
        <p style={sectionTitle}>Biggest Spending Day</p>
        <p style={sectionSubtitle}>Average transaction spend by day of the week</p>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dayOfWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM${v.toFixed(0)}`} width={56} />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar dataKey="average" name="Avg spend" radius={[6, 6, 0, 0]}>
              {dayOfWeek.map((entry, i) => (
                <Cell
                  key={entry.day}
                  fill={entry.day === peakDay ? '#f59e0b' : DAY_COLORS[i % DAY_COLORS.length]}
                  opacity={entry.day === peakDay ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {peakDay && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 10, textAlign: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{peakDay}</span> is your heaviest spending day on average.
          </p>
        )}
      </div>

      {/* ── Section 3: Month-over-Month ───────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 24, ...card }}>
        <p style={sectionTitle}>Month-over-Month Comparison</p>
        <p style={sectionSubtitle}>Current month vs last month by category</p>

        {categoryMoM.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>
            Not enough data yet — add more transactions to see comparisons.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {categoryMoM.map((c) => {
              const isUp = c.change > 0
              const isDown = c.change < 0
              const isNew = c.previous === 0 && c.current > 0
              const maxAmt = Math.max(...categoryMoM.map((x) => Math.max(x.current, x.previous)))
              const curPct = maxAmt > 0 ? (c.current / maxAmt) * 100 : 0
              const prevPct = maxAmt > 0 ? (c.previous / maxAmt) * 100 : 0

              return (
                <div key={c.categoryId} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{c.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {formatCurrency(c.current)}
                      </span>
                      {isNew ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>NEW</span>
                      ) : isUp ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                          <TrendingUp size={11} /> +{c.change.toFixed(1)}%
                        </span>
                      ) : isDown ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                          <TrendingDown size={11} /> {c.change.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(107,114,128,0.1)', color: 'var(--color-text-muted)' }}>
                          <Minus size={11} /> 0%
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Dual progress bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 38, textAlign: 'right' }}>This mo.</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${curPct}%`, background: c.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 38, textAlign: 'right' }}>Last mo.</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prevPct}%`, background: `${c.color}55`, borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
