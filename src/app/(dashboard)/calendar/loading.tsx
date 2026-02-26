export default function CalendarLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid var(--color-border)',
          borderTopColor: '#10b981', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Loading calendar…</p>
      </div>
    </div>
  )
}
