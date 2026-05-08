/**
 * Parser de Gasco GLP (cilindros).
 *
 * tipoVenta: 'producto' — venta directa de cilindros GLP, sin medidor ni
 * período facturado. La unidad de "consumo" son cilindros (kg).
 */

import { ParserError } from '../errors'
import {
  CL_NUMBER,
  buildCargoPattern,
  extractCargosFromPatterns,
  extractFechaEmision,
  extractNumeroCliente,
  parseChileanNumber,
} from '../_helpers'
import type { ParsedBoleta, ParserModule } from '../types'

const GASCO_KEYWORDS = [
  'GASCO GLP S.A.',
  'Gasco GLP',
  'Gasco S.A.',
  'gasco.cl',
  '96.568.740-8',
  'Santo Domingo 1061',
]

const GASCO_DETECT_REGEX = /Gasco\s+GLP|Gasco\s+S\.A\.|gasco\.cl|96\.568\.740-8/i
const GASCO_MARKERS_REGEX = GASCO_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bMetrogas\b|96\.722\.460-K|\bLipigas\b|96\.928\.510-K|\bAbastible\b|91\.806\.000-6)/i

const TOTAL_REGEX = new RegExp(
  `(?:Total\\s+a\\s+pagar|Total\\s+Boleta)\\s*\\$?\\s*${CL_NUMBER}`,
  'i',
)

const IVA_REGEX = new RegExp(`IVA(?:\\s*19\\s*%)?\\s*\\$?\\s*${CL_NUMBER}`, 'i')

const CILINDRO_REGEX = /(\d{1,2})\s*kg/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    concepto: 'Cilindro Gas Licuado',
    pattern: buildCargoPattern('Cilindro\\s+Gas\\s+Licuado\\s+\\d+\\s*kg'),
  },
  {
    concepto: 'Cargo por cambio de cilindro',
    pattern: buildCargoPattern('Cargo\\s+por\\s+cambio\\s+de\\s+cilindro'),
  },
  {
    concepto: 'Recargo de delivery',
    pattern: buildCargoPattern('Recargo\\s+(?:de\\s+)?delivery'),
  },
  { concepto: 'IVA 19%', pattern: buildCargoPattern('IVA(?:\\s*19\\s*%)?') },
]

export function parseGasco(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!GASCO_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Gasco GLP. Detectamos marcadores de otra empresa de gas.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Gasco GLP?',
    )
  }

  const fechaEmision = extractFechaEmision(text)
  const cilindroKgMatch = text.match(CILINDRO_REGEX)
  const cilindroKg = cilindroKgMatch ? parseChileanNumber(cilindroKgMatch[1]) : 0

  const cargos = extractCargosFromPatterns(text, CARGO_PATTERNS)
  if (cargos.find((c) => c.concepto === 'Recargo de delivery')) {
    const cargo = cargos.find((c) => c.concepto === 'Recargo de delivery')!
    cargo.sospechoso = true
    cargo.razonSospecha =
      'Recargo de delivery extraordinario — no es un cargo estándar. Pedí desglose y compará con el precio publicado en gasco.cl para tu zona.'
  }

  const totalMatch = text.match(TOTAL_REGEX)
  const total = totalMatch ? parseChileanNumber(totalMatch[1]) : 0
  const ivaMatch = text.match(IVA_REGEX)
  const iva =
    (ivaMatch ? parseChileanNumber(ivaMatch[1]) : 0) ||
    cargos.find((c) => c.concepto === 'IVA 19%')?.monto ||
    0

  return {
    empresa: 'Gasco GLP',
    servicio: 'gas',
    tipoVenta: 'producto',
    periodo: {
      desde: fechaEmision ?? new Date(NaN),
      hasta: fechaEmision ?? new Date(NaN),
    },
    cliente: { numeroCliente: extractNumeroCliente(text) },
    consumo: {
      unidad: 'kg',
      valor: cilindroKg,
    },
    cargos,
    totales: {
      subtotal: Number.isFinite(total - iva) ? total - iva : 0,
      iva: Number.isFinite(iva) ? iva : 0,
      total: Number.isFinite(total) ? total : 0,
    },
    fechaEmision,
    raw: text,
  }
}

export const gascoParser: ParserModule = {
  empresa: 'Gasco GLP',
  servicio: 'gas',
  fingerprint: {
    keywords: GASCO_KEYWORDS,
    format:
      'Gasco GLP: cilindros (tipoVenta=producto). Detalle: 1 cilindro Gas Licuado X kg, IVA 19%, Total Boleta = Total a pagar.',
  },
  detect(text) {
    return Boolean(text) && GASCO_DETECT_REGEX.test(text)
  },
  parse: parseGasco,
}
