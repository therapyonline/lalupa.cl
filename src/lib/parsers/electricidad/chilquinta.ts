/**
 * Parser de Chilquinta Distribución S.A.
 *
 * Layout (ver `__fixtures__/chilquinta-real-2023-07.ts`):
 *   - "Detalle de mi cuenta" → "Servicio eléctrico (implica corte)"
 *   - 3 cargos: Administración, Electricidad consumida X kWh, Coordinación y transporte
 *   - Total exento + Total neto + IVA 19% + Total Boleta + Otros + Saldo anterior + Total a pagar
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

const CHILQUINTA_KEYWORDS = [
  'CHILQUINTA DISTRIBUCIÓN S.A.',
  'Chilquinta Energía',
  'Chilquinta Distribución',
  'chilquinta.cl',
  '96.813.520-1',
]

const CHILQUINTA_DETECT_REGEX =
  /Chilquinta\s+(?:Energ[íi]a|Distribuci[óo]n)|chilquinta\.cl/i

const CHILQUINTA_MARKERS_REGEX =
  /(Chilquinta\s+(?:Energ[íi]a|Distribuci[óo]n)|96\.813\.520-1|chilquinta\.cl)/i

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bCGE\b|99\.513\.400-4|Compa[ñn][ií]a\s+General\s+de\s+Electricidad|Enel\s+Distribuci[óo]n|96\.800\.570-7|Sociedad\s+Austral\s+de\s+Electricidad|96\.544\.470-3|Empresa\s+El[ée]ctrica\s+de\s+la\s+Frontera|76\.073\.164-1)/i

const TARIFA_REGEX =
  /(?:Tipo\s+de\s+tarifa\s+contratada|Opci[óo]n\s+tarifaria|Tarifa)[\s:]*([A-Z]{2,5}-?\d?[A-Z]?\d{0,2})/i

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  {
    concepto: 'Administración del servicio',
    pattern: buildCargoPattern('Administraci[óo]n del servicio'),
  },
  {
    concepto: 'Electricidad consumida',
    pattern: buildCargoPattern('Electricidad consumida\\s+\\d+\\s*kWh'),
  },
  {
    concepto: 'Coordinación y transporte de electricidad',
    pattern: buildCargoPattern(
      'Coordinaci[óo]n\\s+y\\s+transporte\\s+de\\s+electricidad',
    ),
  },
  {
    concepto: 'Reposición',
    pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?'),
  },
  { concepto: 'Cargo único', pattern: buildCargoPattern('Cargo\\s+[úu]nico') },
  {
    concepto: 'Recargo por mora',
    pattern: buildCargoPattern('Recargo\\s+por\\s+mora'),
  },
  { concepto: 'IVA 19%', pattern: buildCargoPattern('IVA(?:\\s*19\\s*%)?') },
]

const CONTEXTO_CORTE_REGEX = /(corte|suspensi[óo]n|desconexi[óo]n|reconexi[óo]n)/i

function detectarSospecha(cargo: Cargo, text: string): string | null {
  if (cargo.concepto === 'Reposición' && !CONTEXTO_CORTE_REGEX.test(text)) {
    return 'Reposición sin que la boleta mencione un corte. Pide desglose.'
  }
  if (cargo.concepto === 'Cargo único') {
    return 'Cargo único no es un componente estándar de la tarifa BT-1. Pide detalle del concepto.'
  }
  return null
}

export function parseChilquinta(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!CHILQUINTA_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Chilquinta. Detectamos marcadores de otra distribuidora.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Chilquinta?',
    )
  }

  const periodo = extractPeriodo(text)
  const consumo = {
    unidad: 'kWh' as const,
    valor: extractConsumo(text, 'kWh'),
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
    empresa: 'Chilquinta',
    servicio: 'electricidad',
    periodo,
    cliente: { numeroCliente: extractNumeroCliente(text) },
    consumo,
    cargos,
    totales: {
      subtotal: total - iva,
      iva,
      total,
    },
    fechaEmision: extractFechaEmision(text),
    fechaVencimiento: extractFechaVencimiento(text),
    raw: text,
  }
}

export const chilquintaParser: ParserModule = {
  empresa: 'Chilquinta',
  servicio: 'electricidad',
  fingerprint: {
    keywords: CHILQUINTA_KEYWORDS,
    format:
      'Chilquinta: layout 4 partes, header + datos + cargos + info pago. Cargos: Administración, Electricidad consumida X kWh, Coordinación y transporte. Total exento + neto + IVA + boleta + saldo + a pagar.',
  },
  detect(text) {
    return Boolean(text) && CHILQUINTA_DETECT_REGEX.test(text)
  },
  parse: parseChilquinta,
}
