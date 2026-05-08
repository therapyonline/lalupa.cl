/**
 * Parser de SAESA (Sociedad Austral de Electricidad S.A.).
 *
 * SAESA y Frontel comparten template (Grupo SAESA), por eso
 * `parseSaesaFamily` está en `_saesa-family.ts` y se reusa.
 */

import type { ParsedBoleta, ParserModule } from '../types'
import { parseSaesaFamily } from './_saesa-family'

const SAESA_KEYWORDS = [
  'SOCIEDAD AUSTRAL DE ELECTRICIDAD S.A.',
  'Sociedad Austral de Electricidad',
  'SAESA',
  'gruposaesa.cl',
  '96.544.470-3',
  'Bilbao 441, Osorno',
]

const SAESA_DETECT_REGEX =
  /Sociedad\s+Austral\s+de\s+Electricidad|gruposaesa\.cl\/saesa|\bSAESA\b/i

const SAESA_MARKERS_REGEX =
  /(Sociedad\s+Austral\s+de\s+Electricidad|96\.544\.470-3|gruposaesa\.cl\/saesa|\bSAESA\b)/i

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bCGE\b|99\.513\.400-4|Compa[ñn][ií]a\s+General\s+de\s+Electricidad|Enel\s+Distribuci[óo]n|96\.800\.570-7|Chilquinta\s+(?:Energ[íi]a|Distribuci[óo]n)|96\.813\.520-1|Empresa\s+El[ée]ctrica\s+de\s+la\s+Frontera|76\.073\.164-1)/i

export function parseSaesa(text: string): ParsedBoleta {
  return parseSaesaFamily(text, {
    empresa: 'SAESA',
    markersRegex: SAESA_MARKERS_REGEX,
    otherEmpresaMarkersRegex: OTHER_EMPRESA_MARKERS_REGEX,
  })
}

export const saesaParser: ParserModule = {
  empresa: 'SAESA',
  servicio: 'electricidad',
  fingerprint: {
    keywords: SAESA_KEYWORDS,
    format:
      'SAESA: layout Grupo SAESA, header + "Detalle de mi cuenta" con 5 cargos (Administración, Electricidad consumida X kWh, Coordinación y transporte, Cargo por servicio público, Cargo por compras de potencia) + Total exento + Total neto + IVA 19% + Total Boleta + Saldo anterior + Total a pagar.',
  },
  detect(text) {
    return Boolean(text) && SAESA_DETECT_REGEX.test(text)
  },
  parse: parseSaesa,
}
