import { describe, expect, it } from 'vitest'
import { SMAPA_NORMAL } from '../__fixtures__/smapa-normal'
import { ParserError } from '../errors'
import { parseSmapa, smapaParser } from './smapa'

describe('smapaParser metadata', () => {
  it('declara empresa "SMAPA" y servicio "agua"', () => {
    expect(smapaParser.empresa).toBe('SMAPA')
    expect(smapaParser.servicio).toBe('agua')
  })

  it('expone fingerprint con SMAPA + dirección + Maipú', () => {
    expect(smapaParser.fingerprint.keywords).toContain('SMAPA')
    expect(smapaParser.fingerprint.keywords).toContain('Av. Pajaritos 0240')
  })
})

describe('smapaParser.detect', () => {
  it('detecta SMAPA', () => {
    expect(smapaParser.detect('Boleta SMAPA del mes')).toBe(true)
  })

  it('detecta el dominio smapa.cl', () => {
    expect(smapaParser.detect('smapa.cl')).toBe(true)
  })
})

describe('smapaParser.parse', () => {
  it('extrae los 4 cargos del DETALLE DE SU CUENTA', () => {
    const r = parseSmapa(SMAPA_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Consumo agua')
    expect(conceptos).toContain('Alcantarillado')
    expect(conceptos).toContain('Tratamiento Aguas Andinas')
  })

  it('extrae total $12.250 e IVA $1.950', () => {
    const r = parseSmapa(SMAPA_NORMAL)
    expect(r.totales.total).toBe(12250)
    expect(r.totales.iva).toBe(1950)
  })

  it('extrae consumo 11 m³', () => {
    const r = parseSmapa(SMAPA_NORMAL)
    expect(r.consumo.valor).toBe(11)
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseSmapa('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
