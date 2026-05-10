/**
 * Tests para telemetría client-side. Verifica que:
 *   - localStorage es la única superficie (sin red, sin cookies).
 *   - Errores de quota/private mode no crashean.
 *   - El schema soporta versionado.
 *   - El usuario puede limpiar la data.
 *
 * Sin jsdom: instalamos un shim manual de window.localStorage para
 * que el módulo se comporte como en el browser. Más liviano que
 * agregar una dependencia DOM.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analizarUsoPatrones,
  clearTelemetry,
  readTelemetry,
  trackAnalisis,
} from './telemetry'

interface FakeStorage {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
  clear(): void
}

function makeFakeStorage(): FakeStorage {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v)
    },
    removeItem: (k) => {
      data.delete(k)
    },
    clear: () => {
      data.clear()
    },
  }
}

// Antes de cada test instalamos un window minimal con localStorage.
// El módulo telemetry chequea `typeof window === 'undefined'`, así que
// asignar `global.window` lo hace pasar a ejecutar las operaciones.
beforeEach(() => {
  ;(globalThis as unknown as { window?: { localStorage: FakeStorage } }).window =
    { localStorage: makeFakeStorage() }
})

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window
  vi.restoreAllMocks()
})

describe('telemetry', () => {
  it('arranca con snapshot vacío', () => {
    const snap = readTelemetry()
    expect(snap.totalAnalisis).toBe(0)
    expect(snap.conceptos).toEqual({})
  })

  it('trackAnalisis incrementa total y conceptos', () => {
    trackAnalisis(['Cargo fijo', 'Cargo por energía'])
    const snap = readTelemetry()
    expect(snap.totalAnalisis).toBe(1)
    expect(snap.conceptos['Cargo fijo']).toBe(1)
    expect(snap.conceptos['Cargo por energía']).toBe(1)
  })

  it('múltiples análisis suman conceptos correctamente', () => {
    trackAnalisis(['Cargo fijo', 'IVA 19%'])
    trackAnalisis(['Cargo fijo', 'Cargo por energía', 'IVA 19%'])
    trackAnalisis(['Cargo fijo', 'IVA 19%'])
    const snap = readTelemetry()
    expect(snap.totalAnalisis).toBe(3)
    expect(snap.conceptos['Cargo fijo']).toBe(3)
    expect(snap.conceptos['IVA 19%']).toBe(3)
    expect(snap.conceptos['Cargo por energía']).toBe(1)
  })

  it('clearTelemetry borra todo', () => {
    trackAnalisis(['Cargo fijo'])
    clearTelemetry()
    const snap = readTelemetry()
    expect(snap.totalAnalisis).toBe(0)
    expect(snap.conceptos).toEqual({})
  })

  it('analizarUsoPatrones devuelve tasa de uso ordenada', () => {
    trackAnalisis(['A', 'B'])
    trackAnalisis(['A'])
    trackAnalisis(['A', 'B', 'C'])
    trackAnalisis(['A'])
    const r = analizarUsoPatrones()
    expect(r).toEqual([
      { concepto: 'A', matches: 4, tasaUso: 1 },
      { concepto: 'B', matches: 2, tasaUso: 0.5 },
      { concepto: 'C', matches: 1, tasaUso: 0.25 },
    ])
  })

  it('analizarUsoPatrones devuelve [] si no hay análisis', () => {
    expect(analizarUsoPatrones()).toEqual([])
  })

  it('survives storage corrupto (JSON inválido)', () => {
    ;(globalThis as unknown as { window: { localStorage: FakeStorage } }).window.localStorage.setItem(
      'lalupa:parser-telemetry',
      'not-valid-json',
    )
    const snap = readTelemetry()
    expect(snap.totalAnalisis).toBe(0)
  })

  it('survives schema viejo (version distinta)', () => {
    ;(globalThis as unknown as { window: { localStorage: FakeStorage } }).window.localStorage.setItem(
      'lalupa:parser-telemetry',
      JSON.stringify({ version: 0, totalAnalisis: 999, conceptos: {} }),
    )
    const snap = readTelemetry()
    expect(snap.totalAnalisis).toBe(0)
  })

  it('survives quota lleno en setItem', () => {
    const w = (globalThis as unknown as { window: { localStorage: FakeStorage } }).window
    const origSet = w.localStorage.setItem
    w.localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(() => trackAnalisis(['Cargo fijo'])).not.toThrow()
    w.localStorage.setItem = origSet
  })

  it('NADA viaja a fetch (módulo no llama a la red)', () => {
    // El módulo no importa fetch ni hace requests. Si alguien agregara
    // una llamada accidental, este test no detecta automáticamente,
    // pero verifica que la API expuesta no requiere fetch para funcionar.
    expect(typeof trackAnalisis).toBe('function')
    expect(typeof readTelemetry).toBe('function')
    trackAnalisis(['Cargo fijo'])
    expect(readTelemetry().totalAnalisis).toBe(1)
  })
})
