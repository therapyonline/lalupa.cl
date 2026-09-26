import { describe, expect, it } from 'vitest'
import { REVISION_REFERENCIAS, TODA_NORMATIVA } from '@/data/normativa-chilena'
import { analizarLegalmente } from './_analisis-legales'
import type { ParsedBoleta } from './types'

function boleta(overrides: Partial<ParsedBoleta> = {}): ParsedBoleta {
  return {
    empresa: 'CGE',
    servicio: 'electricidad',
    periodo: { desde: new Date('2026-05-01'), hasta: new Date('2026-05-31') },
    cliente: { numeroCliente: 'sintetico' },
    consumo: { unidad: 'kWh', valor: 250, tarifa: 'BT-1' },
    cargos: [{ concepto: 'Cargo fijo', monto: 1000 }],
    totales: { subtotal: 1000, iva: 190, total: 1190 },
    raw: 'Boleta de ejemplo',
    ...overrides,
  }
}
function suministro(
  servicio: ParsedBoleta['servicio'],
  overrides: Partial<ParsedBoleta> = {},
) {
  return boleta({
    servicio,
    consumo: {
      unidad: servicio === 'electricidad' ? 'kWh' : 'm3',
      valor: 20,
      tarifa: 'BT-1',
    },
    ...overrides,
  })
}
const buscar = (b: ParsedBoleta, id: string) =>
  analizarLegalmente(b).find((h) => h.id === id)

describe('ajustes y lecturas: hechos incompletos', () => {
  it.each(['electricidad', 'agua', 'gas'] as const)(
    'no impone cuatro meses a una reliquidación de %s',
    (servicio) => {
      const h = buscar(
        suministro(servicio, {
          raw: 'Reliquidación tarifaria períodos 2020-2024',
        }),
        `refacturacion-${servicio}`,
      )!
      expect(h.severidad).toBe('revision')
      expect(h.descripcion).toContain('no identifica por sí sola su causa')
      expect(h.accionSugerida).not.toMatch(/negarte|no pag|fuera de plazo/)
    },
  )
  it.each(['electricidad', 'agua', 'gas'] as const)(
    'una lectura estimada de %s no prueba una secuencia ni gratuidad',
    (servicio) => {
      const h = buscar(
        suministro(servicio, {
          raw: 'Información: lectura estimada período anterior',
        }),
        `lectura-estimada-${servicio}`,
      )!
      expect(h.descripcion).toContain(
        'no basta para contar estimaciones consecutivas',
      )
      expect(h.accionSugerida).not.toMatch(/sin costo|5 días/)
      expect(h.fundamentoLegal.servicio).toBe(servicio)
      if (servicio !== 'electricidad')
        expect(h.fundamentoLegal.norma).not.toContain('Decreto 327')
    },
  )
  it('reconoce facturación provisoria sin afirmar que no hubo lectura física', () => {
    expect(
      buscar(
        boleta({ raw: 'Facturación provisoria' }),
        'lectura-estimada-electricidad',
      ),
    ).toBeDefined()
  })
  it.each(['Corte de suministro realizado', 'Boleta sin historial de cortes'])(
    'una reposición requiere antecedentes incluso con texto: %s',
    (raw) => {
      const h = buscar(
        boleta({ raw, cargos: [{ concepto: 'Reposición', monto: 4000 }] }),
        'reposicion-sin-corte-electricidad',
      )!
      expect(h.severidad).toBe('revision')
      expect(h.descripcion).toContain('no acredita por sí sola si hubo corte')
      expect(h.accionSugerida).not.toMatch(/retiro|devolver|indebido/)
    },
  )
  it.each([0, -5000, NaN, Infinity])(
    'no interpreta %s como un cargo positivo de reposición',
    (monto) => {
      expect(
        buscar(
          boleta({ cargos: [{ concepto: 'Reposición', monto }] }),
          'reposicion-sin-corte-electricidad',
        ),
      ).toBeUndefined()
    },
  )
})

describe('tarifas, temporadas y extracción parcial', () => {
  it.each(['BT-1', 'BT1'])('pide comprobar demanda y tarifa %s', (tarifa) => {
    const h = buscar(
      boleta({
        consumo: { unidad: 'kWh', valor: 20, tarifa },
        cargos: [{ concepto: 'Cargo por demanda máxima', monto: 2000 }],
      }),
      'cargo-potencia-bt1',
    )!
    expect(h.severidad).toBe('revision')
    expect(h.descripcion).toContain('no demuestra un cambio de contrato')
  })
  it.each(['BT-2', undefined])('no asume BT-1 para tarifa %s', (tarifa) => {
    expect(
      buscar(
        boleta({
          consumo: { unidad: 'kWh', valor: 20, tarifa },
          cargos: [{ concepto: 'Potencia contratada', monto: 2000 }],
        }),
        'cargo-potencia-bt1',
      ),
    ).toBeUndefined()
  })
  it('distingue potencia base de demanda máxima', () => {
    expect(
      buscar(
        boleta({
          cargos: [{ concepto: 'Cargo por potencia base', monto: 3000 }],
        }),
        'cargo-potencia-bt1',
      ),
    ).toBeUndefined()
  })
  it('pide mediciones para un recargo reactivo sin usar un umbral supuesto', () => {
    const h = buscar(
      boleta({
        cargos: [{ concepto: 'Multa por consumo reactivo', monto: 4000 }],
      }),
      'multa-reactivo-bt1',
    )!
    expect(h.accionSugerida).toContain('mediciones')
    expect(JSON.stringify(h)).not.toMatch(/0,93|retiro del cargo/)
  })
  it.each([
    undefined,
    new Date('2026-01-15'),
    new Date('2026-05-15'),
    new Date('invalid'),
  ])('no decide temporada punta por emisión %s', (fechaEmision) => {
    const h = buscar(
      suministro('agua', {
        fechaEmision,
        cargos: [{ concepto: 'Sobreconsumo punta', monto: 5000 }],
      }),
      'agua-periodo-punta-revisar',
    )!
    expect(h.severidad).toBe('revision')
    expect(h.descripcion).toContain('fecha de emisión no determina')
  })
  it.each([undefined, new Date('2026-07-15'), new Date('2026-12-15')])(
    'no aprueba ni rechaza invierno por emisión %s',
    (fechaEmision) => {
      const h = buscar(
        boleta({
          fechaEmision,
          cargos: [{ concepto: 'Recargo por consumo invierno', monto: 8000 }],
        }),
        'recargo-invierno-revisar',
      )!
      expect(h.accionSugerida).toContain('No lo des por válido')
    },
  )
  it('una boleta emitida en abril puede incluir consumo de marzo sin declararse ilegal', () => {
    const h = buscar(
      suministro('agua', {
        fechaEmision: new Date('2026-04-10'),
        periodo: {
          desde: new Date('2026-03-01'),
          hasta: new Date('2026-03-31'),
        },
        cargos: [{ concepto: 'Sobreconsumo', monto: 10 }],
      }),
      'agua-periodo-punta-revisar',
    )!
    expect(h.descripcion).not.toMatch(
      /error de facturación|fuera del período legal/,
    )
  })
  it('un nombre incompleto de cargo no prueba inexistencia del componente', () => {
    const h = buscar(
      boleta({ cargos: [{ concepto: 'Cargo único', monto: 500 }] }),
      'cargo-unico-bt1',
    )!
    expect(h.accionSugerida).toContain('denominación completa')
    expect(
      buscar(
        boleta({
          cargos: [{ concepto: 'Cargo único sistema transmisión', monto: 500 }],
        }),
        'cargo-unico-bt1',
      ),
    ).toBeUndefined()
  })
  it('alcantarillado sin línea de agua se trata como posible extracción incompleta', () => {
    const h = buscar(
      suministro('agua', {
        cargos: [{ concepto: 'Recolección', monto: 3000 }],
      }),
      'agua-alcantarillado-sin-agua-potable',
    )!
    expect(h.descripcion).toContain('faltar en la extracción')
    expect(h.descripcion).not.toContain('no tiene base')
  })
  it.each(['Consumo agua potable', 'Consumo de agua', 'Agua potable'])(
    'reconoce el cargo de agua con etiqueta %s',
    (concepto) => {
      expect(
        buscar(
          suministro('agua', {
            cargos: [
              { concepto: 'Recolección', monto: 3000 },
              { concepto, monto: 4000 },
            ],
          }),
          'agua-alcantarillado-sin-agua-potable',
        ),
      ).toBeUndefined()
    },
  )
})

describe('mora: sin umbral universal ni conversión anual supuesta', () => {
  it.each(['1,5', '2.5', '4', '12.75'])(
    'tasa %s mensual requiere base y referencia aplicable',
    (tasa) => {
      const h = buscar(
        boleta({
          raw: `Interés por mora ${tasa}% mensual sobre saldos vencidos`,
        }),
        'interes-mora-verificar-tmc',
      )!
      expect(h.severidad).toBe('revision')
      expect(h.descripcion).toContain(`${tasa}% mensual`)
      expect(h.descripcion).not.toMatch(/usura|supera|anual/)
      expect(h.accionSugerida).toContain('fecha aplicable')
    },
  )
  it('una tasa de publicidad en otra línea no se atribuye al cargo por mora', () => {
    const h = buscar(
      boleta({
        raw: 'Oferta de crédito: tasa 4% mensual\nMora de tu servicio',
        cargos: [{ concepto: 'Interés por mora', monto: 200 }],
      }),
      'interes-mora-verificar-tmc',
    )!
    expect(h.descripcion).not.toContain('4%')
    expect(h.descripcion).toContain('no una tasa mensual vinculada')
  })
  it.each([
    'Tasa promocional 4% mensual',
    'Sin demora: tasa promocional 4% mensual',
  ])('no transforma publicidad en mora: %s', (raw) => {
    expect(
      buscar(boleta({ raw }), 'interes-mora-verificar-tmc'),
    ).toBeUndefined()
  })
  it('un cargo de mora sin tasa pide cálculo, sin certificar legalidad', () => {
    expect(
      buscar(
        boleta({ cargos: [{ concepto: 'Recargo por mora', monto: 200 }] }),
        'interes-mora-verificar-tmc',
      )?.descripcion,
    ).toContain('importe por sí solo')
  })
  it.each([0, -200, Infinity])(
    'no trata un abono o importe %s como cobro de mora',
    (monto) => {
      expect(
        buscar(
          boleta({ cargos: [{ concepto: 'Recargo por mora', monto }] }),
          'interes-mora-verificar-tmc',
        ),
      ).toBeUndefined()
    },
  )
})

describe('beneficios, cortes y plazos', () => {
  it.each([
    [
      'electricidad',
      'Publicidad Subsidio Eléctrico Ley 21.667',
      'subsidio-21667-ausente',
    ],
    [
      'agua',
      'Postula al Subsidio al Pago del Consumo de Agua Potable',
      'agua-subsidio-sap-ausente',
    ],
  ] as const)(
    'no atribuye un beneficio por una publicidad de %s',
    (servicio, raw, id) => {
      const h = buscar(suministro(servicio, { raw }), id)!
      expect(h.severidad).toBe('informativo')
      expect(h.descripcion).toMatch(/aviso general|publicidad/)
      expect(h.accionSugerida).not.toMatch(/exígelo|retroactivo/)
    },
  )
  it.each([
    ['electricidad', 'Subsidio eléctrico', 'subsidio-21667-ausente'],
    ['agua', 'Subsidio agua potable', 'agua-subsidio-sap-ausente'],
  ] as const)(
    'un descuento leído evita el aviso de ausencia en %s',
    (servicio, concepto, id) => {
      expect(
        buscar(
          suministro(servicio, {
            raw: concepto,
            cargos: [{ concepto, monto: -500 }],
          }),
          id,
        ),
      ).toBeUndefined()
    },
  )
  it('no confunde publicidad eléctrica con subsidio de agua', () => {
    expect(
      buscar(
        suministro('agua', { raw: 'Postula al Subsidio Eléctrico' }),
        'agua-subsidio-sap-ausente',
      ),
    ).toBeUndefined()
  })
  it('electrodependencia no promete suministro infalible ni inscripción confirmada', () => {
    const h = buscar(
      boleta({ raw: 'Registro de electrodependientes' }),
      'electrodependiente-no-corte',
    )!
    expect(h.descripcion).toContain(
      'No significa que el suministro no pueda fallar',
    )
    expect(h.descripcion).toContain('no verifica una inscripción')
    expect(
      buscar(
        suministro('agua', { raw: 'Electrodependientes' }),
        'electrodependiente-no-corte',
      ),
    ).toBeUndefined()
  })
  it.each(['electricidad', 'agua', 'gas'] as const)(
    'no traslada plazos ni protecciones entre servicios: %s',
    (servicio) => {
      const b = suministro(servicio, {
        raw: 'Aviso de corte por mora. Saldo vencido.',
      })
      const aviso = buscar(b, `aviso-corte-${servicio}`)!
      expect(aviso.fundamentoLegal.servicio).toBe(servicio)
      expect(JSON.stringify(analizarLegalmente(b))).not.toMatch(
        /15 días|10 días|24 horas|fines de semana|electrodependiente/,
      )
    },
  )
  it('no deduce compensación de una duración aislada', () => {
    const h = buscar(
      boleta({ raw: 'Interrupción de suministro: 30 horas sin luz' }),
      'compensacion-corte-no-aplicada',
    )!
    expect(h.descripcion).toContain('No basta para confirmar')
    expect(h.descripcion + h.accionSugerida).not.toMatch(
      /22 horas|cargo fijo|compensación automática/,
    )
  })
  it('una palabra sobre compensación no equivale a un abono extraído', () => {
    expect(
      buscar(
        boleta({ raw: 'Interrupción de suministro; compensación pendiente' }),
        'compensacion-corte-no-aplicada',
      ),
    ).toBeDefined()
    expect(
      buscar(
        boleta({
          raw: 'Interrupción de suministro',
          cargos: [{ concepto: 'Compensación corte', monto: -500 }],
        }),
        'compensacion-corte-no-aplicada',
      ),
    ).toBeUndefined()
  })
  it('separar un despacho no prueba un recargo oculto', () => {
    const h = buscar(
      suministro('gas', {
        tipoVenta: 'producto',
        cargos: [{ concepto: 'Recargo despacho', monto: 1000 }],
      }),
      'gas-recargo-delivery-revisar',
    )!
    expect(h.descripcion).toContain(
      'no demuestra que el precio no haya sido informado',
    )
  })
  it.each([13, 30, 45])(
    'el total de %s kg no se interpreta como formato de un cilindro',
    (valor) => {
      expect(
        analizarLegalmente(
          suministro('gas', {
            tipoVenta: 'producto',
            consumo: { valor, unidad: 'kg' },
          }),
        ),
      ).toEqual([])
    },
  )
  it('no aplica reglas de suministro por red a la compra de cilindros', () => {
    const b = suministro('gas', {
      tipoVenta: 'producto',
      consumo: { unidad: 'kg', valor: 30 },
      raw: 'Saldo anterior. Aviso de corte. Lectura estimada. Reliquidación.',
      cargos: [{ concepto: 'Reposición', monto: 5000 }],
    })
    expect(analizarLegalmente(b)).toEqual([])
  })
  it('un formato de gas desconocido no prueba suministro por red', () => {
    expect(
      analizarLegalmente(
        suministro('gas', {
          consumo: { unidad: 'kg', valor: 30 },
          raw: 'Aviso de corte',
        }),
      ),
    ).toEqual([])
  })
  it('pedir desglose o reclamar no inventa cinco días universales', () => {
    const b = boleta({
      cargos: [{ concepto: 'Otros', monto: 2000, sospechoso: true }],
    })
    expect(buscar(b, 'otros-cargos-sin-desglose')).toBeDefined()
    expect(buscar(b, 'plazos-reclamo-sospechosos')).toBeDefined()
    expect(JSON.stringify(analizarLegalmente(b))).not.toMatch(
      /tienen 5|15 días|lista para enviar/i,
    )
  })
})

describe('contrato del análisis', () => {
  it('es puro, ordena revisiones primero y no certifica ausencia de errores', () => {
    const b = boleta({
      raw: 'Lectura estimada. Aviso de corte.',
      cargos: [{ concepto: 'Otros', monto: 10, sospechoso: true }],
    })
    const snapshot = structuredClone(b)
    const result = analizarLegalmente(b)
    expect(b).toEqual(snapshot)
    expect(analizarLegalmente(b)).toEqual(result)
    expect(result.map((h) => h.severidad)).toEqual([
      'revision',
      'revision',
      'informativo',
      'informativo',
      'informativo',
    ])
    for (const h of result) {
      expect(h.alcance).toBe('orientativo')
      expect(h.versionAnalisis).toBe(REVISION_REFERENCIAS.version)
      expect(h.fundamentoLegal.tipo).toMatch(/norma|contexto|canal/)
    }
    expect(analizarLegalmente(boleta())).toEqual([])
  })
  it('no presenta directorios de atención como texto de una norma', () => {
    const normas = Object.values(TODA_NORMATIVA).filter(
      (r) => r.tipo === 'norma',
    )
    expect(normas.length).toBeGreaterThan(0)
    for (const r of normas)
      expect(r.url).toMatch(/^https:\/\/www\.bcn\.cl\/leychile\//)
  })
})
