/**
 * Parser de SMAPA (Servicio Municipal de Agua Potable y Alcantarillado de Maipú).
 *
 * Layout municipal — distinto a las sanitarias privadas. "DETALLE DE SU
 * CUENTA" con Cargo Fijo, Consumo Agua, Alcantarillado S/Trata, y
 * TRATAM.AGUAS ANDINAS (SMAPA contrata el tratamiento a Aguas Andinas).
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
  parseChileanDate,
  parseChileanNumber,
} from '../_helpers'
import type { Cargo, ParsedBoleta, ParserModule } from '../types'

const SMAPA_KEYWORDS = [
  'SMAPA',
  'Servicio Municipal de Agua Potable y Alcantarillado',
  'smapa.cl',
  'Av. Pajaritos 0240',
  'Municipalidad de Maipú',
  'I. Municipalidad de Maipú',
  'Maipú',
]

const SMAPA_DETECT_REGEX =
  /\bSMAPA\b|Servicio\s+Municipal\s+de\s+Agua\s+Potable|smapa\.cl/i
const SMAPA_MARKERS_REGEX = SMAPA_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bEsval\b|76\.000\.739-0|\bESSBio\b|76\.833\.300-9|\bNuevosur\b|96\.963\.440-6)/i

const TOTAL_REGEX = new RegExp(
  `Total\\s+a\\s+pagar\\s*\\$?\\s*${CL_NUMBER}`,
  'i',
)

const IVA_REGEX = new RegExp(
  `IVA\\s+de\\s+este\\s+documento\\s+es\\s+de\\s*:?\\s*\\$?\\s*${CL_NUMBER}`,
  'i',
)

const LECTURA_ACTUAL_REGEX =
  /Lectura\s+Actual\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
const LECTURA_ANTERIOR_REGEX =
  /Lectura\s+Anterior\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    concepto: 'Cargo fijo',
    pattern: buildCargoPattern('Cargo\\s+Fijo(?:\\s*\\(\\s*\\d+\\s*CU\\))?'),
  },
  {
    concepto: 'Consumo agua',
    pattern: buildCargoPattern('Consumo\\s+Agua(?:\\s*\\(\\d+\\s*M3\\))?'),
  },
  {
    concepto: 'Alcantarillado',
    pattern: buildCargoPattern(
      'Alcantarillado\\s*S/Trata(?:\\s*\\(\\d+\\s*M3\\))?',
    ),
  },
  {
    concepto: 'Tratamiento Aguas Andinas',
    pattern: buildCargoPattern(
      'TRATAM\\.\\s*AGUAS\\s+ANDINAS(?:\\s*\\(\\d+\\s*M3\\))?',
    ),
  },
  {
    concepto: 'Reposición',
    pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?'),
  },
]

const REPOSICION_CONTEXTO_REGEX = /(corte|suspensi[óo]n|reposici[óo]n)/i

function detectarSospecha(cargo: Cargo, text: string): string | null {
  if (cargo.concepto === 'Reposición' && !REPOSICION_CONTEXTO_REGEX.test(text)) {
    return 'Reposición sin que la boleta mencione un corte. Pedí desglose.'
  }
  return null
}

export function parseSmapa(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!SMAPA_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de SMAPA. Detectamos marcadores de otra sanitaria.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de SMAPA?',
    )
  }

  const desde =
    parseChileanDate(text.match(LECTURA_ANTERIOR_REGEX)?.[1] ?? '') ??
    new Date(NaN)
  const hasta =
    parseChileanDate(text.match(LECTURA_ACTUAL_REGEX)?.[1] ?? '') ??
    new Date(NaN)

  // En SMAPA "Lectura Actual 1.016 M3" aparece antes que "Consumo Total
  // 11,00 M3"; buscamos la línea "Consumo Total" específicamente para no
  // confundir lectura con consumo del período.
  const consumoTotalMatch = text.match(
    /Consumo\s+Total\s*\+?\s*(\d+(?:,\d+)?)\s*M3/i,
  )
  const consumoTotal = consumoTotalMatch
    ? parseChileanNumber(consumoTotalMatch[1])
    : 0
  const consumo = {
    unidad: 'm3' as const,
    valor:
      Number.isFinite(consumoTotal) && consumoTotal > 0
        ? consumoTotal
        : extractConsumo(text, 'm3'),
  }

  const cargos = extractCargosFromPatterns(text, CARGO_PATTERNS)
  for (const cargo of cargos) {
    const razon = detectarSospecha(cargo, text)
    if (razon) {
      cargo.sospechoso = true
      cargo.razonSospecha = razon
    }
  }

  const totalMatch = text.match(TOTAL_REGEX)
  const total = totalMatch ? parseChileanNumber(totalMatch[1]) : 0
  const ivaMatch = text.match(IVA_REGEX)
  const iva = ivaMatch ? parseChileanNumber(ivaMatch[1]) : 0

  return {
    empresa: 'SMAPA',
    servicio: 'agua',
    periodo: { desde, hasta },
    cliente: { numeroCliente: extractNumeroCliente(text) },
    consumo,
    cargos,
    totales: {
      subtotal: Number.isFinite(total - iva) ? total - iva : 0,
      iva: Number.isFinite(iva) ? iva : 0,
      total: Number.isFinite(total) ? total : 0,
    },
    fechaEmision: extractFechaEmision(text),
    fechaVencimiento: extractFechaVencimiento(text),
    raw: text,
  }
}

export const smapaParser: ParserModule = {
  empresa: 'SMAPA',
  servicio: 'agua',
  fingerprint: {
    keywords: SMAPA_KEYWORDS,
    format:
      'SMAPA Maipú: layout municipal con DETALLE DE SU CUENTA (Cargo Fijo, Consumo Agua, Alcantarillado S/Trata, TRATAM.AGUAS ANDINAS contratado), El IVA aparece como línea separada en DETALLE DE SERVICIO.',
  },
  detect(text) {
    return Boolean(text) && SMAPA_DETECT_REGEX.test(text)
  },
  parse: parseSmapa,
}
