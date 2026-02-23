const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

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