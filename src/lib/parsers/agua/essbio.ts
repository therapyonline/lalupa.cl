/**
 * Parser de ESSBio S.A.
 *
 * Layout SISS estándar (sister format de Nuevosur).
 */

import type { ParsedBoleta, ParserModule } from '../types'
import { parseSissFamily } from './_siss-family'

const ESSBIO_KEYWORDS = [
  'Essbio S.A.',
  'ESSBio',
  'ESSBIO',
  'essbio.cl',
  '76.833.300-9',
]

const ESSBIO_DETECT_REGEX = /\bESSBio\b|essbio\.cl|76\.833\.300-9/i
const ESSBIO_MARKERS_REGEX = ESSBIO_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(AGUAS\s+ANDINAS\s+S\.A\.|aguasandinas\.cl|61\.808\.000-5|\bEsval\b|76\.000\.739-0|\bNuevosur\b|96\.963\.440-6|\bSMAPA\b|smapa\.cl)/i

export function parseEssbio(text: string): ParsedBoleta {
  return parseSissFamily(text, {
    empresa: 'ESSBio',
    markersRegex: ESSBIO_MARKERS_REGEX,
    otherEmpresaMarkersRegex: OTHER_EMPRESA_MARKERS_REGEX,
  })
}

export const essbioParser: ParserModule = {
  empresa: 'ESSBio',
  servicio: 'agua',
  fingerprint: {
    keywords: ESSBIO_KEYWORDS,
    format:
      'ESSBio: layout SISS estándar (sister format de Nuevosur). Cargo Fijo, Consumo Agua Potable, Servicio Alcantarillado, Tratamiento de Aguas Servidas + ajustes + IVA "Datos tributarios".',
  },
  detect(text) {
    return Boolean(text) && ESSBIO_DETECT_REGEX.test(text)
  },
  parse: parseEssbio,
}
