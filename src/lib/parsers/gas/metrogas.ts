/**
 * Parser de Metrogas (gas natural por red, RM).
 *
 * Layout: período "07 Junio - 06 Agosto" (sin año explícito; usa fecha de
 * emisión como referencia). Cargos: Gas consumido (X m³s), créditos por
 * reliquidación, Administración del servicio (Cargo Fijo), Arriendo
 * Medidor. IVA aparece como nota en "Total Boleta (El IVA de esta Boleta
 * es $X)".
 */

import { ParserError } from '../errors'
import {
  CL_NUMBER,
  buildCargoPattern,
  extractCargosFromPatterns,
  extractConsumo,
  extractFechaEmision,
  extractFechaVencimiento,
  extractNumeroCliente,
  extractPeriodo,
  extractTotal,
  parseChileanNumber,
} from '../_helpers'
import type { Cargo, ParsedBoleta, ParserModule } from '../types'

const METROGAS_KEYWORDS = [
  'Metrogas S.A.',
  'Metrogas',
  'metrogas.cl',
  '96.722.460-K',
]

const METROGAS_DETECT_REGEX = /\bMetrogas\b|metrogas\.cl|96\.722\.460-K/i
const METROGAS_MARKERS_REGEX = METROGAS_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bLipigas\b|96\.928\.510-K|\bAbastible\b|91\.806\.000-6|GASCO\s+GLP|96\.568\.740-8)/i

const TARIFA_REGEX =
  /Tipo\s+de\s+tarifa\s+contratada\s*:?\s*([A-Z]{2,5}\d{0,3}[A-Z]?)/i

const IVA_NOTE_REGEX = new RegExp(`IVA\\s+de\\s+esta\\s+Boleta\\s+es\\s+\\$\\s*${CL_NUMBER}`, 'i')

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    concepto: 'Gas consumido',
    pattern: buildCargoPattern('Gas\\s+consumido(?:\\s*\\([^)]*\\))?'),
  },
  {
    concepto: 'Crédito consumo equivalente reliquidado',
    pattern: buildCargoPattern(
      'Cr[ée]dito\\s+Consumo\\s+Equivalente\\s+Reliquidado(?:\\s*\\([^)]*\\))?',
    ),
  },
  {
    concepto: 'Administración del servicio',
    pattern: buildCargoPattern(
      'Administraci[óo]n\\s+del\\s+servicio(?:\\s*\\(Cargo\\s+Fijo\\))?',
    ),
  },
  {
    concepto: 'Arriendo medidor',
    pattern: buildCargoPattern('Arriendo\\s+Medidor(?!\\s+por\\s+Reliquidaci[óo]n)'),
  },
  {
    concepto: 'Crédito arriendo medidor por reliquidación',
    pattern: buildCargoPattern(
      'Cr[ée]dito\\s+Arriendo\\s+Medidor\\s+por\\s+Reliquidaci[óo]n',
    ),
  },
  {
    concepto: 'Reliquidación de consumo',
    pattern: buildCargoPattern(
      'Cuota\\s+\\d+\\s+de\\s+\\d+\\s+Cuota\\s+Reliquidaci[óo]n',
    ),
  },
  {
    concepto: 'Ajuste por no registro de lectura',
    pattern: buildCargoPattern(
      'Ajuste\\s+(?:cargo\\s+)?(?:por\\s+)?no\\s+registro\\s+(?:de\\s+)?[Ll]ectura(?:\\s+anterior(?:es)?)?',
    ),
  },
  {
    concepto: 'Reposición',
    pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?'),
  },
  {
    concepto: 'Recargo por mora',
    pattern: buildCargoPattern('Recargo\\s+por\\s+mora'),
  },
]

const REPOSICION_CONTEXTO_REGEX = /(corte|suspensi[óo]n|reposici[óo]n)/i

function detectarSospecha(cargo: Cargo, text: string): string | null {
  if (cargo.concepto === 'Reposición' && !REPOSICION_CONTEXTO_REGEX.test(text)) {
    return 'Reposición sin que la boleta mencione un corte. Pide desglose.'
  }
  if (cargo.concepto === 'Ajuste por no registro de lectura') {
    return 'Metrogas no registró tu medidor (consumo estimado). Tienes derecho a pedir relectura sin costo.'
  }
  if (cargo.concepto === 'Reliquidación de consumo' && cargo.monto > 0) {
    return 'Cuota de reliquidación de un período anterior. Pide a Metrogas el detalle del período reliquidado y por qué (lectura corregida, ajuste tarifario, etc.).'
  }
  if (
    cargo.concepto === 'Crédito consumo equivalente reliquidado' &&
    cargo.monto > 0
  ) {
    // Un crédito debería ser negativo. Si aparece positivo, la facturación
    // está mal y el usuario debería revisarlo.
    return 'Un crédito reliquidado debería figurar como negativo. Si aparece positivo, pide a Metrogas que revise la facturación.'
  }
  return null
}

export function parseMetrogas(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!METROGAS_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Metrogas. Detectamos marcadores de otra empresa de gas.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Metrogas?',
    )
  }

  // Período "07 Junio - 06 Agosto" sin año, usar año de fecha emisión.
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
  // IVA en Metrogas viene como nota inline "El IVA de esta Boleta es $X"
  const ivaNoteMatch = text.match(IVA_NOTE_REGEX)
  const iva = ivaNoteMatch ? parseChileanNumber(ivaNoteMatch[1]) : 0

  return {
    empresa: 'Metrogas',
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

export const metrogasParser: ParserModule = {
  empresa: 'Metrogas',
  servicio: 'gas',
  fingerprint: {
    keywords: METROGAS_KEYWORDS,
    format:
      'Metrogas: gas natural por red. Servicio de Gas con Gas consumido + créditos + Administración + Arriendo Medidor. IVA inline en "Total Boleta (El IVA de esta Boleta es $X)".',
  },
  detect(text) {
    return Boolean(text) && METROGAS_DETECT_REGEX.test(text)
  },
  parse: parseMetrogas,
}
