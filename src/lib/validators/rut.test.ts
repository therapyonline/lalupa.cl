import { describe, expect, it } from 'vitest'
import { formatRut, normalizeRut, validateRut } from './rut'

describe('normalizeRut', () => {
  it('strips dots, spaces and uppercases the K', () => {
    expect(normalizeRut('11.111.111-1')).toBe('11111111-1')
    expect(normalizeRut(' 11 111 111-k ')).toBe('11111111-K')
    expect(normalizeRut('11.111.111-K')).toBe('11111111-K')
  })

  it('leaves dash and digits untouched', () => {
    expect(normalizeRut('11111111-1')).toBe('11111111-1')
  })
})

describe('validateRut', () => {
  it('accepts well-formed valid RUTs (digit DV)', () => {
    expect(validateRut('11.111.111-1')).toBe(true)
    expect(validateRut('22.222.222-2')).toBe(true)
    expect(validateRut('15.673.482-9')).toBe(true)
  })

  it('accepts well-formed valid RUTs (K DV)', () => {
    expect(validateRut('17.601.234-K')).toBe(true)
    expect(validateRut('17601234-k')).toBe(true)
  })

  it('rejects empty or malformed input', () => {
    expect(validateRut('')).toBe(false)
    expect(validateRut('123')).toBe(false)
    expect(validateRut('abc-1')).toBe(false)
    expect(validateRut('11111111')).toBe(false)
    expect(validateRut('11111111-')).toBe(false)
  })

  it('rejects wrong DV', () => {
    expect(validateRut('11.111.111-2')).toBe(false)
    expect(validateRut('22.222.222-9')).toBe(false)
  })

  it('rejects an invalid character in the body', () => {
    expect(validateRut('1A111111-1')).toBe(false)
  })

  it('handles RUTs with formatting variations', () => {
    expect(validateRut('11111111-1')).toBe(true)
    expect(validateRut('11111111 - 1')).toBe(true)
    expect(validateRut(' 11.111.111-1 ')).toBe(true)
  })
})

describe('formatRut', () => {
  it('formats body with dot separators and dash before DV', () => {
    expect(formatRut('111111111')).toBe('11.111.111-1')
    expect(formatRut('11.111.111-1')).toBe('11.111.111-1')
    expect(formatRut('17601234K')).toBe('17.601.234-K')
  })

  it('returns input as-is when too short to format', () => {
    expect(formatRut('1')).toBe('1')
    expect(formatRut('')).toBe('')
  })

  it('strips leading zeroes from the body', () => {
    expect(formatRut('0001234-5')).toBe('1.234-5')
  })

  it('uppercases K in the DV', () => {
    expect(formatRut('17601234-k')).toBe('17.601.234-K')
  })
})
