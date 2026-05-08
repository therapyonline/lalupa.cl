import { describe, expect, it } from 'vitest'
import {
  ELECTRICIDAD_PARSERS,
  isElectricidadParserImplemented,
  parseElectricidad,
} from './index'

const MIN_BOLETA_CGE = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
Tarifa: BT1
Período facturado: 01/04/2026 al 30/04/2026
Consumo: 200 kWh
Cargo fijo ............... $ 1.000
IVA 19% .................. $ 200
Total a pagar ............ $ 50.000
`

describe('ELECTRICIDAD_PARSERS registry', () => {
  it('expone las 5 distribuidoras como claves', () => {
    expect(Object.keys(ELECTRICIDAD_PARSERS).sort()).toEqual([
      'CGE',
      'Chilquinta',
      'Enel',
      'Frontel',
      'SAESA',
    ])
  })
})

describe('parseElectricidad', () => {
  it('rutea CGE al parser implementado', () => {
    const r = parseElectricidad('CGE', MIN_BOLETA_CGE)
    expect(r.empresa).toBe('CGE')
    expect(r.totales.total).toBe(50000)
  })

  it('rechaza cross-empresa con error claro al invocar parser equivocado', () => {
    expect(() => parseElectricidad('Enel', MIN_BOLETA_CGE)).toThrow(
      /no parece de Enel|Detectamos marcadores/i,
    )
    for (const empresa of ['SAESA', 'Frontel', 'Chilquinta'] as const) {
      expect(() => parseElectricidad(empresa, MIN_BOLETA_CGE)).toThrow(
        /no parece de|Detectamos marcadores/i,
      )
    }
  })
})

describe('isElectricidadParserImplemented', () => {
  it('devuelve true para las 5 distribuidoras (todas implementadas)', () => {
    expect(isElectricidadParserImplemented('CGE')).toBe(true)
    expect(isElectricidadParserImplemented('Enel')).toBe(true)
    expect(isElectricidadParserImplemented('SAESA')).toBe(true)
    expect(isElectricidadParserImplemented('Frontel')).toBe(true)
    expect(isElectricidadParserImplemented('Chilquinta')).toBe(true)
  })
})
