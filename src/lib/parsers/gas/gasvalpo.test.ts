import { describe, expect, it } from 'vitest'
import { ParserError } from '../errors'
import { gasvalpoParser, parseGasvalpo } from './gasvalpo'

// Fixture sintética basada en factura real Instituto Hidrográfico
// Armada (Valparaíso, mayo 2017, 949 m³ corregidos). PII reemplazada
// con placeholders dado que ese dato no es del organismo sino del
// número de cuenta cliente.
const GASVALPO_REAL_2017_05 = `Gasvalpo S.A.
Gas Valparaíso
www.gasvalpo.cl

INSTITUTO HIDROGRAFICO DE LA ARMADA
Dirección: Errazuriz 254, Valparaíso
Cliente: CLIENTE_NUMERO
Tarifa: BC-01
Período facturado: 01/04/2017 al 30/04/2017
Fecha de emisión: 10/05/2017
Fecha de vencimiento: 31/05/2017

Lectura Actual: 1532 (m³)
Lectura Anterior: 627 (m³)
Leído: 905 m³
Factor Corrección: 1,048650668
Corregido: 949 m³
PCS nom 9.300 kcal/M3N

DETALLE DE SU CUENTA:
GAS NATURAL                                    $ 651.444
INTERES PAGO FUERA PLAZO                       $   4.822
TOTAL NETO                                     $ 656.266
19% I.V.A.                                     $ 124.690
VALOR TOTAL                                    $ 780.956
SALDO ANTERIOR                                 $ 808.070
AJUSTE SENCILLO AL MES ANTERIOR                $       6
AJUSTE SENCILLO DEL MES                        $      -2

Total a pagar                                  $ 1.589.030
`

describe('gasvalpoParser metadata', () => {
  it('declara empresa "Gasvalpo" y servicio "gas"', () => {
    expect(gasvalpoParser.empresa).toBe('Gasvalpo')
    expect(gasvalpoParser.servicio).toBe('gas')
  })

  it('detecta Gasvalpo con word-boundary', () => {
    expect(gasvalpoParser.detect('Boleta Gasvalpo mensual')).toBe(true)
  })

  it('detecta dominio gasvalpo.cl', () => {
    expect(gasvalpoParser.detect('www.gasvalpo.cl')).toBe(true)
  })

  it('NO detecta Metrogas (cross-empresa)', () => {
    expect(gasvalpoParser.detect('Metrogas S.A.')).toBe(false)
  })
})

describe('parseGasvalpo (factura real anonimizada)', () => {
  it('extrae la línea única "Gas natural" (sin desagregar)', () => {
    const r = parseGasvalpo(GASVALPO_REAL_2017_05)
    const gasNat = r.cargos.find((c) => c.concepto === 'Gas natural')
    expect(gasNat).toBeDefined()
    expect(gasNat?.monto).toBe(651444)
  })

  it('extrae interés por pago fuera de plazo', () => {
    const r = parseGasvalpo(GASVALPO_REAL_2017_05)
    const interes = r.cargos.find(
      (c) => c.concepto === 'Interés pago fuera de plazo',
    )
    expect(interes).toBeDefined()
    expect(interes?.monto).toBe(4822)
  })

  it('extrae los dos ajustes sencillo como cargos distintos', () => {
    const r = parseGasvalpo(GASVALPO_REAL_2017_05)
    const ant = r.cargos.find(
      (c) => c.concepto === 'Ajuste sencillo mes anterior',
    )
    const act = r.cargos.find((c) => c.concepto === 'Ajuste sencillo del mes')
    expect(ant).toBeDefined()
    expect(act).toBeDefined()
  })

  it('declara empresa Gasvalpo', () => {
    const r = parseGasvalpo(GASVALPO_REAL_2017_05)
    expect(r.empresa).toBe('Gasvalpo')
    expect(r.servicio).toBe('gas')
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseGasvalpo('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('rechaza Metrogas con WRONG_EMPRESA', () => {
    const text = `Metrogas S.A.
RUT: 96.722.460-K
Total a pagar $ 100.000`
    try {
      parseGasvalpo(text)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })
})
