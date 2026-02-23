import type { NextConfig } from "next";

// Supabase project ref extracted from the public URL so the CSP can be
// locked to that specific subdomain rather than *.supabase.co.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '*.supabase.co'

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block the page from being embedded (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Force HTTPS for 2 years; include subdomains
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Restrict referrer leakage
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by this app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // Content Security Policy
  // — script-src: only same-origin + Next.js inline scripts (nonce-based in prod is ideal)
  // — connect-src: allow Supabase REST/Auth/Realtime endpoints only
  // — frame-ancestors: explicit deny (belt-and-suspenders with X-Frame-Options)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",   // 'unsafe-inline' needed for Next.js hydration; migrate to nonces when ready
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      "img-src 'self' data: blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
