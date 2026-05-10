import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface ReclamoBoletaPayload {
  empresaSlug: string
  empresaNombre: string
  servicio: string
  /**
   * ISO strings opcionales. El parser puede no haber logrado extraer
   * fechas en boletas con formatos heterogéneos; el template del
   * reclamo usa placeholders en ese caso.
   */
  periodoDesde?: string
  periodoHasta?: string
  fechaEmision?: string
  fechaVencimiento?: string
  numeroCliente?: string
  total: number
  cargosSospechosos: Array<{
    concepto: string
    monto: number
    razon?: string
  }>
}

export interface ReclamoFormData {
  tipoReclamo: string
  nombre: string
  rut: string
  email: string
  telefono: string
  direccion: string
  empresaRazonSocial: string
  empresaRut: string
  empresaDireccion: string
  hechos: string
  peticion: string
}

const TIPO_OPTIONS = [
  'Cobro indebido en boleta de servicios',
  'Recargo por mora ya pagada',
  'Cargo no autorizado',
  'Tarifa mal aplicada',
  'Otro',
] as const

export type TipoReclamo = (typeof TIPO_OPTIONS)[number]

export const TIPOS_RECLAMO: readonly TipoReclamo[] = TIPO_OPTIONS

function formatCLP(n: number): string {
  if (!Number.isFinite(n)) return '-'
  return `$ ${Math.round(n).toLocaleString('es-CL')}`
}

function formatPeriodoDesdeHasta(
  desde: string | undefined,
  hasta: string | undefined,
): string {
  if (!desde || !hasta) return 'período no detectado'
  const d = new Date(desde)
  const h = new Date(hasta)
  if (Number.isNaN(d.getTime()) || Number.isNaN(h.getTime())) {
    return 'período no detectado'
  }
  return `${format(d, 'd MMM yyyy', { locale: es })} al ${format(h, 'd MMM yyyy', { locale: es })}`
}

function formatFechaEmision(iso?: string): string {
  if (!iso) return '[fecha de emisión no detectada]'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '[fecha de emisión no detectada]'
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es })
}

export function buildHechosTemplate(payload: ReclamoBoletaPayload): string {
  const periodo = formatPeriodoDesdeHasta(payload.periodoDesde, payload.periodoHasta)
  const fechaEmision = formatFechaEmision(payload.fechaEmision)
  const cargo = payload.cargosSospechosos[0]
  const cargoText = cargo
    ? `un cargo por "${cargo.concepto}" por ${formatCLP(cargo.monto)} que no corresponde porque ${cargo.razon ?? '[completar motivo]'}`
    : 'cargos que no corresponden a las tarifas SEC vigentes'
  const numeroCliente = payload.numeroCliente
    ? `, asociada a mi número de cliente ${payload.numeroCliente}`
    : ''

  return `Con fecha ${fechaEmision} recibí boleta${numeroCliente} de ${payload.empresaNombre} por servicio de ${payload.servicio} correspondiente al período ${periodo}, por un total de ${formatCLP(payload.total)}.

En dicha boleta se incluye ${cargoText}.

Solicité aclaración a la empresa pero la respuesta no resolvió el problema, por lo que recurro al SERNAC para iniciar mediación formal en virtud de la Ley 19.496 sobre Protección de los Derechos del Consumidor.`
}

export function buildPeticionTemplate(payload: ReclamoBoletaPayload): string {
  const sospechosos = payload.cargosSospechosos.filter((c) => c.monto > 0)

  // Caso 1: hay cargos sospechosos identificados.
  if (sospechosos.length > 0) {
    const total = sospechosos.reduce((sum, c) => sum + c.monto, 0)
    const montoText = formatCLP(total)
    const conceptoText =
      sospechosos.length === 1
        ? sospechosos[0].concepto
        : `los siguientes cargos: ${sospechosos.map((c) => c.concepto).join(', ')}`
    return `Solicito a SERNAC mediar con la empresa para que:

1. Se anule el cobro indebido por ${montoText} (${conceptoText}) y se me reembolse en mi próxima boleta.
2. Se entreguen, por escrito, las disculpas correspondientes y la corrección del cobro.
3. Se garantice que el sistema de facturación no vuelva a aplicar este cargo de forma indebida.

Adjunto antecedentes de la boleta cuestionada y reservo el derecho de continuar la vía legal en el Juzgado de Policía Local correspondiente si la mediación no resuelve el reclamo (artículos 50 y siguientes de la Ley 19.496).`
  }

  // Caso 2: no hay cargos sospechosos identificados; el reclamo es
  // genérico (ej. el usuario detectó un problema que el parser no
  // marcó automáticamente). Sin placeholders sin resolver.
  return `Solicito a SERNAC mediar con la empresa para que:

1. Se aclaren por escrito los cargos cuestionados de mi boleta y, si corresponde, se ajusten en una próxima facturación.
2. Se entregue el detalle completo de las tarifas y unidades aplicadas para verificar que coinciden con las publicadas por el regulador.
3. Se garantice que cualquier cobro sin respaldo no vuelva a aplicarse.

Adjunto antecedentes de la boleta cuestionada y reservo el derecho de continuar la vía legal en el Juzgado de Policía Local correspondiente si la mediación no resuelve el reclamo (artículos 50 y siguientes de la Ley 19.496).`
}

export function buildLetterText(form: ReclamoFormData): string {
  const fechaHoy = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

  return [
    `SANTIAGO, ${fechaHoy}`,
    '',
    'Señores',
    'Servicio Nacional del Consumidor (SERNAC)',
    'PRESENTE',
    '',
    `Asunto: ${form.tipoReclamo}`,
    '',
    `Por la presente, yo, ${form.nombre}, cédula de identidad N° ${form.rut}, con domicilio en ${form.direccion}, correo electrónico ${form.email} y teléfono ${form.telefono}, vengo en interponer reclamo formal contra la empresa proveedora identificada a continuación:`,
    '',
    'EMPRESA RECLAMADA',
    `Razón social: ${form.empresaRazonSocial}`,
    `RUT: ${form.empresaRut}`,
    `Dirección: ${form.empresaDireccion}`,
    '',
    'HECHOS',
    form.hechos,
    '',
    'PETICIÓN',
    form.peticion,
    '',
    'Sin otro particular, saluda atentamente,',
    '',
    '',
    '',
    form.nombre,
    `RUT: ${form.rut}`,
  ].join('\n')
}

/**
 * Sanitiza texto antes de pasárselo a `drawText` de pdf-lib con la
 * fuente Helvetica WinAnsi. Helvetica solo soporta Latin-1 (ISO-8859-1
 * extendido); caracteres fuera de ese rango (emoji, símbolos exóticos,
 * caracteres asiáticos, flechas Unicode) tiran un error de encoding.
 *
 * Para no agregar 150KB de fuente TrueType al bundle (penalty real en
 * mobile data plans), reemplazamos los chars problemáticos con un fallback
 * legible. Cubrimos los casos más comunes en boletas chilenas: símbolos
 * de moneda no-CLP, emojis pegados al copiar/pegar, comillas curly
 * peor formateadas.
 */
function sanitizeForLatin1(text: string): string {
  if (!text) return ''
  // Reemplazos explícitos de chars que el usuario podría pegar:
  // comillas y guiones tipográficos → ASCII equivalentes.
  const out = text
    .replace(/[‘’]/g, "'") // smart quotes single
    .replace(/[“”]/g, '"') // smart quotes double
    // lint-tono-disable-next-line (en-dash y em-dash funcionales)
    .replace(/[–—]/g, '-') // en-dash y em-dash
    .replace(/…/g, '...') // ellipsis
    .replace(/ /g, ' ') // nbsp → space
  // Char por char: si el code point está fuera de Latin-1 (>255),
  // reemplazamos con `?`. Mejor un signo visible que un crash.
  let result = ''
  for (let i = 0; i < out.length; i++) {
    const code = out.charCodeAt(i)
    result += code <= 255 ? out[i] : '?'
  }
  return result
}

export async function buildLetterPdf(form: ReclamoFormData): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const PAGE_WIDTH = 612
  const PAGE_HEIGHT = 792
  const MARGIN_X = 64
  const MARGIN_TOP = 720
  const MARGIN_BOTTOM = 64
  const MAX_WIDTH = PAGE_WIDTH - MARGIN_X * 2
  const FONT_SIZE = 11
  const LINE_HEIGHT = 15
  const HEADING_SIZE = 12
  const TITLE_SIZE = 14

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = MARGIN_TOP

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN_BOTTOM) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = MARGIN_TOP
    }
  }

  function wrapWords(text: string, theFont: typeof font, size: number): string[] {
    if (!text) return ['']
    const lines: string[] = []
    for (const paragraph of text.split('\n')) {
      if (!paragraph) {
        lines.push('')
        continue
      }
      const words = paragraph.split(/\s+/)
      let current = ''
      for (const word of words) {
        const tentative = current ? `${current} ${word}` : word
        const width = theFont.widthOfTextAtSize(tentative, size)
        if (width <= MAX_WIDTH || !current) {
          current = tentative
        } else {
          lines.push(current)
          current = word
        }
      }
      if (current) lines.push(current)
    }
    return lines
  }

  function drawLine(text: string, opts?: { bold?: boolean; size?: number }) {
    const size = opts?.size ?? FONT_SIZE
    const f = opts?.bold ? fontBold : font
    ensureSpace(size + 4)
    page.drawText(sanitizeForLatin1(text), { x: MARGIN_X, y, size, font: f, color: rgb(0.13, 0.13, 0.13) })
    y -= LINE_HEIGHT
  }

  function drawParagraph(text: string, opts?: { bold?: boolean; size?: number }) {
    const size = opts?.size ?? FONT_SIZE
    const f = opts?.bold ? fontBold : font
    const lines = wrapWords(sanitizeForLatin1(text), f, size)
    for (const line of lines) {
      ensureSpace(size + 4)
      page.drawText(line, { x: MARGIN_X, y, size, font: f, color: rgb(0.13, 0.13, 0.13) })
      y -= LINE_HEIGHT
    }
  }

  function blank(units = 1) {
    y -= LINE_HEIGHT * units
  }

  const fechaHoy = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

  drawLine('SOLICITUD DE MEDIACIÓN ANTE EL SERNAC', { bold: true, size: TITLE_SIZE })
  blank(1)
  drawLine(`SANTIAGO, ${fechaHoy}`)
  blank(1)
  drawLine('Señores')
  drawLine('Servicio Nacional del Consumidor (SERNAC)')
  drawLine('PRESENTE')
  blank(1)
  drawParagraph(`Asunto: ${form.tipoReclamo}`, { bold: true, size: HEADING_SIZE })
  blank(1)
  drawParagraph(
    `Por la presente, yo, ${form.nombre}, cédula de identidad N° ${form.rut}, con domicilio en ${form.direccion}, correo electrónico ${form.email} y teléfono ${form.telefono}, vengo en interponer reclamo formal contra la empresa proveedora identificada a continuación:`,
  )
  blank(1)
  drawLine('EMPRESA RECLAMADA', { bold: true, size: HEADING_SIZE })
  drawLine(`Razón social: ${form.empresaRazonSocial}`)
  drawLine(`RUT: ${form.empresaRut}`)
  drawParagraph(`Dirección: ${form.empresaDireccion}`)
  blank(1)
  drawLine('HECHOS', { bold: true, size: HEADING_SIZE })
  drawParagraph(form.hechos)
  blank(1)
  drawLine('PETICIÓN', { bold: true, size: HEADING_SIZE })
  drawParagraph(form.peticion)
  blank(2)
  drawLine('Sin otro particular, saluda atentamente,')
  blank(3)
  drawLine(form.nombre, { bold: true })
  drawLine(`RUT: ${form.rut}`)

  const bytes = await pdf.save()
  return new Blob([bytes as unknown as ArrayBuffer], {
    type: 'application/pdf',
  })
}
