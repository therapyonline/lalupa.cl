/**
 * Parser de Lipigas (gas por red, medidor).
 *
 * Layout: "Detalle de mi cuenta" → "Servicio de Gas" con Gas consumido,
 * Administración del servicio, Arriendo Medidor, Otros, Subtotal, Saldo
 * anterior, IVA 19%, Total a pagar.
 */

import { ParserError } from '../errors'
import {
  buildCargoPattern,
  extractCargosFromPatterns,
  extractConsumo,
  extractFechaEmision,
  extractFechaVencimiento,
  extractIVA,
  extractNumeroCliente,
  extractPeriodo,
  extractTotal,
} from '../_helpers'
import type { Cargo, ParsedBoleta, ParserModule } from '../types'

const LIPIGAS_KEYWORDS = [
  'Empresas Lipigas S.A.',
  'Lipigas',
  'lipigas.cl',
  '96.928.510-K',
]

const LIPIGAS_DETECT_REGEX = /\bLipigas\b|lipigas\.cl|96\.928\.510-K/i
const LIPIGAS_MARKERS_REGEX = LIPIGAS_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bMetrogas\b|96\.722\.460-K|\bAbastible\b|91\.806\.000-6|GASCO\s+GLP|96\.568\.740-8|\bGasvalpo\b|gasvalpo\.cl|\bGas\s+Sur\b|GASSUR)/i

const TARIFA_REGEX = /Tarifa\s*:?\s*([A-Z]{2,5}\d{0,3}[A-Z]?|[Gg]as\s+[A-Za-z]+)/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    concepto: 'Gas consumido',
    pattern: buildCargoPattern('Gas\\s+consumido(?:\\s*\\([^)]*\\))?'),
  },
  {
    concepto: 'Administración del servicio',
    pattern: buildCargoPattern(
      'Administraci[óo]n\\s+del\\s+servicio(?:\\s*\\(Cargo\\s+Fijo\\))?',
    ),
  },
  {
    concepto: 'Arriendo medidor',
    pattern: buildCargoPattern('Arriendo\\s+Medidor'),
  },
  {
    concepto: 'Reposición',
    pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?'),
  },
  {
    concepto: 'Recargo por mora',
    pattern: buildCargoPattern('Recargo\\s+por\\s+mora'),
  },
  { concepto: 'IVA 19%', pattern: buildCargoPattern('IVA(?:\\s*19\\s*%)?') },
]

const REPOSICION_CONTEXTO_REGEX = /(corte|suspensi[óo]n|reposici[óo]n)/i

function detectarSospecha(cargo: Cargo, text: string): string | null {
  if (cargo.concepto === 'Reposición' && !REPOSICION_CONTEXTO_REGEX.test(text)) {
    return 'Reposición sin que la boleta mencione un corte. Pide desglose.'
  }
  return null
}

export function parseLipigas(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!LIPIGAS_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Lipigas. Detectamos marcadores de otra empresa de gas.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Lipigas?',
    )
  }

  const fechaEmision = extractFechaEmision(text)
  const periodo = extractPeriodo(text, fechaEmision?.getFullYear())

  const consumo = {
    unidad: 'm3' as const,
    valor: extractConsumo(text, 'm3'),
    tarifa: text.match(TARIFA_REGEX)?.[1]?.trim(),
  }

  const cargos = extractCargosFromPatterns(text, CARGO_PATTERNS)
  for (const cargo of cargos) {
    const razon = detectarSospecha(cargo, text)
    if (razon) {
      cargo.sospechoso = true
      cargo.razonSospecha = razon
    }
  }

  const total = extractTotal(text)
  const iva =
    extractIVA(text) ||
    cargos.find((c) => c.concepto === 'IVA 19%')?.monto ||
    0

  return {
    empresa: 'Lipigas',
    servicio: 'gas',
    periodo,
    cliente: { numeroCliente: extractNumeroCliente(text) },
    consumo,
    cargos,
    totales: {
      subtotal: Number.isFinite(total - iva) ? total - iva : 0,
      iva: Number.isFinite(iva) ? iva : 0,
      total: Number.isFinite(total) ? total : 0,
    },
    fechaEmision,
    fechaVencimiento: extractFechaVencimiento(text),
    raw: text,
  }
}

export const lipigasParser: ParserModule = {
  empresa: 'Lipigas',
  servicio: 'gas',
  fingerprint: {
    keywords: LIPIGAS_KEYWORDS,
    format:
      'Lipigas: gas por red (medidor). Detalle de mi cuenta → Servicio de Gas con Gas consumido + Administración + Arriendo Medidor + Subtotal + IVA 19% + Total a pagar.',
  },
  detect(text) {
    return Boolean(text) && LIPIGAS_DETECT_REGEX.test(text)
  },
  parse: parseLipigas,
}
