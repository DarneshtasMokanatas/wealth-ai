import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Service-role client — bypasses RLS.
 * ONLY use in trusted server contexts (cron route handlers, not browser code).
 */
export function createServiceClient() {
  if (!env.supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local and your deployment environment.'
    )
  }
  return createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
