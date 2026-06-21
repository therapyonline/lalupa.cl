import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { z } from 'zod'
import type { ParsedBoleta } from '@/lib/parsers'

/**
 * Caps defensivos para protegerse contra JSON malicioso al importar:
 *   - Cantidad máxima de boletas en el archivo (razonable para uso
 *     personal; un usuario activo guarda ~24 boletas/año).
 *   - Tamaño máximo de cada string para no llenar la cuota IndexedDB.
 */
const MAX_BOLETAS_IMPORT = 500
const MAX_STRING_LENGTH = 4096
const MAX_RAW_TEXT_LENGTH = 200_000 // boleta OCR puede tener ~50KB; cap a 200KB

/**
 * Schema Zod del payload de export/import. Valida shape, tipos y caps
 * de tamaño antes de persistir en IndexedDB. Si el archivo es malicioso
 * o corrupto, falla con error legible en vez de corromper la base.
 *
 * `passthrough()` solo en campos opcionales que podrían tener
 * extensiones futuras; los críticos son `strict()` implícito.
 */
const cappedString = (max = MAX_STRING_LENGTH) =>
  z.string().max(max, `Campo excede ${max} caracteres`)

const cargoSchema = z.object({
  concepto: cappedString(),
  monto: z.number().finite(),
  detalle: cappedString().optional(),
  sospechoso: z.boolean().optional(),
  razonSospecha: cappedString().optional(),
})

const importBoletaSchema = z.object({
  id: cappedString(),
  empresa: cappedString(),
  servicio: z.enum(['electricidad', 'agua', 'gas']),
  tipoVenta: z.enum(['consumo', 'producto']).optional(),
  periodo: z.object({
    desde: z.union([z.string(), z.date()]),
    hasta: z.union([z.string(), z.date()]),
  }),
  cliente: z
    .object({
      nombre: cappedString().optional(),
      direccion: cappedString().optional(),
      numeroCliente: cappedString().optional(),
    })
    .default({}),
  consumo: z.object({
    unidad: z.enum(['kWh', 'm3', 'kg', 'unidades']),
    valor: z.number().finite(),
    tarifa: cappedString().optional(),
  }),
  cargos: z.array(cargoSchema).max(100, 'Máximo 100 cargos por boleta'),
  totales: z.object({
    subtotal: z.number().finite(),
    iva: z.number().finite(),
    total: z.number().finite(),
  }),
  fechaEmision: z.union([z.string(), z.date()]).optional(),
  fechaVencimiento: z.union([z.string(), z.date()]).optional(),
  raw: cappedString(MAX_RAW_TEXT_LENGTH),
  guardadoEn: z.union([z.string(), z.date()]),
})

const importPayloadSchema = z.object({
  version: z.literal(1),
  exportadoEn: cappedString().optional(),
  boletas: z
    .array(importBoletaSchema)
    .max(MAX_BOLETAS_IMPORT, `Máximo ${MAX_BOLETAS_IMPORT} boletas por archivo`),
})

const DB_NAME = 'lalupa'
const DB_VERSION = 1
const STORE = 'boletas'

export type BoletaGuardada = ParsedBoleta & {
  id: string
  guardadoEn: Date
}

interface LalupaSchema extends DBSchema {
  boletas: {
    key: string
    value: BoletaGuardada
    indexes: {
      'by-empresa': string
      'by-periodo-desde': Date
      'by-servicio': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<LalupaSchema>> | null = null

function getDb(): Promise<IDBPDatabase<LalupaSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('IndexedDB no está disponible fuera del navegador.'),
    )
  }
  if (!dbPromise) {
    dbPromise = openDB<LalupaSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by-empresa', 'empresa')
        store.createIndex('by-servicio', 'servicio')
        store.createIndex('by-periodo-desde', 'periodo.desde')
      },
    })
  }
  return dbPromise
}

/**
 * ID determinístico para una boleta: empresa + servicio + período + total.
 *
 * Reemplaza el UUID random anterior, que generaba duplicados cada vez
 * que el usuario clickeaba "Guardar" sobre la misma boleta (o navegaba
 * atrás y guardaba de nuevo). Con id determinístico, `db.put` reemplaza
 * idempotentemente: misma boleta = misma key = mismo registro.
 *
 * Si las fechas no son válidas (Date(NaN)), usamos el rawText hasheado
 * como fallback para que la idempotencia siga aplicando si el mismo
 * input se procesa dos veces. Cuando son válidas (caso normal), el id
 * es legible y debuggable.
 */
function idDeterministico(parsed: ParsedBoleta): string {
  const desdeMs = parsed.periodo?.desde?.getTime?.()
  const hastaMs = parsed.periodo?.hasta?.getTime?.()
  if (
    typeof desdeMs === 'number' &&
    Number.isFinite(desdeMs) &&
    typeof hastaMs === 'number' &&
    Number.isFinite(hastaMs)
  ) {
    return `${parsed.servicio}-${parsed.empresa}-${desdeMs}-${hastaMs}-${parsed.totales.total}`
  }
  // Fallback para boletas con fechas inválidas (parser tuvo lectura
  // parcial pero el usuario quiso guardar igual): hash del rawText.
  // FNV-1a, 32-bit, suficiente para evitar colisiones a nivel histórico
  // personal (decenas de boletas) sin agregar dependencias.
  let hash = 0x811c9dc5
  const text = parsed.raw ?? ''
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${parsed.servicio}-${parsed.empresa}-fallback-${(hash >>> 0).toString(16)}`
}

/**
 * Error específico cuando IndexedDB rechaza por cuota llena. El UI puede
 * mostrar un mensaje accionable ("exporta y limpia") en vez de un error
 * genérico de DOMException.
 */
export class StorageQuotaExceededError extends Error {
  constructor() {
    super(
      'Tu navegador llenó la cuota de almacenamiento local. Exporta tu histórico, borra boletas viejas y vuelve a intentar.',
    )
    this.name = 'StorageQuotaExceededError'
  }
}

export async function guardarBoleta(parsed: ParsedBoleta): Promise<string> {
  const db = await getDb()
  const id = idDeterministico(parsed)
  const guardada: BoletaGuardada = {
    ...parsed,
    id,
    guardadoEn: new Date(),
  }
  try {
    await db.put(STORE, guardada)
  } catch (err) {
    // DOMException name = 'QuotaExceededError' es el código estándar para
    // cuota IndexedDB llena. Cubrimos también el mensaje en algunos
    // browsers (Safari pone "QUOTA_EXCEEDED_ERR" en el name).
    if (
      err instanceof DOMException &&
      /quota/i.test(err.name)
    ) {
      throw new StorageQuotaExceededError()
    }
    throw err
  }
  return id
}

export async function listarBoletas(
  empresa?: string,
  servicio?: string,
): Promise<BoletaGuardada[]> {
  const db = await getDb()
  let resultados: BoletaGuardada[]
  if (empresa) {
    resultados = await db.getAllFromIndex(STORE, 'by-empresa', empresa)
  } else if (servicio) {
    resultados = await db.getAllFromIndex(STORE, 'by-servicio', servicio)
  } else {
    resultados = await db.getAll(STORE)
  }
  if (empresa && servicio) {
    resultados = resultados.filter((b) => b.servicio === servicio)
  }
  return resultados.sort(
    (a, b) => a.periodo.desde.getTime() - b.periodo.desde.getTime(),
  )
}

export async function eliminarBoleta(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
}

/**
 * Borra todas las boletas del histórico local. Devuelve la cantidad
 * eliminada. Operación irreversible, el caller debería pedir
 * confirmación al usuario.
 */
export async function eliminarTodasLasBoletas(): Promise<number> {
  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  const total = (await tx.store.getAll()).length
  await tx.store.clear()
  await tx.done
  return total
}

interface ExportPayload {
  version: 1
  exportadoEn: string
  boletas: BoletaGuardada[]
}

export async function exportarHistorial(): Promise<Blob> {
  const db = await getDb()
  const boletas = await db.getAll(STORE)
  const payload: ExportPayload = {
    version: 1,
    exportadoEn: new Date().toISOString(),
    boletas,
  }
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
}

/**
 * Convierte un valor (string ISO o Date) a un Date válido, o devuelve
 * `fallback` si no es parseable. Evita persistir `Date(NaN)` en IndexedDB
 * (que rompe el índice por fecha y el render con date-fns).
 */
function toValidDate(value: unknown, fallback: Date | null): Date | null {
  if (value == null) return fallback
  const d = value instanceof Date ? value : new Date(value as string)
  return Number.isFinite(d.getTime()) ? d : fallback
}

function reviveBoleta(raw: BoletaGuardada): BoletaGuardada {
  // guardadoEn cae a "ahora" si viene corrupto; las fechas de período
  // caen en cascada a algo válido para no romper el índice por fecha.
  const guardadoEn = toValidDate(raw.guardadoEn, new Date()) as Date
  const desde = toValidDate(raw.periodo?.desde, guardadoEn) as Date
  const hasta = toValidDate(raw.periodo?.hasta, desde) as Date
  return {
    ...raw,
    guardadoEn,
    periodo: { desde, hasta },
    fechaEmision: toValidDate(raw.fechaEmision, null) ?? undefined,
    fechaVencimiento: toValidDate(raw.fechaVencimiento, null) ?? undefined,
  }
}

export interface ResultadoImport {
  /** Boletas nuevas efectivamente agregadas. */
  agregadas: number
  /** Boletas omitidas porque su id ya existía en el histórico local. */
  omitidas: number
}

export async function importarHistorial(file: File): Promise<ResultadoImport> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }

  // Validación con Zod ANTES de tocar IndexedDB. Previene importar
  // JSON malicioso o corrupto que crashearía la UI al renderizar
  // (números no finitos, strings gigantes, arrays sin shape esperada).
  const parsed = importPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue.path.length > 0 ? ` (en ${issue.path.join('.')})` : ''
    throw new Error(
      `Formato no reconocido: ${issue.message}${path}. Solo se aceptan JSON exportados por lalupa.cl.`,
    )
  }

  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  let agregadas = 0
  let omitidas = 0
  // No sobrescribimos boletas existentes: si el id ya está, lo omitimos.
  // Así re-importar tu propio export no clobberea datos locales y avisamos
  // cuántas quedaron fuera. (Las lecturas dentro de la tx ven los add
  // previos, así que duplicados dentro del mismo archivo también se omiten.)
  for (const validated of parsed.data.boletas) {
    const boleta = reviveBoleta(validated as unknown as BoletaGuardada)
    const existente = await tx.store.get(boleta.id)
    if (existente) {
      omitidas++
      continue
    }
    await tx.store.add(boleta)
    agregadas++
  }
  await tx.done
  return { agregadas, omitidas }
}
