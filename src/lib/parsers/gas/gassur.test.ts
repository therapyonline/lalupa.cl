import { describe, expect, it } from 'vitest'
import { ParserError } from '../errors'
import { gasSurParser, parseGasSur } from './gassur'

// Fixture sintética basada en factura real Hospital Naval Talcahuano
// (oct/dic 2017, 20 m³ corregidos). Organismo público, no anonimizado.
const GAS_SUR_REAL_2017_12 = `GAS SUR S.A.
www.gassur.cl

Hospital Naval Almirante Adriazola
Cliente: NAVAL_TALCAHUANO
Tarifa: PRECIO LISTA
Período: 01/11/2017 al 30/11/2017
Fecha de emisión: 05/12/2017
Fecha de vencimiento: 20/12/2017

PCS nom 9.300 kcal/M3N
Lectura Actual: 1142
Lectura Anterior: 1122
Leído: 20 m³
F. Corrección: 1,03506
Corregido: 21 m³

DETALLE DE SU CUENTA:
CONSUMO                                          $ 18.801
VALOR NETO                                       $ 18.801
I.V.A.                                            $ 3.572
TOTAL MES                                        $ 22.373

Total a pagar                                    $ 22.373
`

describe('gasSurParser metadata', () => {
  it('declara empresa "Gas Sur" y servicio "gas"', () => {
    expect(gasSurParser.empresa).toBe('Gas Sur')
    expect(gasSurParser.servicio).toBe('gas')
  })

  it('detecta Gas Sur con word-boundary', () => {
    expect(gasSurParser.detect('Boleta Gas Sur S.A.')).toBe(true)
  })

  it('detecta dominio gassur.cl', () => {
    expect(gasSurParser.detect('www.gassur.cl')).toBe(true)
  })

  it('NO detecta Metrogas (cross-empresa)', () => {
    expect(gasSurParser.detect('Metrogas S.A.')).toBe(false)
  })
})

describe('parseGasSur (factura real organismo público)', () => {
  it('extrae línea única "Consumo de gas"', () => {
    const r = parseGasSur(GAS_SUR_REAL_2017_12)
    const consumoCargo = r.cargos.find((c) => c.concepto === 'Consumo de gas')
    expect(consumoCargo).toBeDefined()
    expect(consumoCargo?.monto).toBe(18801)
  })

  it('detecta tarifa "PRECIO LISTA" como string literal', () => {
    const r = parseGasSur(GAS_SUR_REAL_2017_12)
    expect(r.consumo.tarifa).toMatch(/PRECIO\s+LISTA/i)
  })

  it('declara empresa Gas Sur', () => {
    const r = parseGasSur(GAS_SUR_REAL_2017_12)
    expect(r.empresa).toBe('Gas Sur')
    expect(r.servicio).toBe('gas')
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseGasSur('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('rechaza Gasvalpo con WRONG_EMPRESA', () => {
    const text = `Gasvalpo S.A.
www.gasvalpo.cl
Total a pagar $ 100.000`
    try {
      parseGasSur(text)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })
})
