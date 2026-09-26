/**
 * Parser compartido para Grupo SAESA (SAESA + Frontel).
 *
 * Las dos empresas usan literalmente el mismo template de boleta
 * (web.gruposaesa.cl). La única diferencia entre fixtures es la razón
 * social, RUT y dirección, el resto (cargos, totales, layout) es idéntico.
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
import type { Cargo, EmpresaElectrica, ParsedBoleta } from '../types'
import { BT2_CARGO_PATTERNS } from './_bt2-cargos'

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
    concepto: 'Cargo por servicio público',
    pattern: buildCargoPattern('Cargo\\s+por\\s+servicio\\s+p[úu]blico'),
  },
  {
    concepto: 'Cargo por compras de potencia',
    pattern: buildCargoPattern('Cargo\\s+por\\s+compras\\s+de\\s+potencia'),
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
  {
    // Se conserva la etiqueta del documento; su extracción no acredita
    // la aplicabilidad ni la vigencia de ese componente tarifario.
    concepto: 'Recargo por consumo invierno',
    pattern: buildCargoPattern(
      'Recargo\\s+por\\s+consumo\\s+invierno',
    ),
  },
  {
    // Saldo del período anterior arrastrado a la boleta actual. No es
    // un cargo nuevo pero suma al "Total a pagar". El usuario tiene
    // derecho a pedir el detalle.
    concepto: 'Saldo anterior',
    pattern: buildCargoPattern('Saldo\\s+anterior'),
  },
  { concepto: 'IVA 19%', pattern: buildCargoPattern('IVA(?:\\s*19\\s*%)?') },
  // Cargos BT-2/BT-3 canónicos (clientes con potencia contratada,
  // común en zonas del sur con calefacción eléctrica residencial).
  ...BT2_CARGO_PATTERNS,
]

const CONTEXTO_CORTE_REGEX =
  /(corte|suspensi[óo]n|desconexi[óo]n|reconexi[óo]n)/i

function detectarSospecha(cargo: Cargo, text: string): string | null {
  if (cargo.concepto === 'Reposición' && !CONTEXTO_CORTE_REGEX.test(text)) {
    return 'Reposición sin que la boleta mencione un corte. Pide desglose.'
  }
  if (cargo.concepto === 'Cargo único') {
    return 'La etiqueta Cargo único no identifica el componente. Pide su denominación completa, unidad y detalle tarifario.'
  }
  if (cargo.concepto === 'Recargo por consumo invierno') {
    // El concepto extraído no acredita tarifa ni vigencia del recargo.
    return 'Recargo invernal: pide la tarifa y vigencia que lo fundamentan, el período de consumo y su cálculo. El mes de emisión no acredita que el cobro corresponda.'
  }
  return null
}

interface SaesaFamilyConfig {
  empresa: EmpresaElectrica
  /** Markers únicos de la empresa (RUT + grupo + dominio), gates parse(). */
  markersRegex: RegExp
  /** Markers de cualquier OTRA empresa eléctrica, para detectar cross-empresa. */
  otherEmpresaMarkersRegex: RegExp
}

export function parseSaesaFamily(
  text: string,
  cfg: SaesaFamilyConfig,
): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  if (!cfg.markersRegex.test(text)) {
    if (cfg.otherEmpresaMarkersRegex.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        `Este PDF no parece de ${cfg.empresa}. Detectamos marcadores de otra distribuidora.`,
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      `No reconocimos el formato. ¿Estás seguro que es una boleta de ${cfg.empresa}?`,
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
    empresa: cfg.empresa,
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
