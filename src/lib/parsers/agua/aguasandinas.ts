/**
 * Parser de Aguas Andinas S.A.
 *
 * Layout SISS estándar — ver `_siss-family.ts`. Comparte template con
 * ESSBio y Nuevosur (todas usan "Su consumo en $ se calcula así").
 */

import type { ParsedBoleta, ParserModule } from '../types'
import { parseSissFamily } from './_siss-family'

const AGUASANDINAS_KEYWORDS = [
  'Aguas Andinas S.A.',
  'Aguas Andinas',
  'aguasandinas.cl',
  '61.808.000-5',
  'Av. Presidente Balmaceda 1398',
]

/**
 * Regex específica: requiere razón social completa, dominio, RUT o
 * dirección legal — NO matchea con menciones genéricas de "Aguas Andinas"
 * que aparecen como referencia en boletas de otras sanitarias (ej. SMAPA
 * que contrata tratamiento a Aguas Andinas).
 */
const AGUASANDINAS_DETECT_REGEX =
  /AGUAS\s+ANDINAS\s+S\.A\.|aguasandinas\.cl|61\.808\.000-5|Balmaceda\s+1398/i

const AGUASANDINAS_MARKERS_REGEX = AGUASANDINAS_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bEsval\b|76\.000\.739-0|76\.000\.957-1|\bESSBIO\b|76\.833\.300-9|\bNuevosur\b|96\.963\.440-6|\bSMAPA\b|smapa\.cl)/i

export function parseAguasAndinas(text: string): ParsedBoleta {
  return parseSissFamily(text, {
    empresa: 'Aguas Andinas',
    markersRegex: AGUASANDINAS_MARKERS_REGEX,
    otherEmpresaMarkersRegex: OTHER_EMPRESA_MARKERS_REGEX,
  })
}

export const aguasandinasParser: ParserModule = {
  empresa: 'Aguas Andinas',
  servicio: 'agua',
  fingerprint: {
    keywords: AGUASANDINAS_KEYWORDS,
    format:
      'Aguas Andinas: layout SISS — "Su consumo en $ se calcula así" con Cargo Fijo, Consumo Agua Potable, Servicio Alcantarillado, Tratamiento, ajustes, IVA en "Datos tributarios".',
  },
  detect(text) {
    return Boolean(text) && AGUASANDINAS_DETECT_REGEX.test(text)
  },
  parse: parseAguasAndinas,
}
