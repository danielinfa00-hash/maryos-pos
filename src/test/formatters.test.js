import { describe, it, expect } from 'vitest'
import { formatCurrency, calculateChange, truncateText, getDateRange } from '../utils/formatters'

describe('formatCurrency', () => {
  it('formats number as COP currency', () => {
    const result = formatCurrency(10000)
    expect(result).toContain('10')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('handles null/undefined', () => {
    expect(formatCurrency(null)).toContain('0')
    expect(formatCurrency(undefined)).toContain('0')
  })
})

describe('calculateChange', () => {
  it('calculates correct change', () => {
    expect(calculateChange(10000, 15000)).toBe(5000)
  })

  it('returns 0 when cash is less than total', () => {
    expect(calculateChange(10000, 5000)).toBe(0)
  })

  it('returns 0 when exact amount', () => {
    expect(calculateChange(10000, 10000)).toBe(0)
  })
})

describe('truncateText', () => {
  it('truncates long text', () => {
    const result = truncateText('Hamburguesa Especial con Queso', 10)
    expect(result.length).toBeLessThanOrEqual(11)
    expect(result).toContain('…')
  })

  it('keeps short text', () => {
    expect(truncateText('Corta', 32)).toBe('Corta')
  })

  it('handles empty', () => {
    expect(truncateText('')).toBe('')
  })
})

describe('getDateRange', () => {
  it('returns today range', () => {
    const { start, end } = getDateRange('hoy')
    expect(new Date(start)).toBeInstanceOf(Date)
    expect(new Date(end)).toBeInstanceOf(Date)
    expect(new Date(start) <= new Date(end)).toBe(true)
  })
})
