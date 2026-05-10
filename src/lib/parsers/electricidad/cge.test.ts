/**
 * FIXTURES NEEDED: necesitamos 3-5 PDFs reales de CGE de los últimos
 * 12 meses para fingerprinting completo. Por ahora usamos strings
 * sintéticos basados en formato observado.
 *
 * Cuando lleguen las boletas reales, reemplazar `BOLETA_NORMAL` por el
 * texto extraído con `extractTextFromPDF` y validar que cada caso
 * (1-6) sigue pasando con la variabilidad real.
 */

import { describe, expect, it } from 'vitest'
import { CGE_SYNTHETIC_NORMAL } from '../__fixtures__/cge-synthetic'
import { ParserError } from '../errors'
import { parseCGE } from './cge'

const BOLETA_NORMAL = CGE_SYNTHETIC_NORMAL

const BOLETA_CON_REPOSICION = `${BOLETA_NORMAL}
Reposición de servicio ....... $ 5.000
`

const BOLETA_CON_CORTE_PREVIO = `${BOLETA_NORMAL}
Nota: corte de suministro registrado el 10/05/2026 por no pago.
Reposición de servicio ....... $ 5.000
`

const BOLETA_CON_TRAMO_DISTINTO = BOLETA_NORMAL.replace(
  'Tarifa: BT1',
  'Tarifa: BT-2',
)

const BOLETA_CON_SUBIDA = `${BOLETA_NORMAL}
Consumo mes anterior: 150 kWh
`

const BOLETA_CON_SUBIDA_EXPLICADA = `${BOLETA_CON_SUBIDA}
Aviso: el invierno aumenta el consumo por uso de estufas y calefacción.
`

const BOLETA_ENEL = `
ENEL DISTRIBUCION CHILE S.A.
RUT: 96.800.570-7
Roger de Flor 2725, Las Condes
www.enel.cl

N° Cliente: 87654321-0
Tarifa: BT1
Período: 01/04/2026 al 30/04/2026
Total a pagar $ 87.450
`

// Tests para parseChileanNumber y parseChileanDate viven en
// _helpers.test.ts; CGE ahora usa esas funciones compartidas.

describe('Caso 1: boleta CGE estándar de período normal', () => {
  it('marca empresa CGE y servicio electricidad', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.empresa).toBe('CGE')
    expect(r.servicio).toBe('electricidad')
  })

  it('extrae el período facturado', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.periodo.desde.getFullYear()).toBe(2026)
    expect(r.periodo.desde.getMonth()).toBe(3)
    expect(r.periodo.desde.getDate()).toBe(15)
    expect(r.periodo.hasta.getMonth()).toBe(4)
  })

  it('extrae fechas de emisión y vencimiento', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.fechaEmision?.getDate()).toBe(16)
    expect(r.fechaVencimiento?.getDate()).toBe(30)
  })

  it('extrae consumo, unidad kWh y tarifa', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.consumo.unidad).toBe('kWh')
    expect(r.consumo.valor).toBe(280)
    expect(r.consumo.tarifa).toBe('BT1')
  })

  it('extrae el número de cliente', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.cliente.numeroCliente).toBe('12345678-9')
  })

  it('extrae todos los cargos canónicos de una BT-1', () => {
    const r = parseCGE(BOLETA_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Cargo por energía')
    expect(conceptos).toContain('Cargo por uso del sistema de transmisión')
    expect(conceptos).toContain('Cargo por servicio público')
    expect(conceptos).toContain('Cargo por compras de potencia')
    expect(conceptos).toContain('Cargo por potencia base')
    expect(conceptos).toContain('IVA 19%')
  })

  it('extrae los totales (subtotal, IVA y total)', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.totales.total).toBe(111543)
    expect(r.totales.iva).toBe(17809)
    expect(r.totales.subtotal).toBe(111543 - 17809)
  })

  it('preserva el texto original en el campo raw', () => {
    const r = parseCGE(BOLETA_NORMAL)
    expect(r.raw).toBe(BOLETA_NORMAL)
  })

  it('NO marca ningún cargo como sospechoso en una boleta normal', () => {
    const r = parseCGE(BOLETA_NORMAL)
    const sospechosos = r.cargos.filter((c) => c.sospechoso)
    expect(sospechosos).toHaveLength(0)
  })
})

describe('Caso 2: boleta con cargo de reposición', () => {
  it('marca la línea de Reposición como sospechosa cuando NO hay corte previo', () => {
    const r = parseCGE(BOLETA_CON_REPOSICION)
    const reposicion = r.cargos.find((c) => c.concepto === 'Reposición')
    expect(reposicion).toBeDefined()
    expect(reposicion?.sospechoso).toBe(true)
    expect(reposicion?.razonSospecha).toMatch(/corte/i)
  })

  it('NO la marca cuando la boleta menciona explícitamente un corte previo', () => {
    const r = parseCGE(BOLETA_CON_CORTE_PREVIO)
    const reposicion = r.cargos.find((c) => c.concepto === 'Reposición')
    expect(reposicion?.sospechoso).toBeUndefined()
  })

  it('extrae el monto del cargo de reposición correctamente', () => {
    const r = parseCGE(BOLETA_CON_REPOSICION)
    const reposicion = r.cargos.find((c) => c.concepto === 'Reposición')
    expect(reposicion?.monto).toBe(5000)
  })
})

describe('Caso 3: boleta con tramo cambiado', () => {
  it('detecta el tramo BT-2 y lo reporta en consumo.tarifa', () => {
    const r = parseCGE(BOLETA_CON_TRAMO_DISTINTO)
    expect(r.consumo.tarifa).toBe('BT-2')
  })

  it('detecta correctamente cuando la boleta cambia entre BT1 y BT-2', () => {
    const bt1 = parseCGE(BOLETA_NORMAL)
    const bt2 = parseCGE(BOLETA_CON_TRAMO_DISTINTO)
    expect(bt1.consumo.tarifa).not.toBe(bt2.consumo.tarifa)
  })

  it('marca como sospechoso un Cargo único (no estándar de la tarifa)', () => {
    const conCargoUnico = `${BOLETA_NORMAL}\nCargo único administrativo ... $ 12.500\n`
    const r = parseCGE(conCargoUnico)
    const cu = r.cargos.find((c) => c.concepto === 'Cargo único')
    expect(cu?.sospechoso).toBe(true)
    expect(cu?.razonSospecha).toMatch(/no es un componente estándar/i)
  })
})

describe('Caso 4: boleta con subida de consumo >40%', () => {
  it('marca el Cargo por energía como sospechoso cuando consumo subió más de 40%', () => {
    const r = parseCGE(BOLETA_CON_SUBIDA)
    const energia = r.cargos.find((c) => c.concepto === 'Cargo por energía')
    expect(energia?.sospechoso).toBe(true)
    expect(energia?.razonSospecha).toMatch(/\d+%/)
  })

  it('reporta un porcentaje de incremento razonable en la razón', () => {
    const r = parseCGE(BOLETA_CON_SUBIDA)
    const energia = r.cargos.find((c) => c.concepto === 'Cargo por energía')
    // 280 vs 150 ≈ +87%
    const match = energia?.razonSospecha?.match(/(\d+)%/)
    const pct = match ? parseInt(match[1], 10) : 0
    expect(pct).toBeGreaterThan(40)
  })

  it('NO marca el cargo si la boleta menciona invierno o calefacción', () => {
    const r = parseCGE(BOLETA_CON_SUBIDA_EXPLICADA)
    const energia = r.cargos.find((c) => c.concepto === 'Cargo por energía')
    expect(energia?.sospechoso).toBeUndefined()
  })

  it('NO marca incremento si está dentro del 40%', () => {
    const dentroRango = BOLETA_NORMAL + '\nConsumo mes anterior: 250 kWh\n'
    // 280 vs 250 = +12%
    const r = parseCGE(dentroRango)
    const energia = r.cargos.find((c) => c.concepto === 'Cargo por energía')
    expect(energia?.sospechoso).toBeUndefined()
  })
})

describe('Caso 5: PDF roto / texto vacío', () => {
  it('lanza ParserError EMPTY_TEXT cuando recibe string vacío', () => {
    expect(() => parseCGE('')).toThrow(ParserError)
    try {
      parseCGE('')
    } catch (err) {
      expect(err).toBeInstanceOf(ParserError)
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })

  it('lanza ParserError EMPTY_TEXT cuando recibe solo whitespace', () => {
    expect(() => parseCGE('   \n  \t  ')).toThrow(ParserError)
  })

  it('lanza ParserError INVALID_FORMAT cuando el texto no parece de ninguna boleta', () => {
    expect(() =>
      parseCGE('Hola, este es un texto cualquiera sin formato de boleta.'),
    ).toThrow(ParserError)
    try {
      parseCGE('Texto random sin marcadores')
    } catch (err) {
      expect((err as ParserError).code).toBe('INVALID_FORMAT')
    }
  })
})

describe('Caso 6: PDF de otra empresa pasado a parseCGE', () => {
  it('lanza ParserError WRONG_EMPRESA cuando recibe boleta de Enel', () => {
    expect(() => parseCGE(BOLETA_ENEL)).toThrow(ParserError)
    try {
      parseCGE(BOLETA_ENEL)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
      expect((err as ParserError).message).toMatch(/no parece de CGE/i)
    }
  })

  it('rechaza boletas de Chilquinta', () => {
    const chilquinta = `
      Chilquinta Energía S.A.
      RUT: 96.813.520-1
      Avda. Argentina 1, Valparaíso
      Total a pagar $ 50.000
    `
    expect(() => parseCGE(chilquinta)).toThrow(ParserError)
    try {
      parseCGE(chilquinta)
    } catch (err) {
      expect((err as ParserError).code).toBe('WRONG_EMPRESA')
    }
  })

  it('rechaza boletas de SAESA', () => {
    const saesa = `
      Sociedad Austral de Electricidad S.A.
      RUT: 96.544.470-3
      gruposaesa.cl
      Total $ 60.000
    `
    expect(() => parseCGE(saesa)).toThrow(ParserError)
  })
})
