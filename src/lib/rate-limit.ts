/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * For production at scale, replace with an external store such as
 * @upstash/ratelimit + Vercel KV.  This module provides defence-in-depth
 * for single-instance or serverless-with-warm-instances deployments.
 *
 * Security note: the limiter is keyed by a caller-provided identifier
 * (IP, user ID, etc.) — never by user-controlled strings that could be
 * spoofed to bypass limits.
 */

interface SlidingWindow {
  timestamps: number[]
}

const buckets = new Map<string, SlidingWindow>()

/** Evict stale entries every 5 minutes to prevent memory growth. */
const EVICTION_INTERVAL_MS = 5 * 60 * 1000
let lastEviction = Date.now()

function evictStale(windowMs: number) {
  const now = Date.now()
  if (now - lastEviction < EVICTION_INTERVAL_MS) return
  lastEviction = now

  const cutoff = now - windowMs
  for (const [key, window] of buckets) {
    window.timestamps = window.timestamps.filter((t) => t > cutoff)
    if (window.timestamps.length === 0) buckets.delete(key)
  }
}

export interface RateLimitConfig {
  /** Unique namespace for this limiter (e.g. "login", "ai-question"). */
  name: string
  /** Maximum number of requests allowed in the window. */
  maxRequests: number
  /** Window duration in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Remaining requests in the current window (0 if exhausted). */
  remaining: number
  /** Unix-ms timestamp when the window resets. */
  resetAt: number
}

/**
 * Check (and count) a request against a sliding-window rate limit.
 *
 * @param config  – limiter configuration
 * @param key     – caller identifier (IP address, user ID, etc.)
 * @returns whether the request is allowed
 */
export function checkRateLimit(config: RateLimitConfig, key: string): RateLimitResult {
  const bucketKey = `${config.name}:${key}`
  const now = Date.now()
  const cutoff = now - config.windowMs

  evictStale(config.windowMs)

  let window = buckets.get(bucketKey)
  if (!window) {
    window = { timestamps: [] }
    buckets.set(bucketKey, window)
  }

  // Discard timestamps outside the window
  window.timestamps = window.timestamps.filter((t) => t > cutoff)

  if (window.timestamps.length >= config.maxRequests) {
    // Rate limited — compute when the oldest request in the window expires
    const oldestInWindow = window.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + config.windowMs,
    }
  }

  window.timestamps.push(now)

  return {
    allowed: true,
    remaining: config.maxRequests - window.timestamps.length,
    resetAt: now + config.windowMs,
  }
}

// ── Pre-configured limiters ────────────────────────────────────────────────

/** 5 login attempts per minute per IP. */
export const LOGIN_LIMIT: RateLimitConfig = {
  name: 'login',
  maxRequests: 5,
  windowMs: 60_000,
}

/** 3 forgot-password attempts per minute per IP. */
export const FORGOT_PASSWORD_LIMIT: RateLimitConfig = {
  name: 'forgot-password',
  maxRequests: 3,
  windowMs: 60_000,
}

/** 10 AI questions per minute per user. */
export const AI_QUESTION_LIMIT: RateLimitConfig = {
  name: 'ai-question',
  maxRequests: 10,
  windowMs: 60_000,
}

/** 5 AI insight requests per minute per user. */
export const AI_INSIGHTS_LIMIT: RateLimitConfig = {
  name: 'ai-insights',
  maxRequests: 5,
  windowMs: 60_000,
}

/** 2 cron invocations per minute. */
export const CRON_LIMIT: RateLimitConfig = {
  name: 'cron',
  maxRequests: 2,
  windowMs: 60_000,
}
