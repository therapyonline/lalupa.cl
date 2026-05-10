/**
 * Telemetría 100% client-side de los CARGO_PATTERNS de cada parser.
 *
 * Motivación: tenemos ~70 patterns en total (BT-1, BT-2, sanitarias,
 * gas). Algunos vienen de fixtures sintéticos o samples de documentación
 * oficial que pueden no aparecer en boletas reales. Después de N
 * análisis en producción real, los patrones que nunca matchean son
 * candidatos a remover.
 *
 * Principio: NADA SALE DEL NAVEGADOR. Solo localStorage. El usuario es
 * el dueño de su data. La página /privacidad expone un inspector para
 * que vea las cuentas y un botón para limpiarlas.
 *
 * Estructura del storage (`lalupa:parser-telemetry`):
 *   {
 *     totalAnalisis: number,
 *     conceptos: { [concepto]: number },  // cuántas veces cada concepto matcheo
 *     ultimoUpdate: ISO string,
 *   }
 *
 * Decisiones de diseño:
 *   - try/catch en TODAS las operaciones (Safari Private Mode, storage
 *     quota lleno, cookies bloqueadas).
 *   - Versionado del schema para migrar si cambia.
 *   - Cap absoluto al tamaño del registro: solo guardamos contadores,
 *     nunca el rawText ni datos personales.
 */

const STORAGE_KEY = 'lalupa:parser-telemetry'
const SCHEMA_VERSION = 1

interface TelemetrySnapshot {
  version: number
  totalAnalisis: number
  conceptos: Record<string, number>
  ultimoUpdate: string
}

function emptySnapshot(): TelemetrySnapshot {
  return {
    version: SCHEMA_VERSION,
    totalAnalisis: 0,
    conceptos: {},
    ultimoUpdate: new Date().toISOString(),
  }
}

function safeReadStorage(): TelemetrySnapshot {
  if (typeof window === 'undefined') return emptySnapshot()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptySnapshot()
    const parsed = JSON.parse(raw) as Partial<TelemetrySnapshot>
    // Validación defensiva del shape. Si el storage tiene un valor
    // corrupto (de versión antigua o manipulado), arrancamos limpio
    // en vez de propagar el error al parser.
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== SCHEMA_VERSION ||
      typeof parsed.totalAnalisis !== 'number' ||
      typeof parsed.conceptos !== 'object' ||
      parsed.conceptos === null
    ) {
      return emptySnapshot()
    }
    return {
      version: SCHEMA_VERSION,
      totalAnalisis: parsed.totalAnalisis,
      conceptos: parsed.conceptos as Record<string, number>,
      ultimoUpdate: parsed.ultimoUpdate ?? new Date().toISOString(),
    }
  } catch {
    return emptySnapshot()
  }
}

function safeWriteStorage(snapshot: TelemetrySnapshot): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Quota llena, private mode, o cookies bloqueadas. No bloquea el
    // parser, simplemente perdemos los contadores de ese análisis.
  }
}

/**
 * Registra los conceptos que matchearon en un análisis. Suma 1 al
 * total y +1 al contador de cada concepto presente. No registra qué
 * boleta ni los montos, solo los nombres de los conceptos.
 *
 * Llamar desde dentro de `extractCargosFromPatterns` o desde cada
 * parser después de extraer cargos.
 */
export function trackAnalisis(conceptosMatcheados: ReadonlyArray<string>): void {
  if (typeof window === 'undefined') return
  const snapshot = safeReadStorage()
  snapshot.totalAnalisis += 1
  for (const concepto of conceptosMatcheados) {
    snapshot.conceptos[concepto] = (snapshot.conceptos[concepto] ?? 0) + 1
  }
  snapshot.ultimoUpdate = new Date().toISOString()
  safeWriteStorage(snapshot)
}

/** Lee el snapshot actual. Útil para el inspector de UI. */
export function readTelemetry(): TelemetrySnapshot {
  return safeReadStorage()
}

/**
 * Limpia toda la telemetría. Útil cuando el usuario quiere borrar todo
 * vía página /privacidad.
 */
export function clearTelemetry(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Calcula la tasa de uso de cada concepto registrado. Los conceptos con
 * tasa < 0.05 después de 100+ análisis son candidatos a remover.
 *
 * Devuelve una lista ordenada de mayor a menor tasa de uso.
 */
export function analizarUsoPatrones(): Array<{
  concepto: string
  matches: number
  tasaUso: number
}> {
  const snapshot = safeReadStorage()
  if (snapshot.totalAnalisis === 0) return []
  return Object.entries(snapshot.conceptos)
    .map(([concepto, matches]) => ({
      concepto,
      matches,
      tasaUso: matches / snapshot.totalAnalisis,
    }))
    .sort((a, b) => b.tasaUso - a.tasaUso)
}
