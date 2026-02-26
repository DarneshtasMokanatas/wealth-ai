/**
 * Structured security event logger.
 *
 * Emits JSON-formatted log lines to stdout (captured by Vercel/container logs).
 * In production, pipe these to a SIEM or structured logging service.
 */

export type SecurityEventType =
  | 'auth:login_success'
  | 'auth:login_failure'
  | 'auth:signup'
  | 'auth:password_change'
  | 'auth:forgot_password'
  | 'auth:signout'
  | 'rate_limit:exceeded'
  | 'cron:executed'
  | 'cron:unauthorized'
  | 'data:unauthorized_access'

interface SecurityEvent {
  event: SecurityEventType
  userId?: string
  ip?: string
  meta?: Record<string, unknown>
}

/**
 * Log a security-relevant event as structured JSON.
 *
 * @example
 * logSecurityEvent({ event: 'auth:login_failure', ip: '1.2.3.4', meta: { email: 'masked' } })
 */
export function logSecurityEvent(evt: SecurityEvent): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'security',
    ...evt,
  }

  // Use console.warn for security events so they stand out in log streams
  console.warn(JSON.stringify(entry))
}
