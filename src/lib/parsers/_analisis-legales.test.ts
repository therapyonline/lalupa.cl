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

describe('analizarLegalmente: subsidio SAP agua ausente', () => {
  it('marca derecho cuando menciona SAP pero no hay descuento', () => {
    const boleta = makeBoletaAgua({
      raw: 'Recuerde postular al Subsidio al Pago del Consumo de Agua Potable (Ley 18.778)',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'agua-subsidio-sap-ausente')).toBeDefined()
  })

  it('no alerta cuando el subsidio agua sí aparece como cargo negativo', () => {
    const boleta = makeBoletaAgua({
      raw: 'Subsidio agua potable aplicado',
      cargos: [
        { concepto: 'Cargo fijo', monto: 914 },
        { concepto: 'Subsidio agua potable', monto: -5000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'agua-subsidio-sap-ausente')).toBeUndefined()
  })
})

describe('analizarLegalmente: cilindro GLP', () => {
  function makeCilindro(kg: number, overrides: Partial<ParsedBoleta> = {}) {
    return {
      empresa: 'Gasco GLP' as const,
      servicio: 'gas' as const,
      tipoVenta: 'producto' as const,
      periodo: { desde: new Date('2026-05-01'), hasta: new Date('2026-05-01') },
      cliente: {},
      consumo: { unidad: 'kg' as const, valor: kg },
      cargos: [{ concepto: 'Vale de carga GLP', monto: 19990 }],
      totales: { subtotal: 16798, iva: 3192, total: 19990 },
      raw: 'Boleta cilindro',
      ...overrides,
    } as ParsedBoleta
  }

  it('marca formato no estándar para cilindro de 13 kg', () => {
    const r = analizarLegalmente(makeCilindro(13))
    expect(r.find((a) => a.id === 'gas-cilindro-formato-no-estandar')).toBeDefined()
  })

  it('no alerta para cilindro estándar de 15 kg', () => {
    const r = analizarLegalmente(makeCilindro(15))
    expect(r.find((a) => a.id === 'gas-cilindro-formato-no-estandar')).toBeUndefined()
  })

  it('detecta recargo de delivery como derecho', () => {
    const r = analizarLegalmente(
      makeCilindro(15, {
        cargos: [
          { concepto: 'Vale de carga GLP', monto: 19990 },
          { concepto: 'Recargo de delivery', monto: 2000 },
        ],
      }),
    )
    expect(r.find((a) => a.id === 'gas-recargo-delivery-no-publicado')).toBeDefined()
  })
})

describe('analizarLegalmente: aviso corte gas red', () => {
  it('informa plazo 10 días cuando menciona corte', () => {
    const boleta: ParsedBoleta = {
      empresa: 'Metrogas',
      servicio: 'gas',
      periodo: { desde: new Date('2026-05-01'), hasta: new Date('2026-05-31') },
      cliente: {},
      consumo: { unidad: 'm3', valor: 40 },
      cargos: [{ concepto: 'Gas consumido', monto: 50000 }],
      totales: { subtotal: 42017, iva: 7983, total: 50000 },
      raw: 'Aviso de corte por no pago a partir del 20/06/2026',
    }
    const r = analizarLegalmente(boleta)
    const hallazgo = r.find((a) => a.id === 'gas-aviso-corte-10dias')
    expect(hallazgo).toBeDefined()
    expect(hallazgo?.descripcion).toMatch(/10 d[íi]as/)
  })
})

describe('analizarLegalmente: interés mora sobre TMC', () => {
  it('alerta cuando la tasa mensual explícita supera 2.5%', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Interés por mora de 4% mensual sobre saldos vencidos',
    })
    const r = analizarLegalmente(boleta)
    const hallazgo = r.find((a) => a.id === 'interes-mora-sobre-tmc')
    expect(hallazgo).toBeDefined()
    expect(hallazgo?.severidad).toBe('alerta_legal')
  })

  it('no alerta con tasa baja (1.5% mensual)', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Interés 1,5% mensual',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'interes-mora-sobre-tmc')).toBeUndefined()
  })

  it('informa derecho cuando hay cargo de mora sin tasa explícita', () => {
    const boleta = makeBoletaElectricidad({
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Recargo por mora', monto: 3000 },
      ],
      raw: 'Boleta con recargo por mora sin tasa indicada',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'interes-mora-verificar-tmc')).toBeDefined()
  })
})

describe('analizarLegalmente: compensación corte no aplicada', () => {
  it('marca derecho cuando menciona interrupción sin compensación', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Evento de interrupción de suministro registrado: 30 horas sin servicio',
    })
    const r = analizarLegalmente(boleta)
    expect(
      r.find((a) => a.id === 'compensacion-corte-no-aplicada'),
    ).toBeDefined()
  })

  it('no alerta cuando la compensación sí está en el texto', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Interrupción de suministro. Compensación aplicada en esta boleta.',
    })
    const r = analizarLegalmente(boleta)
    expect(
      r.find((a) => a.id === 'compensacion-corte-no-aplicada'),
    ).toBeUndefined()
  })
})

describe('analizarLegalmente: recargo invierno fuera de temporada', () => {
  it('alerta cuando hay recargo invierno en boleta de diciembre', () => {
    const boleta = makeBoletaElectricidad({
      empresa: 'SAESA',
      fechaEmision: new Date('2026-12-15'),
      consumo: { unidad: 'kWh', valor: 300, tarifa: 'BT-1' },
      cargos: [
        { concepto: 'Cargo fijo', monto: 1201 },
        { concepto: 'Recargo por consumo invierno', monto: 8000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(
      r.find((a) => a.id === 'recargo-invierno-fuera-temporada'),
    ).toBeDefined()
  })

  it('no alerta cuando es julio (dentro del período invernal)', () => {
    const boleta = makeBoletaElectricidad({
      empresa: 'SAESA',
      fechaEmision: new Date('2026-07-15'),
      cargos: [
        { concepto: 'Cargo fijo', monto: 1201 },
        { concepto: 'Recargo por consumo invierno', monto: 8000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(
      r.find((a) => a.id === 'recargo-invierno-fuera-temporada'),
    ).toBeUndefined()
  })
})

describe('analizarLegalmente: alcantarillado sin agua potable', () => {
  it('alerta cuando cobran alcantarillado sin agua potable y hay consumo', () => {
    const boleta = makeBoletaAgua({
      consumo: { unidad: 'm3', valor: 12 },
      cargos: [
        { concepto: 'Cargo fijo', monto: 914 },
        { concepto: 'Servicio de alcantarillado', monto: 9000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(
      r.find((a) => a.id === 'agua-alcantarillado-sin-agua-potable'),
    ).toBeDefined()
  })

  it('no alerta cuando sí hay cargo de agua potable', () => {
    const boleta = makeBoletaAgua({
      cargos: [
        { concepto: 'Cargo fijo', monto: 914 },
        { concepto: 'Consumo agua potable', monto: 7000 },
        { concepto: 'Servicio de alcantarillado', monto: 9000 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(
      r.find((a) => a.id === 'agua-alcantarillado-sin-agua-potable'),
    ).toBeUndefined()
  })
})

describe('analizarLegalmente: aviso corte luz/agua 15 días', () => {
  it('informa plazo 15 días en electricidad', () => {
    const boleta = makeBoletaElectricidad({
      raw: 'Aviso de corte por no pago programado para el 05/07/2026',
    })
    const r = analizarLegalmente(boleta)
    const h = r.find((a) => a.id === 'aviso-corte-15dias-electricidad')
    expect(h).toBeDefined()
    expect(h?.descripcion).toMatch(/15 d[íi]as/)
  })

  it('informa plazo 15 días en agua', () => {
    const boleta = makeBoletaAgua({
      raw: 'Suspensión del servicio por mora',
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'aviso-corte-15dias-agua')).toBeDefined()
  })
})

describe('analizarLegalmente: otros cargos sin desglose', () => {
  it('marca derecho cuando hay un cargo "Otros"', () => {
    const boleta = makeBoletaElectricidad({
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Otros', monto: 3500 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'otros-cargos-sin-desglose')).toBeDefined()
  })

  it('no marca cuando el cargo tiene concepto específico', () => {
    const boleta = makeBoletaElectricidad({
      cargos: [
        { concepto: 'Cargo fijo', monto: 1048 },
        { concepto: 'Cargo por uso del sistema de transmisión', monto: 3500 },
      ],
    })
    const r = analizarLegalmente(boleta)
    expect(r.find((a) => a.id === 'otros-cargos-sin-desglose')).toBeUndefined()
  })
})

describe('analizarLegalmente: boleta limpia', () => {
  it('no devuelve hallazgos para una boleta normal sin anomalías', () => {
    const boleta = makeBoletaElectricidad()
    const r = analizarLegalmente(boleta)
    expect(r).toHaveLength(0)
  })
})
