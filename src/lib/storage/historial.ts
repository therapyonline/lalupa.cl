import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  historialSchema,
  storedBoletaSchema,
  MAX_IMPORT_BYTES,
} from './historial-schema'
import { boletaIdentity } from './boleta-identity'
import { isValidDate } from '@/lib/dates'
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
    const opening = openDB<LalupaSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by-empresa', 'empresa')
        store.createIndex('by-servicio', 'servicio')
        store.createIndex('by-periodo-desde', 'periodo.desde')
      },
      blocked() {
        // El usuario puede cerrar otra pestaña y reintentar.
      },
      blocking() {
        void dbPromise?.then((db) => db.close())
        dbPromise = null
      },
      terminated() {
        dbPromise = null
      },
    })
    dbPromise = opening.catch((error) => {
      dbPromise = null
      throw error
    })
  }
  return dbPromise
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
  // Valida el mismo contrato que los respaldos antes de guardar.
  const boleta = storedBoletaSchema.parse(
    JSON.parse(
      JSON.stringify({
        ...parsed,
        id: '',
        guardadoEn: new Date(),
      }),
    ),
  )
  const id = await boletaIdentity(boleta)
  const db = await getDb()
  if (await db.get(STORE, id)) return id
  // Compatibilidad no destructiva con claves antiguas: no reescribirlas.
  for (const key of await db.getAllKeys(STORE)) {
    if (/^v2-[a-f0-9]{64}$/.test(key)) continue
    const existing = await db.get(STORE, key)
    if (!existing) continue
    if ((await boletaIdentity(existing)) === id) return existing.id
  }
  const tx = db.transaction(STORE, 'readwrite')
  try {
    if (!(await tx.store.get(id))) await tx.store.add({ ...boleta, id })
    await tx.done
  } catch (error) {
    try {
      tx.abort()
    } catch {
      /* ya abortada */
    }
    await tx.done.catch(() => undefined)
    if (error instanceof DOMException && /quota/i.test(error.name))
      throw new StorageQuotaExceededError()
    throw error
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
    (a, b) =>
      (isValidDate(a.periodo.desde) ? a.periodo.desde.getTime() : 0) -
      (isValidDate(b.periodo.desde) ? b.periodo.desde.getTime() : 0),
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
  version: 2
  exportadoEn: string
  boletas: BoletaGuardada[]
}

export async function exportarHistorial(): Promise<Blob> {
  const db = await getDb()
  const boletas = await db.getAll(STORE)
  const payload: ExportPayload = {
    version: 2,
    exportadoEn: new Date().toISOString(),
    boletas,
  }
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
}

export interface ResultadoImport {
  /** Boletas nuevas efectivamente agregadas. */
  agregadas: number
  /** Boletas omitidas porque su contenido ya existía en el histórico local. */
  omitidas: number
}

export async function importarHistorial(file: File): Promise<ResultadoImport> {
  if (file.size > MAX_IMPORT_BYTES)
    throw new Error(
      'El respaldo supera el máximo de 10 MB. No se importó ninguna boleta.',
    )
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  const parsed = historialSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `Formato no reconocido: ${issue.message} (en ${issue.path.join('.')}). No se importó ninguna boleta.`,
    )
  }
  // Calcular hashes ANTES de abrir la transacción: crypto puede dejarla inactiva.
  const candidates = await Promise.all(
    parsed.data.boletas.map(async (boleta) => ({
      ...boleta,
      id: await boletaIdentity(boleta),
    })),
  )
  const db = await getDb()
  const localIds = new Set(await db.getAllKeys(STORE))
  for (const key of localIds) {
    if (/^v2-[a-f0-9]{64}$/.test(key)) continue
    const legacy = await db.get(STORE, key)
    if (legacy) localIds.add(await boletaIdentity(legacy))
  }
  const tx = db.transaction(STORE, 'readwrite')
  let agregadas = 0
  let omitidas = 0
  try {
    for (const boleta of candidates) {
      if (localIds.has(boleta.id) || (await tx.store.get(boleta.id))) {
        omitidas++
        continue
      }
      await tx.store.add(boleta)
      localIds.add(boleta.id)
      agregadas++
    }
    await tx.done
  } catch (error) {
    try {
      tx.abort()
    } catch {
      /* ya abortada */
    }
    await tx.done.catch(() => undefined)
    throw error
  }
  return { agregadas, omitidas }
}
