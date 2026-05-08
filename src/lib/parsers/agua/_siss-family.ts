/**
 * Parser compartido para sanitarias SISS con layout "Su consumo en $ se
 * calcula así" (Aguas Andinas, ESSBio, Nuevosur).
 *
 * Cargos canónicos:
 *   - Cargo Fijo
 *   - Consumo Agua Potable
 *   - Servicio de Alcantarillado
 *   - Tratamiento de Aguas Servidas (a veces incluido en alcantarillado)
 *   - Sobreconsumo (cuando aplica)
 *
 * Total y vencimiento aparecen separados arriba; IVA en "Datos tributarios".
 */

import { TARIFAS_AGUA_2026, validarCobro } from '@/data/tarifas'
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
import type { Cargo, EmpresaSanitaria, ParsedBoleta } from '../types'

/** Mapeo entre nombre de parser y clave en TARIFAS_AGUA_2026 (cuando exista). */
const TARIFA_KEY: Partial<Record<EmpresaSanitaria, string>> = {
  'Aguas Andinas': 'aguas_andinas_g1',
}

const LECTURA_ACTUAL_REGEX =
  /Lectura\s+Actual\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
const LECTURA_ANTERIOR_REGEX =
  /Lectura\s+Anterior\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i

const TOTAL_A_PAGAR_REGEX = new RegExp(
  `(?:TOTAL\\s+A\\s+PAGAR|Monto\\s+Total)[\\s\\S]*?${CL_NUMBER}`,
  'i',
)

const IVA_REGEX = new RegExp(`IVA\\s*\\$?\\s*${CL_NUMBER}`, 'i')

const NUMERO_SERVICIO_REGEX =
  /(?:Su\s+n[úu]mero\s+de\s+servicio\s+es|N[°º]?\s*Servicio|N[°º]?\s*Cliente)[\s:]*([\w\d.-]+)/i

/**
 * Para layout SISS las líneas pueden tener varios números:
 *   "Consumo Agua Potable    12,00 m³ × 592,98    7.116"
 * El cargo real es el ÚLTIMO número (total), no el primero (m³). Por eso
 * usamos un patrón que captura el último número de la línea.
 */
function buildLastNumberPattern(label: string): RegExp {
  return new RegExp(
    `${label}[^\\n]*?(\\b(?:\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,\\d+)?\\b)(?:\\s|$)`,
    'gi',
  )
}

function lastNumberOnLine(text: string, label: string): number | null {
  const re = buildLastNumberPattern(label)
  const matches = [...text.matchAll(re)]
  if (matches.length === 0) return null
  // Cada matchAll devuelve cada match, pero queremos el último número del
  // primer match. Usamos un regex single-match con greedy lookahead.
  const greedy = new RegExp(
    `${label}[^\\n]*?(\\b(?:\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,\\d+)?\\b)(?=[\\s\\n]*$)`,
    'im',
  )
  const m = text.match(greedy)
  if (!m) return null
  return parseChileanNumber(m[1])
}

const CARGO_PATTERNS: ReadonlyArray<{ concepto: string; pattern: RegExp }> = [
  // "Cargo Fijo 914", un solo número, el simple `buildCargoPattern` sirve.
  { concepto: 'Cargo fijo', pattern: buildCargoPattern('Cargo\\s+Fijo') },
  {
    concepto: 'Reposición',
    pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?'),
  },
  {
    concepto: 'Sobreconsumo',
    pattern: buildCargoPattern('Sobreconsumo'),
  },
]

/**
 * Líneas con formato "X m³ × Y Z" donde Z es el cargo real. Procesadas
 * separadamente con `lastNumberOnLine` para extraer el TOTAL al final.
 */
const MULTI_NUMBER_LABELS: ReadonlyArray<{ concepto: string; label: string }> = [
  { concepto: 'Consumo agua potable', label: 'Consumo\\s+Agua\\s+Potable' },
  { concepto: 'Servicio de alcantarillado', label: 'Servicio\\s+de\\s+Alcantarillado' },
  { concepto: 'Tratamiento de aguas servidas', label: 'Tratamiento\\s+de\\s+Aguas\\s+Servidas' },
]

const REPOSICION_CONTEXTO_REGEX = /(corte|suspensi[óo]n|reposici[óo]n)/i

function detectarSospecha(
  cargo: Cargo,
  text: string,
  empresa: EmpresaSanitaria,
  consumoM3: number,
): string | null {
  if (cargo.concepto === 'Reposición' && !REPOSICION_CONTEXTO_REGEX.test(text)) {
    return 'Cargo por reposición pero la boleta no menciona ningún corte previo. Pedí desglose.'
  }

  const tarifaKey = TARIFA_KEY[empresa]
  const tarifa = tarifaKey ? TARIFAS_AGUA_2026[tarifaKey] : null

  // Tarifa-aware: Cargo fijo vs valor SISS.
  if (cargo.concepto === 'Cargo fijo' && tarifa?.cargoFijoCLP) {
    const r = validarCobro(cargo.monto, tarifa.cargoFijoCLP)
    if (r.alerta === 'cobro_indebido_probable') {
      return `Cargo fijo ${r.desviacionPct > 0 ? 'sobre' : 'bajo'} lo regulado por SISS en ${Math.abs(r.desviacionPct).toFixed(1)}%. ${r.mensaje}`
    }
    if (r.alerta === 'sospechoso') {
      return `Cargo fijo difiere ${Math.abs(r.desviacionPct).toFixed(1)}% del valor SISS publicado ($${tarifa.cargoFijoCLP}). Verificá tu grupo tarifario.`
    }
  }

  // Tarifa-aware: Consumo Agua Potable vs (m³ × tarifa SISS).
  if (
    cargo.concepto === 'Consumo agua potable' &&
    tarifa?.aguaPotableNoPuntaCLPM3 &&
    consumoM3 > 0
  ) {
    const esperado = tarifa.aguaPotableNoPuntaCLPM3 * consumoM3
    const r = validarCobro(cargo.monto, esperado)
    if (r.alerta === 'cobro_indebido_probable') {
      return `Consumo agua potable ${r.desviacionPct > 0 ? 'sobre' : 'bajo'} lo esperado en ${Math.abs(r.desviacionPct).toFixed(1)}% (${consumoM3} m³ × $${tarifa.aguaPotableNoPuntaCLPM3.toFixed(2)} ≈ $${Math.round(esperado).toLocaleString('es-CL')}). ${r.mensaje}`
    }
    if (r.alerta === 'sospechoso') {
      return `Consumo agua potable difiere ${Math.abs(r.desviacionPct).toFixed(1)}% del valor esperado según tarifa SISS. Pedí desglose.`
    }
  }

  // Tarifa-aware: Alcantarillado vs (m³ × tarifa SISS).
  if (
    cargo.concepto === 'Servicio de alcantarillado' &&
    tarifa?.alcantarilladoCLPM3 &&
    consumoM3 > 0
  ) {
    const esperado = tarifa.alcantarilladoCLPM3 * consumoM3
    const r = validarCobro(cargo.monto, esperado)
    if (r.alerta === 'cobro_indebido_probable') {
      return `Alcantarillado ${r.desviacionPct > 0 ? 'sobre' : 'bajo'} lo esperado en ${Math.abs(r.desviacionPct).toFixed(1)}% (${consumoM3} m³ × $${tarifa.alcantarilladoCLPM3.toFixed(2)} ≈ $${Math.round(esperado).toLocaleString('es-CL')}). ${r.mensaje}`
    }
    if (r.alerta === 'sospechoso') {
      return `Alcantarillado difiere ${Math.abs(r.desviacionPct).toFixed(1)}% del valor esperado según tarifa SISS. Pedí desglose.`
    }
  }

  return null
}

interface SissFamilyConfig {
  empresa: EmpresaSanitaria
  markersRegex: RegExp
  otherEmpresaMarkersRegex: RegExp
}

export function parseSissFamily(
  text: string,
  cfg: SissFamilyConfig,
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
        `Este PDF no parece de ${cfg.empresa}. Detectamos marcadores de otra sanitaria.`,
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      `No reconocimos el formato. ¿Estás seguro que es una boleta de ${cfg.empresa}?`,
    )
  }

  // Período: lectura actual / lectura anterior
  const lectActual = text.match(LECTURA_ACTUAL_REGEX)?.[1] ?? ''
  const lectAnterior = text.match(LECTURA_ANTERIOR_REGEX)?.[1] ?? ''
  const desde = parseChileanDate(lectAnterior) ?? new Date(NaN)
  const hasta = parseChileanDate(lectActual) ?? new Date(NaN)

  // "Consumo Facturado 12,00", preferimos esta línea sobre "1 m3 = 1.000
  // litros" que aparece como leyenda explicativa.
  const consumoFacturadoMatch = text.match(
    /Consumo\s+Facturado[^\d]*?(\d+(?:,\d+)?)/i,
  )
  const consumoFacturado = consumoFacturadoMatch
    ? parseChileanNumber(consumoFacturadoMatch[1])
    : 0
  const consumo = {
    unidad: 'm3' as const,
    valor: Number.isFinite(consumoFacturado) && consumoFacturado > 0
      ? consumoFacturado
      : extractConsumo(text, 'm3'),
  }

  const cargos = extractCargosFromPatterns(text, CARGO_PATTERNS)
  // Cargos con múltiples números en línea → extraer el último (total).
  for (const { concepto, label } of MULTI_NUMBER_LABELS) {
    const monto = lastNumberOnLine(text, label)
    if (monto !== null && Number.isFinite(monto)) {
      cargos.push({ concepto, monto })
    }
  }
  for (const cargo of cargos) {
    const razon = detectarSospecha(cargo, text, cfg.empresa, consumo.valor)
    if (razon) {
      cargo.sospechoso = true
      cargo.razonSospecha = razon
    }
  }

  const totalMatch = text.match(TOTAL_A_PAGAR_REGEX)
  const total = totalMatch ? parseChileanNumber(totalMatch[1]) : 0

  const ivaMatch = text.match(IVA_REGEX)
  const iva = ivaMatch ? parseChileanNumber(ivaMatch[1]) : 0

  const numeroCliente =
    text.match(NUMERO_SERVICIO_REGEX)?.[1]?.trim() ??
    extractNumeroCliente(text)

  return {
    empresa: cfg.empresa,
    servicio: 'agua',
    periodo: { desde, hasta },
    cliente: { numeroCliente },
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
