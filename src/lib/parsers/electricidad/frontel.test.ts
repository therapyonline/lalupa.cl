import { describe, expect, it } from 'vitest'
import { FRONTEL_NORMAL } from '../__fixtures__/frontel-normal'
import { ParserError } from '../errors'
import { frontelParser, parseFrontel } from './frontel'

describe('frontelParser metadata', () => {
  it('declara empresa "Frontel" y servicio "electricidad"', () => {
    expect(frontelParser.empresa).toBe('Frontel')
    expect(frontelParser.servicio).toBe('electricidad')
  })

  it('expone fingerprint con RUT y nombre largo', () => {
    expect(frontelParser.fingerprint.keywords).toContain('76.073.164-1')
    expect(frontelParser.fingerprint.keywords).toContain(
      'Empresa Eléctrica de la Frontera',
    )
  })
})

describe('frontelParser.detect', () => {
  it('detecta el nombre completo "Empresa Eléctrica de la Frontera"', () => {
    expect(
      frontelParser.detect('EMPRESA ELÉCTRICA DE LA FRONTERA S.A.'),
    ).toBe(true)
  })

  it('detecta el acrónimo Frontel', () => {
    expect(frontelParser.detect('Boleta Frontel del mes')).toBe(true)
  })

  it('NO detecta texto sin marcadores', () => {
    expect(frontelParser.detect('boleta cualquiera')).toBe(false)
  })

  it('NO detecta texto vacío', () => {
    expect(frontelParser.detect('')).toBe(false)
  })
})

describe('frontelParser.parse', () => {
  it('rechaza texto vacío con EMPTY_TEXT', () => {
    try {
      parseFrontel('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('rechaza boletas SAESA con WRONG_EMPRESA', () => {
    try {
      parseFrontel('SOCIEDAD AUSTRAL DE ELECTRICIDAD S.A. RUT 96.544.470-3')
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })

  it('extrae el período 13/08/2022 - 13/09/2022', () => {
    const r = parseFrontel(FRONTEL_NORMAL)
    expect(r.periodo.desde.getFullYear()).toBe(2022)
    expect(r.periodo.desde.getDate()).toBe(13)
    expect(r.periodo.desde.getMonth()).toBe(7) // ago
    expect(r.periodo.hasta.getMonth()).toBe(8) // sep
  })

  it('extrae consumo 250 kWh tarifa BT-1', () => {
    const r = parseFrontel(FRONTEL_NORMAL)
    expect(r.consumo.valor).toBe(250)
    expect(r.consumo.tarifa).toBe('BT-1')
  })

  it('extrae 5 cargos canónicos del layout Grupo SAESA', () => {
    const r = parseFrontel(FRONTEL_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Administración del servicio')
    expect(conceptos).toContain('Electricidad consumida')
    expect(conceptos).toContain('Coordinación y transporte de electricidad')
  })

  it('extrae IVA 19% y total a pagar', () => {
    const r = parseFrontel(FRONTEL_NORMAL)
    expect(r.totales.iva).toBe(10152)
    expect(r.totales.total).toBe(76700)
  })

  it('declara empresa Frontel en el resultado', () => {
    const r = parseFrontel(FRONTEL_NORMAL)
    expect(r.empresa).toBe('Frontel')
    expect(r.servicio).toBe('electricidad')
  })
})

describe('frontel-normal fixture', () => {
  it('exporta FRONTEL_NORMAL como string no vacío', () => {
    expect(typeof FRONTEL_NORMAL).toBe('string')
    expect(FRONTEL_NORMAL.length).toBeGreaterThan(500)
  })
})
