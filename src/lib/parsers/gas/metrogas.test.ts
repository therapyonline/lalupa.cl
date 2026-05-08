import { describe, expect, it } from 'vitest'
import { METROGAS_NORMAL } from '../__fixtures__/metrogas-normal'
import { ParserError } from '../errors'
import { metrogasParser, parseMetrogas } from './metrogas'

describe('metrogasParser metadata', () => {
  it('declara empresa "Metrogas" y servicio "gas"', () => {
    expect(metrogasParser.empresa).toBe('Metrogas')
    expect(metrogasParser.servicio).toBe('gas')
  })

  it('expone fingerprint con RUT y dominio', () => {
    expect(metrogasParser.fingerprint.keywords).toContain('96.722.460-K')
    expect(metrogasParser.fingerprint.keywords).toContain('metrogas.cl')
  })
})

describe('metrogasParser.detect', () => {
  it('detecta Metrogas con word-boundary', () => {
    expect(metrogasParser.detect('Boleta Metrogas mensual')).toBe(true)
  })

  it('detecta el dominio metrogas.cl', () => {
    expect(metrogasParser.detect('metrogas.cl')).toBe(true)
  })
})

describe('metrogasParser.parse', () => {
  it('extrae total $114.212', () => {
    const r = parseMetrogas(METROGAS_NORMAL)
    expect(r.totales.total).toBe(114212)
  })

  it('extrae IVA $18.235 desde la nota inline', () => {
    const r = parseMetrogas(METROGAS_NORMAL)
    expect(r.totales.iva).toBe(18235)
  })

  it('extrae los cargos del Servicio de Gas', () => {
    const r = parseMetrogas(METROGAS_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Gas consumido')
    expect(conceptos).toContain('Crédito consumo equivalente reliquidado')
    expect(conceptos).toContain('Administración del servicio')
  })

  it('extrae tarifa BCR01R', () => {
    const r = parseMetrogas(METROGAS_NORMAL)
    expect(r.consumo.tarifa).toBe('BCR01R')
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseMetrogas('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('declara empresa Metrogas', () => {
    const r = parseMetrogas(METROGAS_NORMAL)
    expect(r.empresa).toBe('Metrogas')
    expect(r.servicio).toBe('gas')
  })
})
