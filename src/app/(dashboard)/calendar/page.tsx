import { getTransactionsForMonth, getCategories } from '@/lib/data'
import CalendarView from './calendar-view'

export const metadata = { title: 'Calendar' }

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams
  const now = new Date()
  const year  = params.year  ? parseInt(params.year,  10) : now.getFullYear()
  const month = params.month ? parseInt(params.month, 10) : now.getMonth()

  const [transactions, categories] = await Promise.all([
    getTransactionsForMonth(year, month),
    getCategories(),
  ])

  return (
    <CalendarView
      initialTransactions={transactions}
      categories={categories}
      year={year}
      month={month}
    />
  )
}
