import type { ParserModule, Servicio } from './types'

const RUT_KEYWORD_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/
/**
 * Tolerante para texto de OCR: acepta `.`, `,` o espacio como separador de
 * miles, y un opcional espacio o `:` alrededor del guión antes del DV.
 *
 *   12.345.678-9  →  ✓ (PDF nativo)
 *   12 345 678 - 9  →  ✓ (OCR puede separar)
 *   12,345,678-9  →  ✓ (OCR puede confundir . con ,)
 */
const RUT_IN_TEXT_REGEX =
  /\b\d{1,2}[.,\s]\d{3}[.,\s]\d{3}\s*[-:]\s*[\dkK]\b/g

const modules: ParserModule[] = []
const rutIndex = new Map<string, ParserModule>()

function normalizeRut(rut: string): string {
  // Quita todo lo no-alfanumérico (puntos, comas, espacios, guiones, dos puntos).
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

/**
 * Normaliza un texto para matching insensible a OCR:
 * minúsculas, sin acentos, sin whitespace ni puntuación.
 *
 *   "Chilquinta Energía S.A."  →  "chilquintaenergiasa"
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Registra un parser en el sistema. Si ya existe uno para la misma
 * `empresa + servicio`, lo reemplaza (idempotente).
 */
export function registerParser(module: ParserModule): void {
  const idx = modules.findIndex(
    (m) => m.empresa === module.empresa && m.servicio === module.servicio,
  )
  if (idx >= 0) {
    modules[idx] = module
  } else {
    modules.push(module)
  }

  // Indexar RUTs declarados en fingerprint.keywords (formato chileno)
  for (const kw of module.fingerprint.keywords) {
    if (RUT_KEYWORD_REGEX.test(kw)) {
      rutIndex.set(normalizeRut(kw), module)
    }
  }
}

/**
 * Detecta a qué parser corresponde un texto.
 *
 * Estrategia en cascada:
 *   1. Busca cualquier RUT (incluso con separadores raros típicos de OCR)
 *      indexado por algún parser. Match más confiable.
 *   2. Llama al `detect()` de cada parser (regexes específicas).
 *   3. Fallback OCR-tolerante: normaliza el texto (sin acentos ni
 *      puntuación) y busca substrings normalizados de cada keyword.
 *      Captura casos donde el OCR rompe puntuación pero preserva las letras.
 */
export function detectParser(text: string): ParserModule | null {
  if (!text) return null

  for (const match of text.matchAll(RUT_IN_TEXT_REGEX)) {
    const found = rutIndex.get(normalizeRut(match[0]))
    if (found) return found
  }

  for (const m of modules) {
    if (m.detect(text)) return m
  }

  const normalizedText = normalizeForMatch(text)
  for (const m of modules) {
    for (const kw of m.fingerprint.keywords) {
      // Saltamos keywords que ya son RUTs (cubiertas en paso 1).
      if (RUT_KEYWORD_REGEX.test(kw)) continue
      const normalizedKw = normalizeForMatch(kw)
      // Evitamos matches espurios con keywords muy cortos (< 4 chars).
      if (normalizedKw.length < 4) continue
      if (normalizedText.includes(normalizedKw)) return m
    }
  }

  return null
}

/**
 * Busca un parser por `empresa + servicio`. La comparación de empresa
 * es case-insensitive ('CGE' === 'cge') para tolerar slugs vs displays.
 */
export function getParser(
  empresa: string,
  servicio: Servicio | string,
): ParserModule | null {
  const e = empresa.toLowerCase()
  return (
    modules.find(
      (m) => m.empresa.toLowerCase() === e && m.servicio === servicio,
    ) ?? null
  )
}

export function listParsers(): readonly ParserModule[] {
  return modules.slice()
}

/**
 * Limpia el registry. Sólo para tests / setup.
 */
export function clearParsers(): void {
  modules.length = 0
  rutIndex.clear()
}
