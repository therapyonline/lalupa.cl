import { describe, expect, it } from 'vitest'
import { ABASTIBLE_NORMAL } from '../__fixtures__/abastible-normal'
import { ParserError } from '../errors'
import { abastibleParser, parseAbastible } from './abastible'

describe('abastibleParser metadata', () => {
  it('declara empresa "Abastible" y servicio "gas"', () => {
    expect(abastibleParser.empresa).toBe('Abastible')
    expect(abastibleParser.servicio).toBe('gas')
  })

  it('expone fingerprint con RUT', () => {
    expect(abastibleParser.fingerprint.keywords).toContain('91.806.000-6')
  })
})

describe('abastibleParser.detect', () => {
  it('detecta Abastible con word-boundary', () => {
    expect(abastibleParser.detect('Boleta Abastible mensual')).toBe(true)
  })

  it('detecta el dominio abastible.cl', () => {
    expect(abastibleParser.detect('abastible.cl')).toBe(true)
  })
})

describe('abastibleParser.parse', () => {
  it('extrae total $28.350', () => {
    const r = parseAbastible(ABASTIBLE_NORMAL)
    expect(r.totales.total).toBe(28350)
  })

  it('extrae cargos del Servicio de gas', () => {
    const r = parseAbastible(ABASTIBLE_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Gas consumido')
    expect(conceptos).toContain('Administración del servicio')
    expect(conceptos).toContain('Descuento por consumo')
  })

  it('extrae consumo 6 m3', () => {
    const r = parseAbastible(ABASTIBLE_NORMAL)
    expect(r.consumo.valor).toBe(6)
  })

  it('extrae tarifa CR1B', () => {
    const r = parseAbastible(ABASTIBLE_NORMAL)
    expect(r.consumo.tarifa).toBe('CR1B')
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseAbastible('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
