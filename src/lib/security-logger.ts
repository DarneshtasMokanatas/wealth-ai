/**
 * Structured security event logger.
 *
 * Emits JSON-formatted log lines to stdout (captured by Vercel/container logs).
 * In production, set SECURITY_WEBHOOK_URL to a Slack/Discord/PagerDuty endpoint
 * to receive real-time alerts for high-severity events.
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

/** Events that warrant an immediate out-of-band alert. */
const HIGH_SEVERITY_EVENTS: SecurityEventType[] = [
  'auth:login_failure',
  'rate_limit:exceeded',
  'cron:unauthorized',
  'data:unauthorized_access',
]

/**
 * Log a security-relevant event as structured JSON.
 * High-severity events are also forwarded to SECURITY_WEBHOOK_URL if set.
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

  // Fire-and-forget webhook alert for high-severity events
  if (
    HIGH_SEVERITY_EVENTS.includes(evt.event) &&
    process.env.SECURITY_WEBHOOK_URL
  ) {
    fetch(process.env.SECURITY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Security Alert] \`${entry.event}\``,
        attachments: [{ text: JSON.stringify(entry, null, 2) }],
      }),
    }).catch(() => {
      // Never block the request path; swallow webhook errors silently
    })
  }
}
