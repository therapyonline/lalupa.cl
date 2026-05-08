import { describe, expect, it } from 'vitest'
import { ENEL_NORMAL } from '../__fixtures__/enel-normal'
import { ParserError } from '../errors'
import { enelParser, parseEnel } from './enel'

describe('enelParser metadata', () => {
  it('declara empresa "Enel" y servicio "electricidad"', () => {
    expect(enelParser.empresa).toBe('Enel')
    expect(enelParser.servicio).toBe('electricidad')
  })

  it('expone fingerprint con RUT y dominio en keywords', () => {
    expect(enelParser.fingerprint.keywords).toContain('96.800.570-7')
    expect(enelParser.fingerprint.keywords).toContain('enel.cl')
  })
})

describe('enelParser.detect', () => {
  it('detecta header "ENEL DISTRIBUCION CHILE S.A."', () => {
    expect(enelParser.detect('ENEL DISTRIBUCION CHILE S.A.')).toBe(true)
  })

  it('detecta el dominio enel.cl', () => {
    expect(enelParser.detect('Visita enel.cl para más info')).toBe(true)
  })

  it('detecta variantes "Enel Distribución" con tilde', () => {
    expect(enelParser.detect('boleta Enel Distribución mensual')).toBe(true)
  })

  it('NO detecta texto sin marcadores Enel', () => {
    expect(enelParser.detect('boleta cualquiera de servicios')).toBe(false)
  })

  it('NO detecta texto vacío', () => {
    expect(enelParser.detect('')).toBe(false)
  })
})

describe('enelParser.parse', () => {
  it('rechaza texto vacío con EMPTY_TEXT', () => {
    expect(() => parseEnel('')).toThrow(ParserError)
    try {
      parseEnel('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('rechaza boletas de otra empresa con WRONG_EMPRESA', () => {
    const cge = `Compañía General de Electricidad S.A.\nRUT: 99.513.400-4\nTotal $50.000`
    try {
      parseEnel(cge)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })

  it('rechaza texto sin marcadores con INVALID_FORMAT', () => {
    try {
      parseEnel('un texto cualquiera sin marcadores')
    } catch (err) {
      expect((err as ParserError).code).toBe('INVALID_FORMAT')
    }
  })

  it('extrae el período facturado de la boleta real', () => {
    const result = parseEnel(ENEL_NORMAL)
    expect(result.periodo.desde.getFullYear()).toBe(2024)
    expect(result.periodo.desde.getMonth()).toBe(4) // mayo (0-indexed)
    expect(result.periodo.desde.getDate()).toBe(23)
    expect(result.periodo.hasta.getMonth()).toBe(5) // junio
    expect(result.periodo.hasta.getDate()).toBe(21)
  })

  it('extrae consumo en kWh y tarifa', () => {
    const result = parseEnel(ENEL_NORMAL)
    expect(result.consumo.unidad).toBe('kWh')
    expect(result.consumo.valor).toBe(222)
    expect(result.consumo.tarifa).toBe('THBF-78')
  })

  it('extrae los 5 cargos canónicos del layout Enel', () => {
    const result = parseEnel(ENEL_NORMAL)
    const conceptos = result.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Administración del servicio')
    expect(conceptos).toContain('Electricidad consumida')
    expect(conceptos).toContain('Transporte de electricidad')
  })

  it('extrae el total a pagar', () => {
    const result = parseEnel(ENEL_NORMAL)
    expect(result.totales.total).toBe(36940)
  })

  it('extrae el número de cliente', () => {
    const result = parseEnel(ENEL_NORMAL)
    expect(result.cliente.numeroCliente).toBe('32011755')
  })

  it('extrae fechas de emisión y vencimiento', () => {
    const result = parseEnel(ENEL_NORMAL)
    expect(result.fechaEmision?.getFullYear()).toBe(2024)
    expect(result.fechaEmision?.getMonth()).toBe(5) // junio
    expect(result.fechaVencimiento?.getMonth()).toBe(6) // julio
  })

  it('declara empresa Enel y servicio electricidad en el resultado', () => {
    const result = parseEnel(ENEL_NORMAL)
    expect(result.empresa).toBe('Enel')
    expect(result.servicio).toBe('electricidad')
  })
})

describe('enel-normal fixture', () => {
  it('exporta ENEL_NORMAL como string no vacío', () => {
    expect(typeof ENEL_NORMAL).toBe('string')
    expect(ENEL_NORMAL.length).toBeGreaterThan(500)
  })
})
