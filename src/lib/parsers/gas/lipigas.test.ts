import { describe, expect, it } from 'vitest'
import { LIPIGAS_NORMAL } from '../__fixtures__/lipigas-normal'
import { ParserError } from '../errors'
import { lipigasParser, parseLipigas } from './lipigas'

describe('lipigasParser metadata', () => {
  it('declara empresa "Lipigas" y servicio "gas"', () => {
    expect(lipigasParser.empresa).toBe('Lipigas')
    expect(lipigasParser.servicio).toBe('gas')
  })

  it('expone fingerprint con RUT y dominio', () => {
    expect(lipigasParser.fingerprint.keywords).toContain('96.928.510-K')
    expect(lipigasParser.fingerprint.keywords).toContain('lipigas.cl')
  })
})

describe('lipigasParser.detect', () => {
  it('detecta Lipigas con word-boundary', () => {
    expect(lipigasParser.detect('Boleta Lipigas mensual')).toBe(true)
  })

  it('detecta el dominio lipigas.cl', () => {
    expect(lipigasParser.detect('lipigas.cl')).toBe(true)
  })
})

describe('lipigasParser.parse', () => {
  it('extrae total $257.200', () => {
    const r = parseLipigas(LIPIGAS_NORMAL)
    expect(r.totales.total).toBe(257200)
  })

  it('extrae IVA $10.450 (línea explícita)', () => {
    const r = parseLipigas(LIPIGAS_NORMAL)
    expect(r.totales.iva).toBe(10450)
  })

  it('extrae cargos del Servicio de Gas', () => {
    const r = parseLipigas(LIPIGAS_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Gas consumido')
    expect(conceptos).toContain('Administración del servicio')
    expect(conceptos).toContain('Arriendo medidor')
  })

  it('extrae consumo 50 m³', () => {
    const r = parseLipigas(LIPIGAS_NORMAL)
    expect(r.consumo.valor).toBe(50)
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseLipigas('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
