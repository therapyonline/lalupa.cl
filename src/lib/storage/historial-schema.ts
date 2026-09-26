import { z } from 'zod'
import {
  EMPRESA_SLUGS,
  AGUA_SLUGS,
  GAS_SLUGS,
  type ParsedBoleta,
} from '@/lib/parsers/types'

z.config({ jitless: true })

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024
const text = (max = 4096) => z.string().max(max)
// null representa fecha desconocida, también en respaldos v1 de lecturas parciales.
const date = z.union([z.string().max(40), z.null()]).transform((value, ctx) => {
  if (value === null) return new Date(NaN)
  const parsed = new Date(value)
  if (
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value.slice(0, 10)
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Fecha inválida: usa ISO o null si es desconocida',
    })
    return z.NEVER
  }
  return parsed
})

export const storedBoletaSchema = z
  .object({
    id: text(),
    empresa: z.enum([
      ...Object.keys(EMPRESA_SLUGS),
      ...Object.keys(AGUA_SLUGS),
      ...Object.keys(GAS_SLUGS),
    ]),
    servicio: z.enum(['electricidad', 'agua', 'gas']),
    tipoVenta: z.enum(['consumo', 'producto']).optional(),
    periodo: z.object({ desde: date, hasta: date }),
    cliente: z
      .object({
        nombre: text().optional(),
        direccion: text().optional(),
        numeroCliente: text().optional(),
      })
      .default({}),
    consumo: z.object({
      unidad: z.enum(['kWh', 'm3', 'kg', 'unidades']),
      valor: z.number().finite().nonnegative(),
      tarifa: text().optional(),
    }),
    cargos: z
      .array(
        z.object({
          concepto: text(),
          monto: z.number().finite(),
          detalle: text().optional(),
          sospechoso: z.boolean().optional(),
          razonSospecha: text().optional(),
        }),
      )
      .max(100),
    totales: z.object({
      subtotal: z.number().finite(),
      iva: z.number().finite(),
      total: z.number().finite(),
    }),
    fechaEmision: date.optional(),
    fechaVencimiento: date.optional(),
    raw: text(200_000),
    guardadoEn: date,
  })
  .superRefine((boleta, ctx) => {
    const companies = {
      electricidad: EMPRESA_SLUGS,
      agua: AGUA_SLUGS,
      gas: GAS_SLUGS,
    }
    if (!Object.hasOwn(companies[boleta.servicio], boleta.empresa))
      ctx.addIssue({
        code: 'custom',
        path: ['empresa'],
        message: 'Empresa incompatible con servicio',
      })
    const units =
      boleta.servicio === 'electricidad'
        ? ['kWh']
        : boleta.servicio === 'agua'
          ? ['m3']
          : ['m3', 'kg', 'unidades']
    if (!units.includes(boleta.consumo.unidad))
      ctx.addIssue({
        code: 'custom',
        path: ['consumo'],
        message: 'Unidad incompatible con servicio',
      })
    if (boleta.tipoVenta === 'producto' && boleta.servicio !== 'gas')
      ctx.addIssue({
        code: 'custom',
        path: ['tipoVenta'],
        message: 'Tipo de venta incompatible',
      })
    if (boleta.periodo.desde > boleta.periodo.hasta)
      ctx.addIssue({
        code: 'custom',
        path: ['periodo'],
        message: 'Período invertido',
      })
  })
  .transform((boleta) => ({
    ...boleta,
    empresa: boleta.empresa as ParsedBoleta['empresa'],
  }))

// Se descartan campos desconocidos deliberadamente; no se copian a la base.
export const historialSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportadoEn: text(40).optional(),
  boletas: z.array(storedBoletaSchema).max(500),
})
