import { describe, expect, it } from 'vitest'
import { AGUASANDINAS_NORMAL } from '../__fixtures__/aguasandinas-normal'
import { ParserError } from '../errors'
import { aguasandinasParser, parseAguasAndinas } from './aguasandinas'

describe('aguasandinasParser metadata', () => {
  it('declara empresa "Aguas Andinas" y servicio "agua"', () => {
    expect(aguasandinasParser.empresa).toBe('Aguas Andinas')
    expect(aguasandinasParser.servicio).toBe('agua')
  })

  it('expone fingerprint con RUT y dominio', () => {
    expect(aguasandinasParser.fingerprint.keywords).toContain('61.808.000-5')
    expect(aguasandinasParser.fingerprint.keywords).toContain('aguasandinas.cl')
  })
})

describe('aguasandinasParser.detect', () => {
  it('detecta razón social completa S.A.', () => {
    expect(aguasandinasParser.detect('AGUAS ANDINAS S.A.')).toBe(true)
  })

  it('detecta el dominio aguasandinas.cl', () => {
    expect(aguasandinasParser.detect('aguasandinas.cl')).toBe(true)
  })

  it('NO detecta menciones genéricas (ej. SMAPA hablando de Aguas Andinas)', () => {
    expect(aguasandinasParser.detect('TRATAM.AGUAS ANDINAS (11 M3)')).toBe(false)
  })

  it('NO detecta texto vacío', () => {
    expect(aguasandinasParser.detect('')).toBe(false)
  })
})

describe('aguasandinasParser.parse', () => {
  it('extrae consumo 12 m³ del fixture real', () => {
    const r = parseAguasAndinas(AGUASANDINAS_NORMAL)
    expect(r.consumo.unidad).toBe('m3')
    expect(r.consumo.valor).toBe(12)
  })

  it('extrae los 3+ cargos canónicos', () => {
    const r = parseAguasAndinas(AGUASANDINAS_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Consumo agua potable')
    expect(conceptos).toContain('Servicio de alcantarillado')
  })

  it('extrae total a pagar = $17.144', () => {
    const r = parseAguasAndinas(AGUASANDINAS_NORMAL)
    expect(r.totales.total).toBe(17144)
  })

  it('extrae IVA $2.737', () => {
    const r = parseAguasAndinas(AGUASANDINAS_NORMAL)
    expect(r.totales.iva).toBe(2737)
  })

  it('rechaza texto vacío con EMPTY_TEXT', () => {
    try {
      parseAguasAndinas('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('rechaza boletas SMAPA con WRONG_EMPRESA', () => {
    const smapa = `SMAPA, Servicio Municipal de Agua Potable\nsmapa.cl\nBoleta: 12060510`
    try {
      parseAguasAndinas(smapa)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })

  it('declara empresa Aguas Andinas en el resultado', () => {
    const r = parseAguasAndinas(AGUASANDINAS_NORMAL)
    expect(r.empresa).toBe('Aguas Andinas')
    expect(r.servicio).toBe('agua')
  })
})
