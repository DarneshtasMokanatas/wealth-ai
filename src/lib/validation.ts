const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** Minimum password length (NIST SP 800-63B / FinTech best practice) */
export const PASSWORD_MIN_LENGTH = 12
/** Maximum prevents bcrypt-DoS (bcrypt cost explosion on very long inputs) */
export const PASSWORD_MAX_LENGTH = 128

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false

  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsedDate.getTime())) return false

  return parsedDate.toISOString().slice(0, 10) === value
}

export function toBoundedString(
  value: unknown,
  { minLength = 1, maxLength = 120 }: { minLength?: number; maxLength?: number } = {}
): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed.length < minLength || trimmed.length > maxLength) return null

  return trimmed
}

export function toPositiveAmount(value: unknown, max = 100000000): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value <= 0 || value > max) return null

  return Math.round(value * 100) / 100
}

/**
 * Validates a password against FinTech policy:
 * - 12–128 characters
 * Returns an error string or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be no more than ${PASSWORD_MAX_LENGTH} characters.`
  }
  return null
}

// ── Error Sanitisation ──────────────────────────────────────────────────────

/**
 * Returns a generic user-facing error message.
 * Prevents leaking internal DB details (constraint names, error codes, etc.)
 * while still logging the original for debugging.
 */
export function safeErrorMessage(error: { message?: string; code?: string } | null, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallback
  // Log the real error server-side for debugging
  console.error('[db-error]', error.code, error.message)
  return fallback
}

// ── Avatar URL Validation ──────────────────────────────────────────────────

/** Allow-listed protocol + host patterns for avatar URLs. */
const AVATAR_ALLOWED_HOSTS = [
  /^[a-z0-9-]+\.supabase\.co$/,          // Supabase storage
  /^[a-z0-9-]+\.supabase\.in$/,
  /^lh3\.googleusercontent\.com$/,        // Google profile pictures
  /^avatars\.githubusercontent\.com$/,     // GitHub avatars
  /^www\.gravatar\.com$/,
  /^i\.pravatar\.cc$/,                     // dev/demo placeholder
]

/**
 * Validates and sanitises an avatar URL.
 * Returns the URL if safe, or null if it should be rejected.
 */
export function sanitiseAvatarUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    // Only allow https (and http for localhost dev)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    // Block javascript:, data:, blob: etc.
    if (!AVATAR_ALLOWED_HOSTS.some((re) => re.test(url.hostname))) return null
    return url.href
  } catch {
    return null
  }
}