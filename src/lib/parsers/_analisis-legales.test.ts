/**
 * Tests para el módulo de análisis legales sobre boletas parseadas.
 * Cada test construye una `ParsedBoleta` mínima sintética y verifica
 * que la función `analizarLegalmente` devuelva los hallazgos esperados.
 */

import { describe, expect, it } from 'vitest'
import type { ParsedBoleta } from './types'
import { analizarLegalmente } from './_analisis-legales'

function makeBoletaElectricidad(
  overrides: Partial<ParsedBoleta> = {},
): ParsedBoleta {
  return {
    empresa: 'CGE',
    servicio: 'electricidad',
    periodo: { desde: new Date('2026-05-01'), hasta: new Date('2026-05-31') },
    cliente: { numeroCliente: '12345678-9' },
    consumo: { unidad: 'kWh', valor: 250, tarifa: 'BT-1' },
    cargos: [{ concepto: 'Cargo fijo', monto: 1048 }],
    totales: { subtotal: 41985, iva: 7977, total: 49962 },
    raw: 'Boleta normal sin nada raro',
    ...overrides,
  }
}

function makeBoletaAgua(
  overrides: Partial<ParsedBoleta> = {},
): ParsedBoleta {
  return {
    empresa: 'Aguas Andinas',
    servicio: 'agua',
    periodo: { desde: new Date('2026-05-01'), hasta: new Date('2026-05-31') },
    cliente: { numeroCliente: '111111-1' },
    consumo: { unidad: 'm3', valor: 12 },
    cargos: [{ concepto: 'Cargo fijo', monto: 914 }],
    totales: { subtotal: 14400, iva: 2736, total: 17144 },
    raw: 'Boleta normal',
    fechaEmision: new Date('2026-05-15'),
    ...overrides,
  }
}

describe('analizarLegalmente: refacturación', () => {
  it('detecta reliquidación en el texto y emite derecho a verificar plazo', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Cuota 01 de 06 Cuota Reliquidación consumo $ 5.940',
    })
    const r = analizarLegalmente(boleta)
    const ref = r.find((a) => a.id.startsWith('refacturacion-'))
    expect(ref).toBeDefined()
    expect(ref?.severidad).toBe('derecho_disponible')
    expect(ref?.fundamentoLegal.norma).toMatch(/Reglamento|DS 327/i)
  })

  it('detecta refacturación retroactiva en boleta de agua', () => {
    const boleta = makeBoletaAgua({
      raw: 'Reliquidación consumo período anterior $ 8.000',
    })
    const r = analizarLegalmente(boleta)
    const ref = r.find((a) => a.id === 'refacturacion-agua')
    expect(ref).toBeDefined()
  })

  it('no falsa positiva en boleta sin reliquidación', () => {
    const boleta = makeBoletaElectricidad()
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id.startsWith('refacturacion-'))).toBeUndefined()
  })
})

describe('analizarLegalmente: reposición sin corte', () => {
  it('alerta cuando hay cargo de reposición y no hay corte mencionado', () => {
    const boleta = makeBoletaElectricidad({
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Reposición de servicio', monto: 5000 },
      ],
      raw: 'Boleta sin mención de corte previo',
    })
    const r = analizarLegalmente(boleta)
    const alerta = r.find((a) => a.id.startsWith('reposicion-sin-corte-'))
    expect(alerta).toBeDefined()
    expect(alerta?.severidad).toBe('alerta_legal')
  })

  it('no alerta cuando la boleta menciona el corte previo', () => {
    const boleta = makeBoletaElectricidad({
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Reposición de servicio', monto: 5000 },
      ],
      raw: 'Nota: corte de suministro registrado el 10/05/2026 por no pago. Reposición $ 5.000',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id.startsWith('reposicion-sin-corte-'))).toBeUndefined()
  })
})

describe('analizarLegalmente: lectura estimada', () => {
  it('marca derecho a relectura sin costo', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Lectura estimada del consumo del período',
    })
    const r = analizarLegalmente(boleta)
    const ref = r.find((a) => a.id === 'lectura-estimada-electricidad')
    expect(ref).toBeDefined()
    expect(ref?.severidad).toBe('derecho_disponible')
  })

  it('aplica también a agua', () => {
    const boleta = makeBoletaAgua({
      raw: 'Consumo estimado debido a imposibilidad de lectura',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'lectura-estimada-agua')).toBeDefined()
  })
})

describe('analizarLegalmente: cargo de potencia en BT-1', () => {
  it('alerta cuando aparece cargo de demanda máxima en boleta BT-1', () => {
    const boleta = makeBoletaElectricidad({
      consumo: { unidad: 'kWh', valor: 250, tarifa: 'BT-1' },
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Cargo por demanda máxima de potencia suministrada', monto: 15000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    const alerta = r.find((a) => a.id === 'cargo-potencia-bt1')
    expect(alerta).toBeDefined()
    expect(alerta?.severidad).toBe('alerta_legal')
  })

  it('no alerta en BT-2 (donde sí corresponde el cargo de potencia)', () => {
    const boleta = makeBoletaElectricidad({
      consumo: { unidad: 'kWh', valor: 850, tarifa: 'BT-2' },
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Cargo por demanda máxima de potencia suministrada', monto: 28500 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'cargo-potencia-bt1')).toBeUndefined()
  })
})

describe('analizarLegalmente: multa por consumo reactivo en BT-1', () => {
  it('alerta cuando aparece la multa en boleta residencial BT-1', () => {
    const boleta = makeBoletaElectricidad({
      consumo: { unidad: 'kWh', valor: 250, tarifa: 'BT-1' },
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Multa por Consumo Reactivo', monto: 5000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'multa-reactivo-bt1')).toBeDefined()
  })
})

describe('analizarLegalmente: período punta agua fuera de verano', () => {
  it('alerta cuando aparece sobreconsumo en boleta de mayo (fuera de dic-mar)', () => {
    const boleta = makeBoletaAgua({
      fechaEmision: new Date('2026-05-15'),
      cargos: [
        { concepto: 'Cargo fijo', monto: 914 },
        { concepto: 'Sobreconsumo agua potable punta', monto: 5000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'agua-sobreconsumo-fuera-verano')).toBeDefined()
  })

  it('no alerta cuando es enero (dentro del período punta)', () => {
    const boleta = makeBoletaAgua({
      fechaEmision: new Date('2026-01-15'),
      cargos: [
        { concepto: 'Cargo fijo', monto: 914 },
        { concepto: 'Sobreconsumo agua potable punta', monto: 5000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'agua-sobreconsumo-fuera-verano')).toBeUndefined()
  })
})

describe('analizarLegalmente: subsidio Ley 21.667 ausente', () => {
  it('marca derecho cuando la boleta menciona el subsidio pero no aparece como descuento', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Mensaje: Recuerda postular al Subsidio Eléctrico Ley 21.667 en subsidioelectrico.cl',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'subsidio-21667-ausente')).toBeDefined()
  })

  it('no alerta cuando el subsidio sí aparece como cargo negativo', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Subsidio Eléctrico Ley N°21.667 ........ -$ 2.891',
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Subsidio Eléctrico Ley 21.667', monto: -2891 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'subsidio-21667-ausente')).toBeUndefined()
  })
})

describe('analizarLegalmente: orden por severidad', () => {
  it('alertas legales aparecen antes que derechos disponibles', () => {
    const boleta = makeBoletaElectricidad({
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Reposición de servicio', monto: 5000 }, // alerta_legal
      ],
      raw: 'Lectura estimada del período', // derecho_disponible
    })
    const r = analizarLegalmente(boleta)
    const idxAlerta = r.findIndex(
      (a) => a.id === 'reposicion-sin-corte-electricidad',
    )
    const idxDerecho = r.findIndex(
      (a) => a.id === 'lectura-estimada-electricidad',
    )
    expect(idxAlerta).toBeGreaterThanOrEqual(0)
    expect(idxDerecho).toBeGreaterThanOrEqual(0)
    expect(idxAlerta).toBeLessThan(idxDerecho)
  })
})

describe('analizarLegalmente: boleta limpia', () => {
  it('no devuelve hallazgos para una boleta normal sin anomalías', () => {
    const boleta = makeBoletaElectricidad()
    const r = analizarLegalmente(boleta)
    expect(r).toHaveLength(0)
  })
})
