import { describe, expect, it } from 'vitest'
import { PLANES_INTERNET } from '@/data/internet-planes'
import {
  fechaSantiago,
  filtrarPlanes,
  precioDisponible,
  proyectarCosto,
  type PlanInternet,
  type Horizonte,
} from './comparacion'

const fecha = '2026-09-26'
const base: PlanInternet = {
  id: 'ejemplo',
  empresa: 'Ejemplo',
  nombre: 'Plan sintético',
  tecnologia: 'Fibra',
  bajadaMbps: 600,
  subidaMbps: 600,
  servicios: ['internet'],
  tramos: [
    { desde: 1, hasta: 6, mensualCLP: 10000 },
    { desde: 7, hasta: null, mensualCLP: 20000 },
  ],
  instalacionCLP: 30000,
  observadaEl: fecha,
  revisarEl: '2026-10-26',
  fuente: 'https://example.com/',
  condiciones: 'Fixture sintético',
}
const filtros = { meses: 24, orden: 'empresa' } as const

describe('proyecciones por tramo e instalación', () => {
  it('incluye una instalación única y seis meses de promoción en ambos horizontes', () => {
    expect(proyectarCosto(base, 12)).toEqual({
      mensualidades: 180000,
      instalacion: 30000,
      total: 210000,
      promedio: 17500,
    })
    expect(proyectarCosto(base, 24)).toEqual({
      mensualidades: 420000,
      instalacion: 30000,
      total: 450000,
      promedio: 18750,
    })
  })
  it('admite tres tramos sin prolongar la primera promoción', () => {
    const p = {
      ...base,
      instalacionCLP: 0,
      tramos: [
        { desde: 1, hasta: 3, mensualCLP: 5000 },
        { desde: 4, hasta: 12, mensualCLP: 15000 },
        { desde: 13, hasta: null, mensualCLP: 22000 },
      ],
    }
    expect(proyectarCosto(p, 24).total).toBe(414000)
    expect(proyectarCosto(p, 12).total).toBe(150000)
  })
  it('no convierte instalación desconocida en gratis', () => {
    expect(proyectarCosto({ ...base, instalacionCLP: null }, 24)).toEqual({
      mensualidades: 420000,
      instalacion: null,
      total: null,
      promedio: null,
    })
  })
  it('un precio futuro desconocido no impide sumar los primeros 12 meses conocidos', () => {
    const p = {
      ...base,
      tramos: [
        { desde: 1, hasta: 12, mensualCLP: 10000 },
        { desde: 13, hasta: null, mensualCLP: null },
      ],
    }
    expect(proyectarCosto(p, 12).total).toBe(150000)
    expect(proyectarCosto(p, 24).total).toBeNull()
  })
  it.each([null, NaN, Infinity, -1, 100.5, Number.MAX_SAFE_INTEGER])(
    'rechaza mensualidad no calculable: %s',
    (mensualCLP) => {
      expect(
        proyectarCosto(
          { ...base, tramos: [{ desde: 1, hasta: null, mensualCLP }] },
          24,
        ).total,
      ).toBeNull()
    },
  )
  it.each([NaN, Infinity, -1, 100.5])(
    'rechaza instalación inválida: %s',
    (instalacionCLP) => {
      expect(proyectarCosto({ ...base, instalacionCLP }, 24).total).toBeNull()
    },
  )
  it.each([
    [
      { desde: 1, hasta: 5, mensualCLP: 10000 },
      { desde: 7, hasta: null, mensualCLP: 20000 },
    ],
    [
      { desde: 1, hasta: 7, mensualCLP: 10000 },
      { desde: 7, hasta: null, mensualCLP: 20000 },
    ],
    [{ desde: 0, hasta: null, mensualCLP: 10000 }],
    [{ desde: 1.5, hasta: null, mensualCLP: 10000 }],
    [{ desde: 1, hasta: 0, mensualCLP: 10000 }],
    [],
  ])('no inventa mensualidades ante rangos mal formados: %j', (...tramos) => {
    expect(proyectarCosto({ ...base, tramos }, 24).total).toBeNull()
  })
  it('rechaza un horizonte fuera de contrato', () => {
    expect(() => proyectarCosto(base, 0 as Horizonte)).toThrow(RangeError)
  })
})

describe('fecha, vigencia y filtros', () => {
  it('usa el día de Santiago y no el de UTC para el cierre', () => {
    expect(fechaSantiago(new Date('2026-09-29T02:59:59Z'))).toBe('2026-09-28')
    expect(fechaSantiago(new Date('2026-09-29T03:00:00Z'))).toBe('2026-09-29')
  })
  it('incluye el último día de campaña y retira el siguiente', () => {
    const p = { ...base, ofertaHasta: '2026-09-28' }
    expect(precioDisponible(p, '2026-09-28')).toBe(true)
    expect(precioDisponible(p, '2026-09-29')).toBe(false)
  })
  it('respeta revisión editorial aunque no exista un fin de campaña', () => {
    expect(precioDisponible(base, '2026-10-26')).toBe(true)
    expect(precioDisponible(base, '2026-10-27')).toBe(false)
    expect(precioDisponible(base, '2026-09-25')).toBe(false)
  })
  it.each(['2026-02-30', '2026-13-01', '', '2026-9-26', 'no-fecha'])(
    'no publica con fechas inválidas: %s',
    (date) => {
      expect(precioDisponible(base, date)).toBe(false)
      expect(precioDisponible({ ...base, revisarEl: date }, fecha)).toBe(false)
    },
  )
  it('presupuesto considera instalación y precio posterior, no solo promoción', () => {
    expect(
      filtrarPlanes([base], fecha, { ...filtros, presupuesto: 18000 }),
    ).toEqual([])
    expect(
      filtrarPlanes([base], fecha, { ...filtros, presupuesto: 18750 }),
    ).toHaveLength(1)
    expect(
      filtrarPlanes([base], fecha, {
        ...filtros,
        meses: 12,
        presupuesto: 18000,
      }),
    ).toHaveLength(1)
  })
  it('no redondea hacia abajo para encajar en el presupuesto', () => {
    const p = {
      ...base,
      tramos: [{ desde: 1, hasta: null, mensualCLP: 10000 }],
      instalacionCLP: 1,
    }
    expect(
      filtrarPlanes([p], fecha, { ...filtros, presupuesto: 10000 }),
    ).toEqual([])
  })
  it.each([0, -1, NaN, Infinity, 10000.5])(
    'cero no desactiva el filtro y rechaza límites inválidos: %s',
    (presupuesto) => {
      expect(filtrarPlanes([base], fecha, { ...filtros, presupuesto })).toEqual(
        [],
      )
    },
  )
  it('no filtra por cobertura ficticia y separa packs de TV', () => {
    const tv = { ...base, id: 'tv', servicios: ['internet', 'tv'] as const }
    expect(
      filtrarPlanes([base, tv], fecha, { ...filtros, servicios: 'solo' }).map(
        (p) => p.id,
      ),
    ).toEqual(['ejemplo'])
    expect(
      filtrarPlanes([base, tv], fecha, { ...filtros, servicios: 'tv' }).map(
        (p) => p.id,
      ),
    ).toEqual(['tv'])
    expect(
      filtrarPlanes([base], fecha, { ...filtros, bajadaMin: 800 }),
    ).toEqual([])
    expect(
      filtrarPlanes([base], fecha, { ...filtros, empresa: 'Otra' }),
    ).toEqual([])
  })
  it('no premia precios incompletos y no muta el catálogo', () => {
    const sinInstalacion = { ...base, id: 'desconocido', instalacionCLP: null }
    const planes = Object.freeze([sinInstalacion, Object.freeze(base)])
    expect(
      filtrarPlanes(planes, fecha, { ...filtros, orden: 'promedio' }).map(
        (p) => p.id,
      ),
    ).toEqual(['ejemplo', 'desconocido'])
    expect(planes[0].id).toBe('desconocido')
    expect(
      filtrarPlanes(planes, fecha, { ...filtros, presupuesto: 20000 }).map(
        (p) => p.id,
      ),
    ).toEqual(['ejemplo'])
    expect(filtrarPlanes(planes, '2026-10-27', filtros)).toEqual([])
  })
})

describe('regresiones del catálogo observado', () => {
  it('tiene fuentes y fechas por oferta, con proyecciones calculables', () => {
    expect(new Set(PLANES_INTERNET.map((p) => p.id)).size).toBe(
      PLANES_INTERNET.length,
    )
    for (const p of PLANES_INTERNET) {
      expect(p.fuente).toMatch(/^https:\/\//)
      expect(precioDisponible(p, fecha)).toBe(true)
      expect(proyectarCosto(p, 24).mensualidades).not.toBeNull()
    }
  })
  it('sustituye estimaciones antiguas y no inventa una subida GTD', () => {
    const wom = PLANES_INTERNET.find((p) => p.id === 'wom-600')!
    expect(proyectarCosto(wom, 24).total).toBe(407760)
    const gtd = PLANES_INTERNET.find((p) => p.id === 'gtd-940')!
    expect(gtd.subidaMbps).toBeNull()
    expect(gtd.instalacionCLP).toBe(0)
    expect(proyectarCosto(gtd, 24).total).toBe(635760)
    const mundo = PLANES_INTERNET.find((p) => p.id === 'mundo-800')!
    expect(proyectarCosto(mundo, 24).mensualidades).toBe(365760)
    expect(proyectarCosto(mundo, 24).total).toBeNull()
    expect(
      PLANES_INTERNET.some(
        (p) => /movistar.*600/.test(p.id) && p.servicios.length === 1,
      ),
    ).toBe(false)
  })
})
