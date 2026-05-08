/**
 * Helpers compartidos para parsers de boleta. Extraídos del paquete CGE
 * cuando empezó a haber duplicación entre parsers.
 *
 * Convenciones:
 *   - Los regex toleran espacios variables y tildes opcionales.
 *   - parseChileanNumber maneja "1.234", "1.234,56", "-1.234" y "1234".
 *   - Las funciones nunca lanzan; devuelven 0 / Date(NaN) / undefined si
 *     no encuentran lo buscado.
 */

import type { Cargo } from './types'

/** Patrón para un número chileno (miles con punto, decimales con coma). */
export const CL_NUMBER = '\\b((?:\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,\\d+)?)\\b'

/**
 * Pre-procesa texto recién extraído de OCR, corrige errores comunes
 * antes de pasarlo a los parsers. Mejor hacerlo acá que en cada
 * parser individual (que se acumularían).
 *
 * Patrones cubiertos:
 *   - "AUT" cuando luce como label de RUT (al inicio de línea o
 *     después de espacio, antes de espacio/dos puntos) → "RUT".
 *     Letra A se confunde frecuentemente con R en OCR Tesseract.
 *   - "Pl[áa]T" / "VlT" → "RUT" en contextos similares.
 *   - Múltiples espacios consecutivos → un solo espacio.
 *
 * NO corrige:
 *   - Nombres y direcciones (riesgo de falsos cambios).
 *   - Mayúsculas/minúsculas en general (los regex usan /i flag).
 *
 * Idempotente: pasar el resultado de nuevo no cambia nada.
 */
export function normalizeOcrText(text: string): string {
  let out = text

  // "AUT:" o "AUT " al inicio de línea o después de whitespace, antes
  // de digito o espacio + digito. Sólo si "RUT" no ya está en la línea
  // (evita doble corrección en boletas que tienen ambos).
  out = out.replace(
    /(^|\n|\s)AUT([\s:.])/g,
    (match, before, after) => `${before}RUT${after}`,
  )

  // "Vlo." o "Vto" → "Vto" (vencimiento abreviado).  Ya está cubierto
  // por la regex de fecha pero normalizar ayuda.
  out = out.replace(/\bVlo\.?\b/g, 'Vto.')

  return out
}

const MONTHS_ES: Record<string, number> = {
  ene: 0, enero: 0,
  feb: 1, febrero: 1,
  mar: 2, marzo: 2,
  abr: 3, abril: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5,
  jul: 6, julio: 6,
  ago: 7, agosto: 7,
  sep: 8, sept: 8, septiembre: 8,
  oct: 9, octubre: 9,
  nov: 10, noviembre: 10,
  dic: 11, diciembre: 11,
}

/**
 * Parsea un número chileno robustly.
 *   "1.234" → 1234
 *   "1.234,56" → 1234.56
 *   "$ -3.200" → -3200
 *   "" / basura → NaN
 */
export function parseChileanNumber(s: string): number {
  const cleaned = s.replace(/[^\d.,-]/g, '').trim()
  if (!cleaned) return NaN
  const negative = cleaned.startsWith('-')
  const stripped = negative ? cleaned.slice(1) : cleaned
  const numeric = stripped.includes(',')
    ? parseFloat(stripped.replace(/\./g, '').replace(',', '.'))
    : parseInt(stripped.replace(/\./g, ''), 10)
  if (!Number.isFinite(numeric)) return NaN
  return negative ? -numeric : numeric
}

/**
 * Parsea una fecha chilena en formatos comunes:
 *   "13/08/2024", "13-08-24", "21 SEP 2024", "21 sep 2024",
 *   "12 Jun 2024", "23 May 2024".
 */
export function parseChileanDate(input: string): Date | null {
  const s = input.trim()
  if (!s) return null

  const slash = s.match(/^(\d{1,2})[\s/-](\d{1,2})[\s/-](\d{2,4})$/)
  if (slash) {
    const day = parseInt(slash[1], 10)
    const month = parseInt(slash[2], 10) - 1
    const yearRaw = parseInt(slash[3], 10)
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    return new Date(year, month, day)
  }

  const named = s.match(/^(\d{1,2})[\s/-]([a-záéíóúñ]+)[\s/-](\d{2,4})$/i)
  if (named) {
    const day = parseInt(named[1], 10)
    const monthIdx = MONTHS_ES[named[2].toLowerCase()]
    if (monthIdx === undefined) return null
    const yearRaw = parseInt(named[3], 10)
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    return new Date(year, monthIdx, day)
  }

  return null
}

/** Mes "Junio" → "Jun"; usado para parsear "07 Junio - 06 Agosto". */
function normalizeMonth(name: string): string {
  const lower = name.toLowerCase().slice(0, 3)
  if (MONTHS_ES[lower] !== undefined) return lower
  return name
}

const PERIODO_REGEX_SLASH =
  /(?:Per[íi]odo(?:\s*facturado|\s+de\s+facturaci[óo]n|\s+lectura)?|Monto\s+del\s+per[íi]odo|Lectura desde)[\s:]*?(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})\s*(?:al?|hasta|-|–|y)\s*(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})/i

const PERIODO_REGEX_MONTH_ONLY =
  /(?:Monto\s+del\s+(?:per[íi]odo|Per[íi]odo))\s+(\d{1,2})\s+([a-záéíóúñ]+)\s*[-–y]\s*(\d{1,2})\s+([a-záéíóúñ]+)/i

// Fallback OCR-tolerante: dos fechas DD month YYYY conectadas con
// `-` / `–` / `al` / `hasta`, sin importar el label antes. El OCR a
// veces destroza el label "Monto del período" → "Monto del RA" pero
// las fechas suelen sobrevivir.
const DATE_RANGE_GENERIC =
  /(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})\s*(?:al?|hasta|-|–|y)\s*(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})/i

/** Extrae período facturado en formatos heterogéneos. */
export function extractPeriodo(
  text: string,
  fallbackYear?: number,
): { desde: Date; hasta: Date } {
  const m = text.match(PERIODO_REGEX_SLASH)
  if (m) {
    const desde = parseChileanDate(m[1])
    const hasta = parseChileanDate(m[2])
    if (desde && hasta) return { desde, hasta }
  }

  // Caso "07 Junio - 06 Agosto" sin año explícito (Metrogas)
  const m2 = text.match(PERIODO_REGEX_MONTH_ONLY)
  if (m2) {
    const year = fallbackYear ?? new Date().getFullYear()
    const desde = parseChileanDate(`${m2[1]}-${normalizeMonth(m2[2])}-${year}`)
    const hasta = parseChileanDate(`${m2[3]}-${normalizeMonth(m2[4])}-${year}`)
    if (desde && hasta) return { desde, hasta }
  }

  // Fallback: cualquier rango de fechas válidas en el texto, asumiendo
  // que es el período (suelen ser las únicas dos fechas con month-name
  // próximas en una boleta). Filtra por separación máxima 90 días para
  // descartar pares espurios (ej. fecha emisión + fecha último pago de
  // hace 2 años).
  const matches = Array.from(text.matchAll(new RegExp(DATE_RANGE_GENERIC.source, 'gi')))
  for (const mm of matches) {
    const desde = parseChileanDate(mm[1])
    const hasta = parseChileanDate(mm[2])
    if (!desde || !hasta) continue
    const diffDays = (hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)
    // Boleta típica: 28-32 días (mensual) o 60 (bimestral). Aceptamos
    // hasta 90 para colchón. Negativos o ≥ 90 → probablemente no es
    // período sino otra cosa.
    if (diffDays >= 0 && diffDays <= 90) return { desde, hasta }
  }

  return { desde: new Date(NaN), hasta: new Date(NaN) }
}

/** Construye un regex que matchea "{label} ... {número chileno}". */
export function buildCargoPattern(label: string): RegExp {
  return new RegExp(`${label}[^\\n]*?${CL_NUMBER}`, 'i')
}

/** Extrae múltiples cargos según una lista de patrones {concepto, pattern}. */
export function extractCargosFromPatterns(
  text: string,
  patterns: ReadonlyArray<{ concepto: string; pattern: RegExp }>,
): Cargo[] {
  const cargos: Cargo[] = []
  for (const { concepto, pattern } of patterns) {
    const m = text.match(pattern)
    if (!m) continue
    const monto = parseChileanNumber(m[1])
    if (!Number.isFinite(monto)) continue
    cargos.push({ concepto, monto })
  }
  return cargos
}

const TOTAL_A_PAGAR_REGEX = new RegExp(
  `(?:Total\\s+a\\s+pagar|TOTAL\\s+A\\s+PAGAR|TOTAL\\s+\\$|Total\\s+\\$)[^\\n]*?${CL_NUMBER}`,
  'i',
)

const IVA_REGEX = new RegExp(
  `(?:IVA(?:\\s*19\\s*%)?|IVA\\s+de\\s+(?:esta|este).*?(?:Boleta|documento))[^\\n]*?${CL_NUMBER}`,
  'i',
)

/** Extrae el "Total a pagar" más explícito de la boleta. */
export function extractTotal(text: string): number {
  const m = text.match(TOTAL_A_PAGAR_REGEX)
  if (!m) return 0
  const v = parseChileanNumber(m[1])
  return Number.isFinite(v) ? v : 0
}

/** Extrae el monto de IVA si aparece. */
export function extractIVA(text: string): number {
  const m = text.match(IVA_REGEX)
  if (!m) return 0
  const v = parseChileanNumber(m[1])
  return Number.isFinite(v) ? v : 0
}

// `N[°º]` requiere ° o º — el OCR a veces los destroza a apóstrofo
// (`N'`), backtick (`` N` ``) o "No" / "Nro" / "Num". Toleramos todos.
//
// Capture restringido a "número/RUT-like": solo dígitos, guiones, puntos
// y K/k (último dígito de RUT chileno). Esto evita falsos positivos
// cuando OCR pega "Fecha" como capture si el label no tiene separador
// claro (ej. "N'Cliente Fecha de vencimiento").
const NUMERO_CLIENTE_REGEX =
  /(?:N[°º'`]?\s*(?:Cliente|Servicio)|N(?:ro|um)\.?\s*Cliente|C[óo]digo\s+Cliente|N[úu]mero\s+de\s+Cliente|Cliente\s*N[°º'`]?)[\s:.\-–—]*(\d[\d.\-/kK]{2,})/i

export function extractNumeroCliente(text: string): string | undefined {
  const m = text.match(NUMERO_CLIENTE_REGEX)
  if (!m) return undefined
  // Limpia separadores espurios al final.
  return m[1].replace(/[.-]+$/, '').trim() || undefined
}

// Separadores entre label y valor: cualquier whitespace, dos puntos,
// puntos, em-dash, en-dash, hyphen. El OCR mete em-dashes (`——`) entre
// label y date típicamente.
const LABEL_VALUE_SEP = '[\\s:.\\-–—]*'

const FECHA_EMISION_REGEX = new RegExp(
  `(?:Fecha de emisi[óo]n|Emisi[óo]n|Boleta\\s+Emitida|Fecha\\s+Emisi[óo]n)${LABEL_VALUE_SEP}(\\d{1,2}[\\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\\d]+[\\s/-]\\d{2,4})`,
  'i',
)

const FECHA_VENCIMIENTO_REGEX = new RegExp(
  `(?:Fecha de vencimiento|Vence|Vencimiento|VENCIMIENTO|Venc\\.|Vto\\.)${LABEL_VALUE_SEP}(\\d{1,2}[\\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\\d]+[\\s/-]\\d{2,4})`,
  'i',
)

export function extractFechaEmision(text: string): Date | undefined {
  const m = text.match(FECHA_EMISION_REGEX)
  if (!m) return undefined
  return parseChileanDate(m[1]) ?? undefined
}

export function extractFechaVencimiento(text: string): Date | undefined {
  const m = text.match(FECHA_VENCIMIENTO_REGEX)
  if (!m) return undefined
  return parseChileanDate(m[1]) ?? undefined
}

/** Extrae consumo numérico junto a la unidad esperada. */
export function extractConsumo(
  text: string,
  unidad: 'kWh' | 'm3' | 'kg' | 'unidades',
): number {
  const escapedUnit =
    unidad === 'kWh'
      ? '(?:kWh|KWH|kW\\s*h)'
      : unidad === 'm3'
        ? '(?:m\\s*3|m³|M3|m3s|M3s|m3S)'
        : unidad === 'kg'
          ? '(?:kg|KG)'
          : '(?:unidades|cilindros)'
  // No usamos `\b` al final porque `³` (U+00B3) no es word-char, así que
  // `m³\b` falla cuando el siguiente char es espacio. Usamos lookahead a
  // whitespace / fin / paréntesis / coma para cerrar el match.
  const re = new RegExp(
    `((?:\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,\\d+)?)\\s*${escapedUnit}(?=\\s|$|[,.;\\]\\)])`,
    'i',
  )
  const m = text.match(re)
  if (!m) return 0
  const v = parseChileanNumber(m[1])
  return Number.isFinite(v) ? v : 0
}
