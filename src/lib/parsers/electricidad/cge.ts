import { validarCobro } from '@/data/tarifas'
import { ParserError } from '../errors'
import type { Cargo, ParsedBoleta, ParserModule } from '../types'

const CGE_MARKERS_REGEX =
  /(\bCGE\b|99\.513\.400-4|compa[ñn][ií]a\s+general\s+de\s+electricidad)/i

const OTHER_EMPRESA_MARKERS_REGEX =
  /(Enel\s+Distribuci[óo]n|96\.800\.570-7|Chilquinta\s+(?:Energ[íi]a|Distribuci[óo]n)|96\.813\.520-1|Sociedad\s+Austral\s+de\s+Electricidad|96\.544\.470-3|Empresa\s+El[ée]ctrica\s+de\s+la\s+Frontera|76\.073\.164-1)/i

const PERIODO_REGEX =
  /(?:Per[íi]odo(?:\s*facturado)?|Lectura desde)[\s:]*?(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})\s*(?:al?|hasta|-|–)\s*(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})/i

const CONSUMO_REGEX = /(\d+(?:\.\d{3})*)\s*(?:kWh|KWH|kW\s*h)\b/i

/**
 * Patrón para un número chileno completo:
 *  - "1.048" / "111.543" (miles con punto)
 *  - "1048" / "240" (entero sin separador)
 *  - "1.048,46" (decimales con coma)
 *
 * Los `\b` garantizan que NO matchee dígitos pegados a letras (ej. el
 * "1" de "BT1") y los puntos de un leader tipo "............".
 */
const CL_NUMBER = '\\b((?:\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,\\d+)?)\\b'

function buildCargoPattern(label: string): RegExp {
  return new RegExp(`${label}[^\\n]*?${CL_NUMBER}`, 'i')
}

const TOTAL_REGEX = new RegExp(
  `(?:Total\\s+a\\s+pagar|TOTAL\\s+\\$|Total\\s+\\$)[^\\n]*?${CL_NUMBER}`,
  'i',
)

const NUMERO_CLIENTE_REGEX =
  /(?:N[°º]?\s*Cliente|N[°º]?\s*Servicio|C[óo]digo\s+Cliente)[\s:]*([\w\d.-]+)/i

const FECHA_EMISION_REGEX =
  /(?:Fecha de emisi[óo]n|Emisi[óo]n)[\s:]*(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})/i

const FECHA_VENCIMIENTO_REGEX =
  /(?:Fecha de vencimiento|Vence|Vencimiento)[\s:]*(\d{1,2}[\s/-][a-záéíóúñA-ZÁÉÍÓÚÑ\d]+[\s/-]\d{2,4})/i

const TARIFA_REGEX = /(?:Tarifa|Opci[óo]n tarifaria)[\s:]*([A-Z]{1,3}-?\d?[A-Z]?\d?)/i

const CARGO_PATTERNS: Array<{ concepto: string; pattern: RegExp }> = [
  { concepto: 'Cargo fijo', pattern: buildCargoPattern('Cargo fijo') },
  { concepto: 'Cargo por energía', pattern: buildCargoPattern('Cargo por energ[íi]a') },
  {
    concepto: 'Cargo por uso del sistema de transmisión',
    pattern: buildCargoPattern('Cargo por uso del sistema de transmisi[óo]n'),
  },
  { concepto: 'Cargo por servicio público', pattern: buildCargoPattern('Cargo por servicio p[úu]blico') },
  { concepto: 'Cargo por compras de potencia', pattern: buildCargoPattern('Cargo por compras de potencia') },
  { concepto: 'Cargo por potencia base', pattern: buildCargoPattern('Cargo por potencia base') },
  { concepto: 'Reposición', pattern: buildCargoPattern('Reposici[óo]n(?:\\s+de\\s+servicio)?') },
  { concepto: 'Cargo único', pattern: buildCargoPattern('Cargo\\s+[úu]nico') },
  { concepto: 'Recargo por mora', pattern: buildCargoPattern('Recargo por mora') },
  {
    concepto: 'Subsidio Eléctrico Ley 21.667',
    pattern: buildCargoPattern('(?:Subsidio\\s+El[ée]ctrico|Ley\\s*21\\.?667)'),
  },
  { concepto: 'IVA 19%', pattern: buildCargoPattern('IVA(?:\\s*19\\s*%)?') },
]

const MONTHS_ES: Record<string, number> = {
  ene: 0, enero: 0,
  feb: 1, febrero: 1,
  mar: 2, marzo: 2,
  abr: 3, abril: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5,
  jul: 6, julio: 6,
  ago: 7, agosto: 7,
  sep: 8, sept: 8, septiembre: 8,
  oct: 9, octubre: 9,
  nov: 10, noviembre: 10,
  dic: 11, diciembre: 11,
}

export function parseChileanNumber(s: string): number {
  const cleaned = s.replace(/[^\d.,-]/g, '').trim()
  if (!cleaned) return NaN
  const negative = cleaned.startsWith('-')
  const stripped = negative ? cleaned.slice(1) : cleaned
  const numeric = stripped.includes(',')
    ? parseFloat(stripped.replace(/\./g, '').replace(',', '.'))
    : parseInt(stripped.replace(/\./g, ''), 10)
  if (!Number.isFinite(numeric)) return NaN
  return negative ? -numeric : numeric
}

export function parseChileanDate(input: string): Date | null {
  const s = input.trim()
  if (!s) return null

  const slash = s.match(/^(\d{1,2})[\s/-](\d{1,2})[\s/-](\d{2,4})$/)
  if (slash) {
    const day = parseInt(slash[1], 10)
    const month = parseInt(slash[2], 10) - 1
    const yearRaw = parseInt(slash[3], 10)
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    return new Date(year, month, day)
  }

  const named = s.match(/^(\d{1,2})[\s/-]([a-záéíóúñ]+)[\s/-](\d{2,4})$/i)
  if (named) {
    const day = parseInt(named[1], 10)
    const monthIdx = MONTHS_ES[named[2].toLowerCase()]
    if (monthIdx === undefined) return null
    const yearRaw = parseInt(named[3], 10)
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw
    return new Date(year, monthIdx, day)
  }

  return null
}

function extractPeriodo(text: string): { desde: Date; hasta: Date } {
  const m = text.match(PERIODO_REGEX)
  if (m) {
    const desde = parseChileanDate(m[1])
    const hasta = parseChileanDate(m[2])
    if (desde && hasta) return { desde, hasta }
  }
  return { desde: new Date(NaN), hasta: new Date(NaN) }
}

function extractConsumo(text: string): {
  unidad: 'kWh' | 'm3'
  valor: number
  tarifa?: string
} {
  const m = text.match(CONSUMO_REGEX)
  const valor = m ? parseChileanNumber(m[1]) : 0
  const tarifaMatch = text.match(TARIFA_REGEX)
  return {
    unidad: 'kWh',
    valor: Number.isFinite(valor) ? valor : 0,
    tarifa: tarifaMatch ? tarifaMatch[1].trim() : undefined,
  }
}

function extractCargos(text: string): Cargo[] {
  const cargos: Cargo[] = []
  for (const { concepto, pattern } of CARGO_PATTERNS) {
    const m = text.match(pattern)
    if (!m) continue
    const monto = parseChileanNumber(m[1])
    if (!Number.isFinite(monto)) continue
    cargos.push({ concepto, monto })
  }
  return cargos
}

function extractTotales(
  text: string,
  cargos: Cargo[],
): { subtotal: number; iva: number; total: number } {
  const totalMatch = text.match(TOTAL_REGEX)
  const total = totalMatch ? parseChileanNumber(totalMatch[1]) : 0
  const ivaCargo = cargos.find((c) => c.concepto === 'IVA 19%')
  const iva = ivaCargo ? ivaCargo.monto : 0
  const subtotal = total - iva
  return {
    subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    iva: Number.isFinite(iva) ? iva : 0,
    total: Number.isFinite(total) ? total : 0,
  }
}

function extractCliente(
  text: string,
): { nombre?: string; direccion?: string; numeroCliente?: string } {
  const numeroMatch = text.match(NUMERO_CLIENTE_REGEX)
  return {
    numeroCliente: numeroMatch ? numeroMatch[1].trim() : undefined,
  }
}

const CONTEXTO_CORTE_REGEX =
  /(corte|suspensi[óo]n|desconexi[óo]n|reconexi[óo]n)/i

const EXPLICACION_ESTACIONAL_REGEX =
  /(verano|invierno|estaci[óo]n|temperat|fr[íi]o|calor|estufa|cale[fr]ac|aire\s+acondicionado)/i

const CONSUMO_ANTERIOR_REGEX =
  /(?:mes anterior|consumo anterior|per[íi]odo anterior|kWh\s+anterior)[\s:]*?(\d+(?:\.\d{3})*)/i

/**
 * Cargo fijo regulatorio publicado por la SEC para CGE (tarifa BT-1, sector
 * STxD-3 RM). Si tu boleta tiene cargo fijo muy distinto a éste, hay
 * sospecha. Sectores STxE rurales pueden ser similares (~$1.048).
 */
const CGE_CARGO_FIJO_REGULATORIO_CLP = 1048.46

function detectarSospecha(
  cargo: Cargo,
  text: string,
  consumo: { unidad: 'kWh' | 'm3'; valor: number },
): string | null {
  if (cargo.concepto === 'Reposición') {
    if (!CONTEXTO_CORTE_REGEX.test(text)) {
      return 'Cargo por reposición pero la boleta no menciona ningún corte previo. Pedir desglose.'
    }
  }

  if (cargo.concepto === 'Cargo único') {
    return 'Cargo único no es un componente estándar de la tarifa BT-1. Pedir detalle del concepto.'
  }

  if (cargo.concepto === 'Cargo fijo') {
    const result = validarCobro(cargo.monto, CGE_CARGO_FIJO_REGULATORIO_CLP)
    if (result.alerta === 'cobro_indebido_probable') {
      return `Cargo fijo ${result.desviacionPct > 0 ? 'sobre' : 'bajo'} lo regulado por SEC en ${Math.abs(result.desviacionPct).toFixed(1)}%. ${result.mensaje}`
    }
    if (result.alerta === 'sospechoso') {
      return `Cargo fijo difiere ${Math.abs(result.desviacionPct).toFixed(1)}% del valor SEC publicado ($${CGE_CARGO_FIJO_REGULATORIO_CLP.toFixed(0)}). Verificá tu sector tarifario.`
    }
  }

  if (cargo.concepto === 'Cargo por energía' && consumo.valor > 0) {
    const previoMatch = text.match(CONSUMO_ANTERIOR_REGEX)
    if (previoMatch) {
      const previo = parseChileanNumber(previoMatch[1])
      if (previo > 0) {
        const incremento = (consumo.valor - previo) / previo
        if (incremento > 0.4) {
          if (!EXPLICACION_ESTACIONAL_REGEX.test(text)) {
            const pct = Math.round(incremento * 100)
            return `Consumo subió ${pct}% vs el período anterior. La boleta no explica el cambio.`
          }
        }
      }
    }
  }

  return null
}

export function parseCGE(text: string): ParsedBoleta {
  if (!text || !text.trim()) {
    throw new ParserError(
      'EMPTY_TEXT',
      'El texto extraído del PDF está vacío. Probablemente es un PDF escaneado o protegido.',
    )
  }

  const looksLikeCGE = CGE_MARKERS_REGEX.test(text)
  if (!looksLikeCGE) {
    if (OTHER_EMPRESA_MARKERS_REGEX.test(text)) {
      throw new ParserError(
        'WRONG_EMPRESA',
        'Este PDF no parece de CGE. Detectamos marcadores de otra distribuidora.',
      )
    }
    throw new ParserError(
      'INVALID_FORMAT',
      'No reconocimos el formato. ¿Estás seguro que es una boleta de CGE?',
    )
  }

  const periodo = extractPeriodo(text)
  const consumo = extractConsumo(text)
  const cargos = extractCargos(text)
  const totales = extractTotales(text, cargos)
  const cliente = extractCliente(text)
  const fechaEmision =
    parseChileanDate(text.match(FECHA_EMISION_REGEX)?.[1] ?? '') ?? undefined
  const fechaVencimiento =
    parseChileanDate(text.match(FECHA_VENCIMIENTO_REGEX)?.[1] ?? '') ??
    undefined

  for (const cargo of cargos) {
    const razon = detectarSospecha(cargo, text, consumo)
    if (razon) {
      cargo.sospechoso = true
      cargo.razonSospecha = razon
    }
  }

  return {
    empresa: 'CGE',
    servicio: 'electricidad',
    periodo,
    cliente,
    consumo,
    cargos,
    totales,
    fechaEmision,
    fechaVencimiento,
    raw: text,
  }
}

const CGE_KEYWORDS = [
  'CGE S.A.',
  'CGE Distribución',
  'Compañía General de Electricidad',
  'cge.cl',
  'CGE',
  '99.513.400-4',
  'Avda. Presidente Riesco 5561',
]

export const cgeParser: ParserModule = {
  empresa: 'CGE',
  servicio: 'electricidad',
  fingerprint: {
    keywords: CGE_KEYWORDS,
    format:
      'CGE residencial BT-1: 4 partes verticales, header con logo + RUT + datos cliente, detalle de cargos + lectura medidor, gráfico histórico de consumo, códigos de pago + información SERNAC.',
  },
  detect(text) {
    if (!text) return false
    return CGE_MARKERS_REGEX.test(text)
  },
  parse(text) {
    return parseCGE(text)
  },
}
