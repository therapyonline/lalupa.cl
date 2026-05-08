import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  StorageBlockedError,
  StorageQuotaError,
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from './session-storage'

const mockStorage = (() => {
  let store: Record<string, string> = {}
  let mode: 'normal' | 'quota' | 'blocked' | 'unknown' = 'normal'
  return {
    setItem(k: string, v: string) {
      if (mode === 'quota') {
        const e = new DOMException('Quota exceeded', 'QuotaExceededError')
        throw e
      }
      if (mode === 'blocked') {
        const e = new DOMException('Storage blocked', 'SecurityError')
        throw e
      }
      if (mode === 'unknown') {
        throw new Error('Unknown failure')
      }
      store[k] = v
    },
    getItem(k: string) {
      if (mode === 'blocked') {
        throw new DOMException('Storage blocked', 'SecurityError')
      }
      return store[k] ?? null
    },
    removeItem(k: string) {
      delete store[k]
    },
    setMode(m: typeof mode) {
      mode = m
    },
    reset() {
      store = {}
      mode = 'normal'
    },
  }
})()

beforeEach(() => {
  mockStorage.reset()
  vi.stubGlobal('window', { sessionStorage: mockStorage })
  vi.stubGlobal('sessionStorage', mockStorage)
})

describe('safeSessionSet', () => {
  it('guarda un valor en modo normal', () => {
    expect(safeSessionSet('k', 'v')).toBe(true)
    expect(mockStorage.getItem('k')).toBe('v')
  })

  it('lanza StorageQuotaError cuando se llena el storage', () => {
    mockStorage.setMode('quota')
    expect(() => safeSessionSet('k', 'v')).toThrow(StorageQuotaError)
  })

  it('mensaje de StorageQuotaError es accionable para el usuario', () => {
    mockStorage.setMode('quota')
    try {
      safeSessionSet('k', 'v')
    } catch (e) {
      expect((e as Error).message).toMatch(/espacio|refrescar|chico/i)
    }
  })

  it('lanza StorageBlockedError en Private Mode', () => {
    mockStorage.setMode('blocked')
    expect(() => safeSessionSet('k', 'v')).toThrow(StorageBlockedError)
  })

  it('mensaje de StorageBlockedError menciona modo privado', () => {
    mockStorage.setMode('blocked')
    try {
      safeSessionSet('k', 'v')
    } catch (e) {
      expect((e as Error).message).toMatch(/privado|cookies/i)
    }
  })

  it('rethrow para errores desconocidos', () => {
    mockStorage.setMode('unknown')
    expect(() => safeSessionSet('k', 'v')).toThrow('Unknown failure')
  })
})

describe('safeSessionGet', () => {
  it('devuelve el valor guardado', () => {
    safeSessionSet('k', 'v')
    expect(safeSessionGet('k')).toBe('v')
  })

  it('devuelve null si la clave no existe', () => {
    expect(safeSessionGet('missing')).toBeNull()
  })

  it('devuelve null silencioso si storage está bloqueado', () => {
    mockStorage.setMode('blocked')
    expect(safeSessionGet('k')).toBeNull()
  })
})

describe('safeSessionRemove', () => {
  it('elimina la clave', () => {
    safeSessionSet('k', 'v')
    safeSessionRemove('k')
    expect(safeSessionGet('k')).toBeNull()
  })

  it('silencioso si la clave no existe', () => {
    expect(() => safeSessionRemove('missing')).not.toThrow()
  })
})
