import { describe, expect, it } from 'vitest'
import { parseExpenseInput } from './categorizer'

describe('parseExpenseInput', () => {
  it('parses expense amounts with category detection', () => {
    const result = parseExpenseInput('Spent $15 on lunch at cafe')

    expect(result).not.toBeNull()
    expect(result?.amount).toBe(15)
    expect(result?.type).toBe('expense')
    expect(result?.category).toBe('food')
  })

  it('parses income wording as income type', () => {
    const result = parseExpenseInput('Received 1200 salary')

    expect(result).not.toBeNull()
    expect(result?.type).toBe('income')
    expect(result?.category).toBe('income')
  })

  it('returns null when no amount is provided', () => {
    const result = parseExpenseInput('Bought groceries')

    expect(result).toBeNull()
  })
})
