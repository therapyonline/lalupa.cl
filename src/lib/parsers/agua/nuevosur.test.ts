import { describe, expect, it } from 'vitest'
import { NUEVOSUR_NORMAL } from '../__fixtures__/nuevosur-normal'
import { ParserError } from '../errors'
import { nuevosurParser, parseNuevosur } from './nuevosur'

describe('nuevosurParser metadata', () => {
  it('declara empresa "Nuevosur" y servicio "agua"', () => {
    expect(nuevosurParser.empresa).toBe('Nuevosur')
    expect(nuevosurParser.servicio).toBe('agua')
  })

  it('expone fingerprint con RUT verificado', () => {
    expect(nuevosurParser.fingerprint.keywords).toContain('96.963.440-6')
  })
})

describe('nuevosurParser.detect', () => {
  it('detecta nuevosur.cl', () => {
    expect(nuevosurParser.detect('Visita nuevosur.cl')).toBe(true)
  })

  it('detecta el RUT', () => {
    expect(nuevosurParser.detect('R.U.T.: 96.963.440-6')).toBe(true)
  })
})

describe('nuevosurParser.parse', () => {
  it('extrae consumo 10 m³ y total $14.720', () => {
    const r = parseNuevosur(NUEVOSUR_NORMAL)
    expect(r.consumo.valor).toBe(10)
    expect(r.totales.total).toBe(14720)
  })

  it('extrae IVA $2.351', () => {
    const r = parseNuevosur(NUEVOSUR_NORMAL)
    expect(r.totales.iva).toBe(2351)
  })

  it('extrae cargos del template SISS', () => {
    const r = parseNuevosur(NUEVOSUR_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Consumo agua potable')
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseNuevosur('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
