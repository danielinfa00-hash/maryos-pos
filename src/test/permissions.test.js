import { describe, expect, it } from 'vitest'
import { hasRole } from '../utils/permissions'

describe('permissions (sin roles)', () => {
  it('hasRole siempre retorna true', () => {
    expect(hasRole(null)).toBe(true)
    expect(hasRole({})).toBe(true)
  })
})
