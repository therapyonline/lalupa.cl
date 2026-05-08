/**
 * Parser de Abastible (gas por red, medidor).
 *
 * El fixture trae layout de medidor — para clientes con conexión por red.
 * (Abastible también vende cilindros pero usa otra boleta — pendiente).
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

const ABASTIBLE_KEYWORDS = [
  'ABASTIBLE S.A.',
  'Abastible S.A.',
  'Abastible',
  'abastible.cl',
  '91.806.000-6',
]

const ABASTIBLE_DETECT_REGEX = /\bAbastible\b|abastible\.cl|91\.806\.000-6/i
const ABASTIBLE_MARKERS_REGEX = ABASTIBLE_DETECT_REGEX

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bMetrogas\b|96\.722\.460-K|\bLipigas\b|96\.928\.510-K|GASCO\s+GLP|96\.568\.740-8)/i

const TARIFA_REGEX = /Tarifa\s+contratada\s*:?\s*([A-Z]{2,5}\d{0,3}[A-Z]?)/i

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
    concepto: 'Descuento por consumo',
    pattern: buildCargoPattern('Descuento\\s+por\\s+Consumo'),
  },
  {
    concepto: 'Aporte fondo de gas (mes anterior)',
    pattern: buildCargoPattern(
      'Aporte\\s+para\\s+fondo\\s+de\\s+gas\\s+en\\s+electric\\.?\\s+mes\\s+anterior',
    ),
  },
  {
    concepto: 'Aporte fondo de gas (mes actual)',
    pattern: buildCargoPattern(
      'Aporte\\s+para\\s+fondo\\s+de\\s+gas\\s+en\\s+electric\\.?\\s+mes\\s+actual',
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

export function parseAbastible(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!ABASTIBLE_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Abastible. Detectamos marcadores de otra empresa de gas.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Abastible?',
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
  const iva = extractIVA(text)

  return {
    empresa: 'Abastible',
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

export const abastibleParser: ParserModule = {
  empresa: 'Abastible',
  servicio: 'gas',
  fingerprint: {
    keywords: ABASTIBLE_KEYWORDS,
    format:
      'Abastible: gas por red (medidor). Detalle de mi cuenta → Servicio de gas con Gas consumido + Administración + Descuento por Consumo + Aportes fondo de gas. Total a pagar.',
  },
  detect(text) {
    return Boolean(text) && ABASTIBLE_DETECT_REGEX.test(text)
  },
  parse: parseAbastible,
}
