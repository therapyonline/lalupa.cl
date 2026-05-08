import { describe, expect, it } from 'vitest'
import { ESVAL_NORMAL } from '../__fixtures__/esval-normal'
import { ParserError } from '../errors'
import { esvalParser, parseEsval } from './esval'

describe('esvalParser metadata', () => {
  it('declara empresa "Esval" y servicio "agua"', () => {
    expect(esvalParser.empresa).toBe('Esval')
    expect(esvalParser.servicio).toBe('agua')
  })

  it('expone fingerprint con dominio + RUTs (canónico + variantes)', () => {
    expect(esvalParser.fingerprint.keywords).toContain('esval.cl')
    expect(esvalParser.fingerprint.keywords).toContain('76.000.739-0')
  })
})

describe('esvalParser.detect', () => {
  it('detecta esval.cl', () => {
    expect(esvalParser.detect('esval.cl')).toBe(true)
  })

  it('detecta Esval con word-boundary', () => {
    expect(esvalParser.detect('Boleta Esval mensual')).toBe(true)
  })
})

describe('esvalParser.parse', () => {
  it('extrae los 4 cargos del DETALLE DE FACTURACIÓN', () => {
    const r = parseEsval(ESVAL_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Consumo agua')
    expect(conceptos).toContain('Recolección')
    expect(conceptos).toContain('Tratamiento')
  })

  it('extrae el subsidio agua potable cuando aplica', () => {
    const r = parseEsval(ESVAL_NORMAL)
    const subsidio = r.cargos.find((c) => c.concepto === 'Subsidio agua potable')
    expect(subsidio).toBeDefined()
  })

  it('extrae total $11.580 e IVA $1.849', () => {
    const r = parseEsval(ESVAL_NORMAL)
    expect(r.totales.total).toBe(11580)
    expect(r.totales.iva).toBe(1849)
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseEsval('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
