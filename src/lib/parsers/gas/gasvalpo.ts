/**
 * Parser de Gasvalpo (Gas Valparaíso S.A., grupo Energas).
 *
 * Distribuidora de gas natural por red en la V Región y zonas
 * cercanas. Layout simplificado vs Metrogas Santiago:
 *   - Una sola línea "GAS NATURAL" con el monto bruto (sin desagregar
 *     cargo fijo + cargo variable).
 *   - Tabla de medición horizontal con columnas Lectura Actual /
 *     Anterior / Leído / Factor / Corregido.
 *   - Cargos extra: "INTERES PAGO FUERA PLAZO", "SALDO ANTERIOR",
 *     "AJUSTE SENCILLO AL MES ANTERIOR" + "AJUSTE SENCILLO DEL MES".
 *   - Bloque tributario: "TOTAL NETO", "19% I.V.A.", "VALOR TOTAL".
 *
 * Verificado contra factura real Instituto Hidrográfico Armada
 * (Valparaíso, mayo 2017, 949 m³ corregidos).
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
import type { Cargo, ParsedBoleta, ParserModule } from '../types'

const GASVALPO_KEYWORDS = [
  'Gasvalpo',
  'Gas Valparaíso',
  'Gas Valparaiso',
  'GASVALPO',
  'gasvalpo.cl',
  'energas.cl',
]

const GASVALPO_DETECT_REGEX =
  /\bGasvalpo\b|Gas\s+Valpara[íi]so|gasvalpo\.cl|energas\.cl/i
const GASVALPO_MARKERS_REGEX = GASVALPO_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bMetrogas\b|96\.7[27]2\.460-K|\bLipigas\b|96\.928\.510-K|\bAbastible\b|91\.806\.000-6|GASCO\s+GLP|96\.568\.740-8|Gas\s+Sur\s+S\.?A)/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    // Línea única que agrupa cargo fijo + consumo + cargos varios.
    // Distinto de Metrogas que separa. Negative lookahead para no
    // confundir con "GAS NATURAL POR RED" en encabezados.
    concepto: 'Gas natural',
    pattern: buildCargoPattern('GAS\\s+NATURAL(?!\\s+POR)'),
  },
  {
    concepto: 'Interés pago fuera de plazo',
    pattern: buildCargoPattern(
      'INTERES\\s+PAGO\\s+FUERA\\s+(?:DE\\s+)?PLAZO',
    ),
  },
  {
    concepto: 'Saldo anterior',
    pattern: buildCargoPattern('SALDO\\s+ANTERIOR'),
  },
  {
    concepto: 'Ajuste sencillo mes anterior',
    pattern: buildCargoPattern(
      'AJUSTE\\s+SENCILLO\\s+(?:AL\\s+)?MES\\s+ANTERIOR',
    ),
  },
  {
    concepto: 'Ajuste sencillo del mes',
    pattern: buildCargoPattern(
      'AJUSTE\\s+SENCILLO\\s+(?:DEL\\s+)?MES(?!\\s+ANTERIOR)',
    ),
  },
]

export function parseGasvalpo(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!GASVALPO_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Gasvalpo. Detectamos marcadores de otra empresa de gas.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Gasvalpo?',
    )
  }

  const fechaEmision = extractFechaEmision(text)
  const periodo = extractPeriodo(text, fechaEmision?.getFullYear())
  const consumo = {
    unidad: 'm3' as const,
    valor: extractConsumo(text, 'm3'),
  }

  const cargos = extractCargosFromPatterns(text, CARGO_PATTERNS)
  for (const cargo of cargos) {
    const razon = detectarSospecha(cargo)
    if (razon) {
      cargo.sospechoso = true
      cargo.razonSospecha = razon
    }
  }

  const total = extractTotal(text)
  // Gasvalpo desglosa IVA en bloque "19% I.V.A. CLP X". Si extractIVA
  // genérico falla, fallback al bloque específico.
  const ivaMatch = text.match(/19\s*%\s+I\.?V\.?A\.?\s*[\s$:]*([\d.,]+)/i)
  const iva = ivaMatch
    ? parseInt(ivaMatch[1].replace(/\./g, '').replace(',', '.'), 10) || 0
    : 0

  return {
    empresa: 'Gasvalpo',
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

function detectarSospecha(cargo: Cargo): string | null {
  if (cargo.concepto === 'Interés pago fuera de plazo' && cargo.monto > 0) {
    return 'Interés por pago atrasado. Si discutes la mora con la empresa, pueden condonar el interés.'
  }
  return null
}

export const gasvalpoParser: ParserModule = {
  empresa: 'Gasvalpo',
  servicio: 'gas',
  fingerprint: {
    keywords: GASVALPO_KEYWORDS,
    format:
      'Gasvalpo: layout simplificado V Región. Una sola línea "GAS NATURAL" con monto bruto + tabla de medición horizontal + bloque tributario TOTAL NETO/IVA/VALOR TOTAL.',
  },
  detect(text) {
    return Boolean(text) && GASVALPO_DETECT_REGEX.test(text)
  },
  parse: parseGasvalpo,
}
