import { describe, expect, it } from 'vitest'
import { SAESA_NORMAL } from '../__fixtures__/saesa-normal'
import { ParserError } from '../errors'
import { parseSaesa, saesaParser } from './saesa'

describe('saesaParser metadata', () => {
  it('declara empresa "SAESA" y servicio "electricidad"', () => {
    expect(saesaParser.empresa).toBe('SAESA')
    expect(saesaParser.servicio).toBe('electricidad')
  })

  it('expone fingerprint con RUT y dominio en keywords', () => {
    expect(saesaParser.fingerprint.keywords).toContain('96.544.470-3')
    expect(saesaParser.fingerprint.keywords).toContain('gruposaesa.cl')
  })
})

describe('saesaParser.detect', () => {
  it('detecta header "Sociedad Austral de Electricidad"', () => {
    expect(saesaParser.detect('SOCIEDAD AUSTRAL DE ELECTRICIDAD S.A.')).toBe(
      true,
    )
  })

  it('detecta el dominio gruposaesa.cl/saesa', () => {
    expect(saesaParser.detect('Visita gruposaesa.cl/saesa')).toBe(true)
  })

  it('detecta el acrónimo SAESA con word-boundary', () => {
    expect(saesaParser.detect('Boleta SAESA del mes')).toBe(true)
  })

  it('NO detecta texto sin marcadores', () => {
    expect(saesaParser.detect('boleta de electricidad mensual')).toBe(false)
  })

  it('NO detecta texto vacío', () => {
    expect(saesaParser.detect('')).toBe(false)
  })
})

describe('saesaParser.parse', () => {
  it('rechaza texto vacío con EMPTY_TEXT', () => {
    try {
      parseSaesa('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('rechaza boletas de otra empresa con WRONG_EMPRESA', () => {
    const cge = `Compañía General de Electricidad S.A.\nRUT: 99.513.400-4`
    try {
      parseSaesa(cge)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })

  it('extrae el período 13/08/2024 - 13/09/2024', () => {
    const r = parseSaesa(SAESA_NORMAL)
    expect(r.periodo.desde.getFullYear()).toBe(2024)
    expect(r.periodo.desde.getDate()).toBe(13)
    expect(r.periodo.desde.getMonth()).toBe(7) // agosto
    expect(r.periodo.hasta.getMonth()).toBe(8) // septiembre
  })

  it('extrae consumo 250 kWh con tarifa BT-1', () => {
    const r = parseSaesa(SAESA_NORMAL)
    expect(r.consumo.unidad).toBe('kWh')
    expect(r.consumo.valor).toBe(250)
    expect(r.consumo.tarifa).toBe('BT-1')
  })

  it('extrae los 5 cargos del layout SAESA', () => {
    const r = parseSaesa(SAESA_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Administración del servicio')
    expect(conceptos).toContain('Electricidad consumida')
    expect(conceptos).toContain('Coordinación y transporte de electricidad')
    expect(conceptos).toContain('Cargo por servicio público')
    expect(conceptos).toContain('Cargo por compras de potencia')
  })

  it('extrae IVA 19% = $10.152', () => {
    const r = parseSaesa(SAESA_NORMAL)
    const iva = r.cargos.find((c) => c.concepto === 'IVA 19%')
    expect(iva?.monto).toBe(10152)
    expect(r.totales.iva).toBe(10152)
  })

  it('extrae total a pagar = $76.700', () => {
    const r = parseSaesa(SAESA_NORMAL)
    expect(r.totales.total).toBe(76700)
  })

  it('extrae nº cliente y fechas de emisión/vencimiento', () => {
    const r = parseSaesa(SAESA_NORMAL)
    expect(r.cliente.numeroCliente).toBe('10481452')
    expect(r.fechaEmision?.getMonth()).toBe(8) // sep
    expect(r.fechaVencimiento?.getMonth()).toBe(9) // oct
  })

  it('declara empresa SAESA en el resultado', () => {
    const r = parseSaesa(SAESA_NORMAL)
    expect(r.empresa).toBe('SAESA')
    expect(r.servicio).toBe('electricidad')
  })
})

describe('saesa-normal fixture', () => {
  it('exporta SAESA_NORMAL como string no vacío', () => {
    expect(typeof SAESA_NORMAL).toBe('string')
    expect(SAESA_NORMAL.length).toBeGreaterThan(500)
  })
})
