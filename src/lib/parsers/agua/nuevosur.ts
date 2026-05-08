/**
 * Parser de Nuevosur S.A.
 *
 * Layout SISS estándar, sister template de ESSBio (mismo grupo).
 */

import type { ParsedBoleta, ParserModule } from '../types'
import { parseSissFamily } from './_siss-family'

const NUEVOSUR_KEYWORDS = [
  'Nuevosur S.A.',
  'Nuevosur',
  'nuevosur.cl',
  '96.963.440-6',
  'Monte Baeza',
]

const NUEVOSUR_DETECT_REGEX = /\bNuevosur\b|nuevosur\.cl|96\.963\.440-6/i
const NUEVOSUR_MARKERS_REGEX = NUEVOSUR_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(AGUAS\s+ANDINAS\s+S\.A\.|aguasandinas\.cl|61\.808\.000-5|\bEsval\b|76\.000\.739-0|\bESSBio\b|76\.833\.300-9|\bSMAPA\b|smapa\.cl)/i

export function parseNuevosur(text: string): ParsedBoleta {
  return parseSissFamily(text, {
    empresa: 'Nuevosur',
    markersRegex: NUEVOSUR_MARKERS_REGEX,
    otherEmpresaMarkersRegex: OTHER_EMPRESA_MARKERS_REGEX,
  })
}

export const nuevosurParser: ParserModule = {
  empresa: 'Nuevosur',
  servicio: 'agua',
  fingerprint: {
    keywords: NUEVOSUR_KEYWORDS,
    format:
      'Nuevosur: layout SISS estándar (sister format de ESSBio). VII Región del Maule.',
  },
  detect(text) {
    return Boolean(text) && NUEVOSUR_DETECT_REGEX.test(text)
  },
  parse: parseNuevosur,
}
