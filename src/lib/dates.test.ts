import { describe, expect, it } from 'vitest'
import { isValidDate, safeISOString } from './dates'

describe('isValidDate', () => {
  it('true para Date válida', () => {
    expect(isValidDate(new Date('2026-05-01'))).toBe(true)
  })

  it('false para new Date(NaN)', () => {
    expect(isValidDate(new Date(NaN))).toBe(false)
  })

  it('false para Date hecha con string inválido', () => {
    expect(isValidDate(new Date('totalmente-inválido'))).toBe(false)
  })

  it('false para null', () => {
    expect(isValidDate(null)).toBe(false)
  })

  it('false para undefined', () => {
    expect(isValidDate(undefined)).toBe(false)
  })
})

describe('safeISOString', () => {
  it('devuelve ISO string para Date válida', () => {
    const d = new Date('2026-05-08T12:00:00Z')
    expect(safeISOString(d)).toBe('2026-05-08T12:00:00.000Z')
  })

  it('devuelve undefined para new Date(NaN)', () => {
    expect(safeISOString(new Date(NaN))).toBeUndefined()
  })

  it('devuelve undefined para null', () => {
    expect(safeISOString(null)).toBeUndefined()
  })

  it('devuelve undefined para undefined', () => {
    expect(safeISOString(undefined)).toBeUndefined()
  })

  it('NO lanza RangeError con Invalid Date (regression test)', () => {
    expect(() => safeISOString(new Date(NaN))).not.toThrow()
  })
})
