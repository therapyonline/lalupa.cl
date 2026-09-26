import { z } from 'zod'
import { PREGUNTAS_2026 } from '@/data/subsidio-electrico'
import { TIPOS_RECLAMO, type ReclamoFormData } from '@/lib/sernac/letter'

z.config({ jitless: true })
const short = z.string().max(4096)
const draftVersion = z.literal(2).optional() // Borradores anteriores no tenían versión.
export const reclamoDraftSchema = z.object({
  version: draftVersion,
  source: z.string().max(64).nullable().optional(),
  step: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  data: z.object({
    tipoReclamo: z.union([z.literal(''), z.enum(TIPOS_RECLAMO)]).default(''),
    nombre: short.default(''),
    rut: short.default(''),
    email: short.default(''),
    telefono: short.default(''),
    direccion: short.default(''),
    empresaRazonSocial: short.default(''),
    empresaRut: short.default(''),
    empresaDireccion: short.default(''),
    hechos: z.string().max(100_000).default(''),
    peticion: z.string().max(100_000).default(''),
  }),
})
export type ReclamoDraft = Omit<z.infer<typeof reclamoDraftSchema>, 'data'> & {
  data: ReclamoFormData
}

const isoDate = z.iso.datetime().optional()
export const reclamoPayloadSchema = z.object({
  empresaSlug: short.min(1),
  empresaNombre: short.min(1),
  servicio: short.min(1),
  periodoDesde: isoDate,
  periodoHasta: isoDate,
  fechaEmision: isoDate,
  fechaVencimiento: isoDate,
  numeroCliente: short.optional(),
  total: z.number().finite(),
  cargosSospechosos: z
    .array(
      z.object({
        concepto: short,
        monto: z.number().finite(),
        razon: short.optional(),
      }),
    )
    .max(100),
})

export const subsidioDraftSchema = z.object({
  version: draftVersion,
  step: z
    .number()
    .int()
    .min(0)
    .max(PREGUNTAS_2026.length - 1),
  answers: z.record(z.string(), z.unknown()).superRefine((answers, ctx) => {
    for (const [id, value] of Object.entries(answers)) {
      const p = PREGUNTAS_2026.find((q) => q.id === id)
      const valid =
        p &&
        (p.tipo === 'boolean'
          ? typeof value === 'boolean'
          : p.tipo === 'select'
            ? p.opciones?.some((o) => o.value === value)
            : typeof value === 'number' &&
              Number.isInteger(value) &&
              value >= (p.min ?? -Infinity) &&
              value <= (p.max ?? Infinity))
      if (!valid)
        ctx.addIssue({
          code: 'custom',
          path: [id],
          message: 'Respuesta inválida',
        })
    }
  }),
})

export const STORAGE_NOTICE =
  'El navegador no permite guardar este borrador. Puedes continuar, pero los cambios podrían perderse al salir.'
export const INVALID_DRAFT_NOTICE =
  'No pudimos recuperar el borrador anterior porque su formato no es válido. Puedes empezar de nuevo.'

/** Lectura acotada: ni JSON roto ni acceso bloqueado deben impedir usar el formulario. */
export function readSessionDraft<T>(
  key: string,
  schema: z.ZodType<T>,
): { data: T | null; notice?: string } {
  let raw: string | null
  try {
    raw = sessionStorage.getItem(key)
  } catch {
    return { data: null, notice: STORAGE_NOTICE }
  }
  if (raw === null) return { data: null }
  try {
    if (raw.length > 250_000) throw new Error('Borrador demasiado grande')
    const result = schema.safeParse(JSON.parse(raw))
    if (result.success) return { data: result.data }
  } catch {
    /* Conservamos el formulario utilizable. */
  }
  return { data: null, notice: INVALID_DRAFT_NOTICE }
}

export async function reclamoSource(
  payload: z.infer<typeof reclamoPayloadSchema>,
): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}
