import { describe, expect, it } from 'vitest'
import { getExtractionIssues } from './extraction-quality'
import type { ParsedBoleta } from './types'

const boleta: ParsedBoleta = {
  empresa: 'CGE', servicio: 'electricidad', cliente: {}, raw: '',
  periodo: { desde: new Date(2026, 8, 1), hasta: new Date(2026, 8, 30) },
  consumo: { unidad: 'kWh', valor: 200 }, cargos: [{ concepto: 'Energía', monto: 20000 }],
  totales: { total: 20000, subtotal: 20000, iva: 0 },
}

describe('calidad de extracción', () => {
  it('no inventa datos faltantes para una lectura sin señales de incompletitud', () => {
    expect(getExtractionIssues(boleta)).toEqual([])
  })
  it('señala período invertido y ausencia de cargos', () => {
    expect(getExtractionIssues({ ...boleta, cargos: [],
      periodo: { desde: boleta.periodo.hasta, hasta: boleta.periodo.desde },
    })).toEqual(['el período facturado', 'el detalle de cargos'])
  })
  it('señala fechas inválidas y números no finitos', () => {
    const issues = getExtractionIssues({ ...boleta,
      periodo: { desde: new Date(NaN), hasta: new Date(NaN) },
      cargos: [{ concepto: 'Cargo', monto: NaN }], consumo: { unidad: 'kWh', valor: NaN },
      totales: { ...boleta.totales, total: Infinity },
    })
    expect(issues).toHaveLength(4)
  })
  it('no exige un período de consumo a una compra de cilindro', () => {
    expect(getExtractionIssues({ ...boleta, empresa: 'Lipigas', servicio: 'gas', tipoVenta: 'producto',
      periodo: { desde: new Date(NaN), hasta: new Date(NaN) }, consumo: { unidad: 'kg', valor: 0 },
    })).toEqual([])
  })
  it('identifica el cero ambiguo como dato a comprobar', () => {
    expect(getExtractionIssues({ ...boleta, consumo: { unidad: 'kWh', valor: 0 } })).toHaveLength(1)
  })
})
