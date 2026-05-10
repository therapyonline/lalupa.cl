/**
 * Parser de Aguas del Valle S.A.
 *
 * Sanitaria de la IV Región (Coquimbo), parte del grupo ESSBIO/Aguas
 * Nuevas. La plantilla "Explicación boleta" muestra labels propios:
 *   - `Cargo Fijo` (NO "Costo Fijo")
 *   - `Consumo Agua` (NO "Consumo Agua Potable")
 *   - `Recolección` (igual ESVAL, no "Servicio de Alcantarillado")
 *   - `Tratamiento` (sin sufijo "de Aguas Servidas")
 *   - `Sencillo Anterior` + `Sencillo Actual` en DOS líneas separadas
 *     (delta vs ESSBIO/Nuevosur que usan "Ajuste Sencillo" único)
 *
 * El parser delega a parseSissFamily porque las variantes ya están
 * cubiertas vía CARGO_PATTERNS y MULTI_NUMBER_LABELS del helper común.
 */

import type { ParsedBoleta, ParserModule } from '../types'
import { parseSissFamily } from './_siss-family'

const AGUAS_DEL_VALLE_KEYWORDS = [
  'Aguas del Valle S.A.',
  'AGUAS DEL VALLE S.A.',
  'Aguas del Valle',
  'aguasdelvalle.cl',
  // RUT pendiente verificación CMF; identificación primaria por razón
  // social + dominio.
]

const AGUAS_DEL_VALLE_DETECT_REGEX =
  /Aguas\s+del\s+Valle(\s+S\.A\.)?|aguasdelvalle\.cl/i
const AGUAS_DEL_VALLE_MARKERS_REGEX = AGUAS_DEL_VALLE_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(AGUAS\s+ANDINAS\s+S\.A\.|aguasandinas\.cl|61\.808\.000-5|\bEsval\b|esval\.cl|76\.000\.739-0|\bESSBio\b|essbio\.cl|76\.833\.300-9|\bNuevosur\b|nuevosur\.cl|96\.963\.440-6|\bSMAPA\b|smapa\.cl)/i

export function parseAguasDelValle(text: string): ParsedBoleta {
  return parseSissFamily(text, {
    empresa: 'Aguas del Valle',
    markersRegex: AGUAS_DEL_VALLE_MARKERS_REGEX,
    otherEmpresaMarkersRegex: OTHER_EMPRESA_MARKERS_REGEX,
  })
}

export const aguasDelValleParser: ParserModule = {
  empresa: 'Aguas del Valle',
  servicio: 'agua',
  fingerprint: {
    keywords: AGUAS_DEL_VALLE_KEYWORDS,
    format:
      'Aguas del Valle: layout IV Región tipo familia ESSBIO/ESVAL. Cargo Fijo, Consumo Agua (sin "Potable"), Recolección (no "Alcantarillado"), Tratamiento (sin "de Aguas Servidas"), Subtotal del mes + Intereses + Saldo Anterior + Sencillo Anterior + Sencillo Actual.',
  },
  detect(text) {
    return Boolean(text) && AGUAS_DEL_VALLE_DETECT_REGEX.test(text)
  },
  parse: parseAguasDelValle,
}
