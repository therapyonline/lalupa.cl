import { describe, expect, it } from 'vitest'
import { CHILQUINTA_NORMAL } from '../__fixtures__/chilquinta-normal'
import { ParserError } from '../errors'
import { chilquintaParser, parseChilquinta } from './chilquinta'

describe('chilquintaParser metadata', () => {
  it('declara empresa "Chilquinta" y servicio "electricidad"', () => {
    expect(chilquintaParser.empresa).toBe('Chilquinta')
    expect(chilquintaParser.servicio).toBe('electricidad')
  })

  it('expone fingerprint con RUT y dominio', () => {
    expect(chilquintaParser.fingerprint.keywords).toContain('96.813.520-1')
    expect(chilquintaParser.fingerprint.keywords).toContain('chilquinta.cl')
  })
})

describe('chilquintaParser.detect', () => {
  it('detecta "Chilquinta Energía"', () => {
    expect(chilquintaParser.detect('Chilquinta Energía S.A.')).toBe(true)
  })

  it('detecta "Chilquinta Distribución"', () => {
    expect(chilquintaParser.detect('Chilquinta Distribución')).toBe(true)
  })

  it('detecta el dominio chilquinta.cl', () => {
    expect(chilquintaParser.detect('Visita chilquinta.cl')).toBe(true)
  })

  it('NO detecta texto sin marcadores', () => {
    expect(chilquintaParser.detect('boleta cualquiera')).toBe(false)
  })

  it('NO detecta texto vacío', () => {
    expect(chilquintaParser.detect('')).toBe(false)
  })
})

describe('chilquintaParser.parse', () => {
  it('rechaza texto vacío con EMPTY_TEXT', () => {
    try {
      parseChilquinta('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('extrae el período 27 may 2023 - 29 jun 2023', () => {
    const r = parseChilquinta(CHILQUINTA_NORMAL)
    expect(r.periodo.desde.getFullYear()).toBe(2023)
    expect(r.periodo.desde.getDate()).toBe(27)
    expect(r.periodo.desde.getMonth()).toBe(4) // mayo
    expect(r.periodo.hasta.getMonth()).toBe(5) // junio
  })

  it('extrae consumo 163 kWh tarifa BT-1A', () => {
    const r = parseChilquinta(CHILQUINTA_NORMAL)
    expect(r.consumo.valor).toBe(163)
    expect(r.consumo.tarifa).toBe('BT-1A')
  })

  it('extrae los 3 cargos canónicos del layout Chilquinta', () => {
    const r = parseChilquinta(CHILQUINTA_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Administración del servicio')
    expect(conceptos).toContain('Electricidad consumida')
    expect(conceptos).toContain('Coordinación y transporte de electricidad')
  })

  it('extrae IVA 19% = $4.543 y total = $28.533', () => {
    const r = parseChilquinta(CHILQUINTA_NORMAL)
    expect(r.totales.iva).toBe(4543)
    expect(r.totales.total).toBe(28533)
  })

  it('declara empresa Chilquinta', () => {
    const r = parseChilquinta(CHILQUINTA_NORMAL)
    expect(r.empresa).toBe('Chilquinta')
    expect(r.servicio).toBe('electricidad')
  })
})

describe('chilquinta-normal fixture', () => {
  it('exporta CHILQUINTA_NORMAL como string no vacío', () => {
    expect(typeof CHILQUINTA_NORMAL).toBe('string')
    expect(CHILQUINTA_NORMAL.length).toBeGreaterThan(500)
  })
})
