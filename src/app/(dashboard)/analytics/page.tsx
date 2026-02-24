import { getMonthlyTrend, getDayOfWeekBreakdown, getCategoryMoM } from '@/lib/data'
import AnalyticsView from './analytics-view'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const [trend, dayOfWeek, mom] = await Promise.all([
    getMonthlyTrend(6),
    getDayOfWeekBreakdown(),
    getCategoryMoM(),
  ])

  return <AnalyticsView initialTrend={trend} dayOfWeek={dayOfWeek} categoryMoM={mom} />
}
