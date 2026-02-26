import { getAnalyticsData } from '@/lib/data'
import AnalyticsView from './analytics-view'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(6)
  const trend = data?.monthlyTrend ?? []
  const dayOfWeek = data?.dayOfWeek ?? []
  const mom = data?.categoryMoM ?? []

  return <AnalyticsView initialTrend={trend} dayOfWeek={dayOfWeek} categoryMoM={mom} />
}
