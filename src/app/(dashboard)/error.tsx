'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Unable to load dashboard</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        Something went wrong while loading your financial data.
      </p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
