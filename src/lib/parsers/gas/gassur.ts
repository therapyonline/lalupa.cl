/**
 * Parser de Gas Sur S.A.
 *
 * Distribuidora de gas natural por red en zonas sur (Bío Bío,
 * Concepción). Layout aún más simplificado que Gasvalpo:
 *   - "DETALLE DE SU CUENTA" con columnas CONSUMO / VALOR NETO / IVA /
 *     TOTAL MES sin desagregación de cargo fijo.
 *   - Tarifa con nombre comercial "PRECIO LISTA" (no código BC-XX).
 *   - Factor de corrección visible (típicamente ~1,03).
 *   - Poder calorífico declarado: "PCS nom 9.300 kcal/M3N".
 *
 * Verificado contra factura real Hospital Naval Talcahuano (oct/dic
 * 2017, 20 m³ corregidos).
 */

import { ParserError } from '../errors'
import {
  buildCargoPattern,
  extractCargosFromPatterns,
  extractConsumo,
  extractFechaEmision,
  extractFechaVencimiento,
  extractNumeroCliente,
  extractPeriodo,
  extractTotal,
} from '../_helpers'
import type { ParsedBoleta, ParserModule } from '../types'

const GAS_SUR_KEYWORDS = [
  'Gas Sur',
  'GAS SUR S.A.',
  'GAS SUR',
  'gassur.cl',
]

const GAS_SUR_DETECT_REGEX = /\bGas\s+Sur\b|GASSUR|gassur\.cl/i
const GAS_SUR_MARKERS_REGEX = GAS_SUR_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bMetrogas\b|96\.7[27]2\.460-K|\bLipigas\b|96\.928\.510-K|\bAbastible\b|91\.806\.000-6|GASCO\s+GLP|96\.568\.740-8|\bGasvalpo\b)/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    // Línea única "CONSUMO" agrupa cargo fijo + variable. Sin desglose.
    concepto: 'Consumo de gas',
    pattern: buildCargoPattern('CONSUMO(?!\\s*\\w)'),
  },
]

export function parseGasSur(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!GAS_SUR_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Gas Sur. Detectamos marcadores de otra empresa de gas.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Gas Sur?',
    )
  }

  const fechaEmision = extractFechaEmision(text)
  const periodo = extractPeriodo(text, fechaEmision?.getFullYear())
  const consumo = {
    unidad: 'm3' as const,
    valor: extractConsumo(text, 'm3'),
    // Gas Sur usa "PRECIO LISTA" como nombre comercial en lugar de
    // código tarifario BC-XX.
    tarifa: text.match(/PRECIO\s+LISTA/i)?.[0]?.trim(),
  }

  const cargos = extractCargosFromPatterns(text, CARGO_PATTERNS)

  const total = extractTotal(text)
  const ivaMatch = text.match(/I\.?V\.?A\.?\s*[\s$:]*([\d.,]+)/i)
  const iva = ivaMatch
    ? parseInt(ivaMatch[1].replace(/\./g, '').replace(',', '.'), 10) || 0
    : 0

  return {
    empresa: 'Gas Sur',
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

export const gasSurParser: ParserModule = {
  empresa: 'Gas Sur',
  servicio: 'gas',
  fingerprint: {
    keywords: GAS_SUR_KEYWORDS,
    format:
      'Gas Sur: layout sur de Chile con tabla "DETALLE DE SU CUENTA" simplificada. Una sola línea CONSUMO sin desglose, tarifa con nombre comercial "PRECIO LISTA".',
  },
  detect(text) {
    return Boolean(text) && GAS_SUR_DETECT_REGEX.test(text)
  },
  parse: parseGasSur,
}
