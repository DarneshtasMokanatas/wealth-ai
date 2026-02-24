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
  cronSecret: process.env.CRON_SECRET ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
}