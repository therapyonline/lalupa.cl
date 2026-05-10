/**
 * Parser de Enel Distribución Chile.
 *
 * Layout (ver `__fixtures__/enel-real-2024-06.ts`):
 *   - Header: razón social + RUT empresa + dirección legal
 *   - "Detalle de mi cuenta" → "Servicio Eléctrico" + 5-6 líneas de cargos
 *   - "Total a pagar" + "Monto del período {DD MES YYYY} - {DD MES YYYY}"
 *   - "Datos de mi suministro" → tipo de tarifa, potencia
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

const ENEL_KEYWORDS = [
  'Enel',
  'Enel Distribución Chile',
  'Enel Distribución',
  'enel.cl',
  '96.800.570-7',
]

// Detect amplio: cualquier "Enel" como palabra completa, dominio o RUT
// con separadores tolerantes. Si el texto contiene "Enel" pero no es
// boleta de Enel, MARKERS_REGEX o el parser tiran error después.
const ENEL_DETECT_REGEX = /\benel\b|enel\.cl/i

const ENEL_MARKERS_REGEX =
  /(\benel\b|96[\s.,]?800[\s.,]?570[\s-]?7|enel\.cl)/i

const OTHER_EMPRESA_MARKERS_REGEX =
  /(\bCGE\b|99\.513\.400-4|Compa[ñn][ií]a\s+General\s+de\s+Electricidad|Chilquinta\s+(?:Energ[íi]a|Distribuci[óo]n)|96\.813\.520-1|Sociedad\s+Austral\s+de\s+Electricidad|96\.544\.470-3|Empresa\s+El[ée]ctrica\s+de\s+la\s+Frontera|76\.073\.164-1)/i

const TARIFA_REGEX =
  /(?:Tipo\s+de\s+tarifa\s+contratada|Opci[óo]n\s+tarifaria|Tarifa)[\s:]*([A-Z]{2,5}-?\d?[A-Z]?\d{0,2})/i

const ENEL_CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> =
  [
    {
      concepto: 'Administración del servicio',
      pattern: buildCargoPattern('Administraci[óo]n del servicio'),
    },
    {
      // Negative lookahead `(?!\s+Imp)` evita que este pattern matchee
      // las líneas con sufijo "Imp. SIB.UEN" o "Imp. NIVEN" cuando no
      // hay una línea "(Var. IVA)" explícita. Sin esto, los dos cargos
      // de impuesto se duplican (uno como "Electricidad consumida"
      // genérica + otro como impuesto específico).
      concepto: 'Electricidad consumida',
      pattern: buildCargoPattern(
        'Electricidad\\s+Consumida(?:\\s+\\(Var\\.?\\s+IVA\\))?(?!\\s+Imp)',
      ),
    },
    {
      concepto: 'Electricidad consumida, impuesto SIB.UEN',
      pattern: buildCargoPattern('Electricidad\\s+Consumida\\s+Imp\\.?\\s+SIB\\.?UEN'),
    },
    {
      concepto: 'Electricidad consumida, impuesto NIVEN',
      pattern: buildCargoPattern('Electricidad\\s+Consumida\\s+Imp\\.?\\s+NIVEN'),
    },
    {
      concepto: 'Transporte de electricidad',
      pattern: buildCargoPattern('Transporte\\s+de\\s+electricidad'),
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

export function parseEnel(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!ENEL_MARKERS_REGEX.test(text)) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de Enel. Detectamos marcadores de otra distribuidora.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de Enel?',
    )
  }

  const periodo = extractPeriodo(text)
  const consumo = {
    unidad: 'kWh' as const,
    valor: extractConsumo(text, 'kWh'),
    tarifa: text.match(TARIFA_REGEX)?.[1]?.trim(),
  }
  const cargos = extractCargosFromPatterns(text, ENEL_CARGO_PATTERNS)
  for (const cargo of cargos) {
    const razon = detectarSospecha(cargo, text)
    if (razon) {
      cargo.sospechoso = true
      cargo.razonSospecha = razon
    }
  }

  const total = extractTotal(text)
  const iva = extractIVA(text) || cargos.find((c) => c.concepto === 'IVA 19%')?.monto || 0

  return {
    empresa: 'Enel',
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

export const enelParser: ParserModule = {
  empresa: 'Enel',
  servicio: 'electricidad',
  fingerprint: {
    keywords: ENEL_KEYWORDS,
    format:
      'Enel: header con razón social + RUT empresa + dirección legal, "Detalle de mi cuenta" con 5 líneas de cargos (Administración, Electricidad Consumida ×3 variantes, Transporte), totales abajo.',
  },
  detect(text) {
    return Boolean(text) && ENEL_DETECT_REGEX.test(text)
  },
  parse: parseEnel,
}
