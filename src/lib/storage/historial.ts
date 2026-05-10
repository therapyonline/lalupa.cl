import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ParsedBoleta } from '@/lib/parsers'

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

function reviveBoleta(raw: BoletaGuardada): BoletaGuardada {
  return {
    ...raw,
    guardadoEn: new Date(raw.guardadoEn),
    periodo: {
      desde: new Date(raw.periodo.desde),
      hasta: new Date(raw.periodo.hasta),
    },
    fechaEmision: raw.fechaEmision ? new Date(raw.fechaEmision) : undefined,
    fechaVencimiento: raw.fechaVencimiento
      ? new Date(raw.fechaVencimiento)
      : undefined,
  }
}

export async function importarHistorial(file: File): Promise<number> {
  const text = await file.text()
  let data: ExportPayload
  try {
    data = JSON.parse(text) as ExportPayload
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }

  if (!data || !Array.isArray(data.boletas)) {
    throw new Error(
      'Formato no reconocido: falta el campo `boletas` con un array de entradas.',
    )
  }

  const db = await getDb()
  const tx = db.transaction(STORE, 'readwrite')
  let count = 0
  for (const raw of data.boletas) {
    if (!raw || typeof raw.id !== 'string') continue
    await tx.store.put(reviveBoleta(raw))
    count++
  }
  await tx.done
  return count
}
