import { describe, expect, it } from 'vitest'
import { ESSBIO_NORMAL } from '../__fixtures__/essbio-normal'
import { ParserError } from '../errors'
import { essbioParser, parseEssbio } from './essbio'

describe('essbioParser metadata', () => {
  it('declara empresa "ESSBio" y servicio "agua"', () => {
    expect(essbioParser.empresa).toBe('ESSBio')
    expect(essbioParser.servicio).toBe('agua')
  })

  it('expone fingerprint con RUT y dominio', () => {
    expect(essbioParser.fingerprint.keywords).toContain('76.833.300-9')
    expect(essbioParser.fingerprint.keywords).toContain('essbio.cl')
  })
})

describe('essbioParser.detect', () => {
  it('detecta el dominio essbio.cl', () => {
    expect(essbioParser.detect('Visita essbio.cl')).toBe(true)
  })

  it('detecta ESSBio con word-boundary', () => {
    expect(essbioParser.detect('Boleta ESSBio S.A.')).toBe(true)
  })

  it('NO detecta texto vacío', () => {
    expect(essbioParser.detect('')).toBe(false)
  })
})

describe('essbioParser.parse', () => {
  it('extrae consumo 10 m³', () => {
    const r = parseEssbio(ESSBIO_NORMAL)
    expect(r.consumo.valor).toBe(10)
  })

  it('extrae los 4 cargos canónicos del template SISS', () => {
    const r = parseEssbio(ESSBIO_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Consumo agua potable')
    expect(conceptos).toContain('Servicio de alcantarillado')
    expect(conceptos).toContain('Tratamiento de aguas servidas')
  })

  it('extrae total = $14.720 e IVA = $2.351', () => {
    const r = parseEssbio(ESSBIO_NORMAL)
    expect(r.totales.total).toBe(14720)
    expect(r.totales.iva).toBe(2351)
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseEssbio('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
