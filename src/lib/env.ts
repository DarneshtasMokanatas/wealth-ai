function requireEnv(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Ensure it is set in .env.local (for local development) or your deployment environment, then restart the Next.js process.'
    )
  }
  return value.trim()
}

export const env = {
  supabaseUrl: requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  // In production runtime, CRON_SECRET must be set — crash at startup rather than
  // silently accept unauthenticated cron requests. Skip validation during `next build`
  // (NEXT_PHASE === 'phase-production-build') so secrets aren't required at build time.
  cronSecret:
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build'
      ? requireEnv(process.env.CRON_SECRET, 'CRON_SECRET')
      : (process.env.CRON_SECRET ?? ''),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  // Optional: set to a Slack/Discord/PagerDuty webhook URL to receive real-time
  // alerts for high-severity security events (auth failures, rate-limit exceeded, etc.)
  securityWebhookUrl: process.env.SECURITY_WEBHOOK_URL ?? '',
}