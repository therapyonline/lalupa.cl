/**
 * Parser de Frontel (Empresa Eléctrica de la Frontera S.A.).
 *
 * SAESA y Frontel comparten template (Grupo SAESA), por eso
 * `parseSaesaFamily` está en `_saesa-family.ts` y se reusa.
 */

import type { ParsedBoleta, ParserModule } from '../types'
import { parseSaesaFamily } from './_saesa-family'

const FRONTEL_KEYWORDS = [
  'EMPRESA ELÉCTRICA DE LA FRONTERA S.A.',
  'Empresa Eléctrica de la Frontera',
  'Frontel',
  'gruposaesa.cl/frontel',
  '76.073.164-1',
  'Bilbao 441, Osorno',
]

const FRONTEL_DETECT_REGEX =
  /Empresa\s+El[ée]ctrica\s+de\s+la\s+Frontera|gruposaesa\.cl\/frontel|\bFrontel\b/i

const FRONTEL_MARKERS_REGEX =
  /(Empresa\s+El[ée]ctrica\s+de\s+la\s+Frontera|76\.073\.164-1|gruposaesa\.cl\/frontel|\bFrontel\b)/i

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bCGE\b|99\.513\.400-4|Compa[ñn][ií]a\s+General\s+de\s+Electricidad|Enel\s+Distribuci[óo]n|96\.800\.570-7|Chilquinta\s+(?:Energ[íi]a|Distribuci[óo]n)|96\.813\.520-1|Sociedad\s+Austral\s+de\s+Electricidad|96\.544\.470-3)/i

export function parseFrontel(text: string): ParsedBoleta {
  return parseSaesaFamily(text, {
    empresa: 'Frontel',
    markersRegex: FRONTEL_MARKERS_REGEX,
    otherEmpresaMarkersRegex: OTHER_EMPRESA_MARKERS_REGEX,
  })
}

export const frontelParser: ParserModule = {
  empresa: 'Frontel',
  servicio: 'electricidad',
  fingerprint: {
    keywords: FRONTEL_KEYWORDS,
    format:
      'Frontel: layout idéntico a SAESA (mismo grupo) — "Detalle de mi cuenta" con 5 cargos + Total exento/neto/IVA/Boleta/Saldo/Total a pagar.',
  },
  detect(text) {
    return Boolean(text) && FRONTEL_DETECT_REGEX.test(text)
  },
  parse: parseFrontel,
}
