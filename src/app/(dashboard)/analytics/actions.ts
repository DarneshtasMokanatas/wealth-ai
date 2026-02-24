'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/lib/env'
import { getAnalyticsSummary, getMonthlyTrend, MonthlyTrendPoint } from '@/lib/data'

export async function fetchTrend(months: 3 | 6 | 12): Promise<MonthlyTrendPoint[]> {
  return getMonthlyTrend(months)
}
import { formatCurrency } from '@/lib/utils'

function buildContext(summary: Awaited<ReturnType<typeof getAnalyticsSummary>>): string {
  const recent = summary.monthlyTrend.slice(-3)
  const lines: string[] = [
    `Currency: MYR (Malaysian Ringgit)`,
    ``,
    `== Monthly Trend (last 6 months) ==`,
    ...summary.monthlyTrend.map(
      (m) => `${m.month}: income ${formatCurrency(m.income)}, expenses ${formatCurrency(m.expenses)}, net ${formatCurrency(m.net)}`
    ),
    ``,
    `== Top Spending Categories (all time) ==`,
    ...summary.topCategories.map(
      (c) => `${c.icon} ${c.category}: ${formatCurrency(c.amount)}`
    ),
    ``,
    `== Month-over-Month Category Changes (current vs last month) ==`,
    ...summary.categoryMoM.map(
      (c) => `${c.icon} ${c.category}: current ${formatCurrency(c.current)}, prev ${formatCurrency(c.previous)}, change ${c.change >= 0 ? '+' : ''}${c.change.toFixed(1)}%`
    ),
    ``,
    `== Average Spend by Day of Week ==`,
    ...summary.dayOfWeek.map(
      (d) => `${d.day}: avg ${formatCurrency(d.average)} (${d.count} transactions)`
    ),
    ``,
    `Peak spending day: ${summary.peakSpendingDay ?? 'N/A'}`,
    summary.quietestDay ? `Quietest spending day: ${summary.quietestDay}` : '',
    ``,
    `== Recent 3-month summary ==`,
    ...recent.map(
      (m) => `${m.month}: income ${formatCurrency(m.income)}, expenses ${formatCurrency(m.expenses)}`
    ),
  ]
  return lines.filter(Boolean).join('\n')
}

export async function getAIInsights(): Promise<{ insights: string[] } | { error: string }> {
  if (!env.geminiApiKey) return { error: 'Gemini API key not configured.' }

  try {
    const summary = await getAnalyticsSummary()
    const context = buildContext(summary)

    const genAI = new GoogleGenerativeAI(env.geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a personal finance analyst. Based on this user's spending data, provide exactly 5 concise, actionable insights. Each insight should be one sentence, specific (reference actual numbers or percentages), and helpful. Do NOT use markdown formatting, bullet points, or headers — just return the 5 insights separated by newlines, nothing else.

${context}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const insights = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5)

    return { insights }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { error: `Gemini error: ${msg}` }
  }
}

export async function askAnalyticsQuestion(
  question: string
): Promise<{ answer: string } | { error: string }> {
  if (!env.geminiApiKey) return { error: 'Gemini API key not configured.' }
  if (!question.trim()) return { error: 'Please enter a question.' }

  try {
    const summary = await getAnalyticsSummary()
    const context = buildContext(summary)

    const genAI = new GoogleGenerativeAI(env.geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a personal finance assistant. Use only the data below to answer the user's question. Be concise (2–4 sentences). Do not make up data not shown. If the answer cannot be determined from the data, say so briefly.

${context}

User question: ${question}`

    const result = await model.generateContent(prompt)
    const answer = result.response.text().trim()
    return { answer }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { error: `Gemini error: ${msg}` }
  }
}
