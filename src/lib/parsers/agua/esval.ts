/**
 * Parser de Esval S.A.
 *
 * Layout propio (V Región): "DETALLE DE FACTURACIÓN" tabular con
 * Cargo Fijo, Consumo Agua, Recolección, Tratamiento.
 */

import { ParserError } from '../errors'
import {
  CL_NUMBER,
  buildCargoPattern,
  extractCargosFromPatterns,
  extractConsumo,
  extractFechaEmision,
  extractFechaVencimiento,
  parseChileanDate,
  parseChileanNumber,
} from '../_helpers'
import type { Cargo, ParsedBoleta, ParserModule } from '../types'

const ESVAL_KEYWORDS = [
  'Esval S.A.',
  'Esval',
  'esval.cl',
  '76.000.739-0',
  '76.000.957-1',
  '90.158.000-3',
  'Cochrane 751, Valparaíso',
]

const ESVAL_DETECT_REGEX = /\bEsval\b|esval\.cl|76\.000\.739-0|76\.000\.957-1/i
const ESVAL_MARKERS_REGEX = ESVAL_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(AGUAS\s+ANDINAS\s+S\.A\.|aguasandinas\.cl|61\.808\.000-5|\bESSBio\b|76\.833\.300-9|\bNuevosur\b|96\.963\.440-6|\bSMAPA\b|smapa\.cl)/i

const FECHAS_LECTURA_REGEX =
  /Actual\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+Anterior\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i

const TOTAL_REGEX = new RegExp(
  `(?:TOTAL\\s+A\\s+PAGAR|Monto\\s+Total)\\s*\\$?\\s*${CL_NUMBER}`,
  'i',
)

const IVA_REGEX = new RegExp(`Monto\\s+IVA\\s*\\$?\\s*${CL_NUMBER}`, 'i')

const NUMERO_CLIENTE_REGEX =
  /N[úu]mero\s+de\s+Cliente[\s:]*([\w\d.-]+)/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  { concepto: 'Cargo fijo', pattern: buildCargoPattern('Cargo\\s+Fijo') },
  {
    concepto: 'Consumo agua',
    pattern: buildCargoPattern('Consumo\\s+Agua\\s+\\d+,\\d+\\s*m3'),
  },
  {
    concepto: 'Recolección',
    pattern: buildCargoPattern('Recolecci[óo]n\\s+\\d+,\\d+\\s*m3'),
  },
  {
    concepto: 'Tratamiento',
    pattern: buildCargoPattern('Tratamiento\\s+\\d+,\\d+\\s*m3'),
  },
  {
    concepto: 'Subsidio agua potable',
    pattern: buildCargoPattern('Subsidio\\s*\\(\\s*\\d'),
  },
  {
    concepto: 'Reposición',
    pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?'),
  },
]

const REPOSICION_CONTEXTO_REGEX = /(corte|suspensi[óo]n|reposici[óo]n)/i

function detectarSospecha(cargo: Cargo, text: string): string | null {
  if (cargo.concepto === 'Reposición' && !REPOSICION_CONTEXTO_REGEX.test(text)) {
    return 'Reposición sin que la boleta mencione un corte. Pide desglose.'
  }
  return null
}

export function parseEsval(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!ESVAL_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Esval. Detectamos marcadores de otra sanitaria.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Esval?',
    )
  }

  const lectMatch = text.match(FECHAS_LECTURA_REGEX)
  const desde = lectMatch ? parseChileanDate(lectMatch[2]) ?? new Date(NaN) : new Date(NaN)
  const hasta = lectMatch ? parseChileanDate(lectMatch[1]) ?? new Date(NaN) : new Date(NaN)

  const consumo = {
    unidad: 'm3' as const,
    valor: extractConsumo(text, 'm3'),
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
    empresa: 'Esval',
    servicio: 'agua',
    periodo: { desde, hasta },
    cliente: {
      numeroCliente: text.match(NUMERO_CLIENTE_REGEX)?.[1]?.trim(),
    },
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

export const esvalParser: ParserModule = {
  empresa: 'Esval',
  servicio: 'agua',
  fingerprint: {
    keywords: ESVAL_KEYWORDS,
    format:
      'Esval: layout V Región tabular, DETALLE DE FACTURACIÓN con Cargo Fijo, Consumo Agua, Recolección, Tratamiento, Subtotal, Subsidio. IVA explícito en bloque "EL IVA MES DE ESTA BOLETA".',
  },
  detect(text) {
    return Boolean(text) && ESVAL_DETECT_REGEX.test(text)
  },
  parse: parseEsval,
}
