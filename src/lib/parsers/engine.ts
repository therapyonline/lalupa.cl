// Side-effect import: garantiza que los módulos de electricidad, agua y
// gas estén registrados antes de que `detectDistribuidora`,
// `detectSanitaria`, `detectGas` o `detectParser` se invoquen.
import './electricidad'
import './agua'
import './gas'

import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { extractTextFromImage, type OcrProgress } from './ocr'
import { detectParser } from './registry'
import type { EmpresaElectrica, EmpresaGas, EmpresaSanitaria } from './types'

let workerInitialized = false

/**
 * Mínimo de caracteres alfanuméricos contables para asumir que un PDF
 * tiene capa de texto utilizable. Un PDF escaneado entrega 0-30 chars
 * (metadata: nombre del scanner, fecha); un PDF nativo de boleta
 * entrega cientos.
 *
 * Contamos sólo alphanumerics + acentos para evitar que metadata estilo
 * "// ===== Metadata =====" o whitespace dispare el threshold sin
 * tener contenido real.
 */
const PDF_TEXT_LAYER_THRESHOLD = 50

/**
 * Tipos MIME que aceptamos en el pipeline.  Centralizado para no divergir
 * entre FileDrop, upload-hub y este engine.
 */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/**
 * Lista de extensiones HEIC/HEIF que iOS pone por default cuando sacás
 * fotos. Ningún navegador decodifica HEIC nativamente al 2026 sin
 * convertir antes; lo detectamos para dar mensaje claro al usuario.
 */
const HEIC_EXTENSIONS = ['.heic', '.heif']

export function isHeicFile(file: { name: string; type: string }): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true
  const name = file.name.toLowerCase()
  return HEIC_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/**
 * Cuenta caracteres alfanuméricos (incluye acentos castellanos) en un
 * string. Más robusto que `text.length` para detectar texto real vs
 * metadata: un PDF escaneado puede tener "/Producer (Adobe Acrobat 23)"
 * que pasaría un threshold ingenuo de 50 chars pero no es contenido.
 */
export function countAlphanumeric(text: string): number {
  let n = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // 0-9
    if (code >= 48 && code <= 57) n++
    // A-Z
    else if (code >= 65 && code <= 90) n++
    // a-z
    else if (code >= 97 && code <= 122) n++
    // Acentos castellanos comunes (á é í ó ú ñ ü y mayúsculas)
    else if (code === 225 || code === 233 || code === 237 || code === 243 ||
             code === 250 || code === 241 || code === 252 || code === 193 ||
             code === 201 || code === 205 || code === 211 || code === 218 ||
             code === 209 || code === 220) n++
  }
  return n
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    workerInitialized = true
  }
  return pdfjs
}

/**
 * Cap de páginas que leemos al extraer texto. Una boleta chilena son
 * 1-3 páginas; >10 páginas es probablemente un PDF bomb o un manual.
 */
const MAX_PDF_PAGES_FOR_TEXT = 10

/**
 * Extrae el texto de un PDF en el navegador. Carga `pdfjs-dist` con un
 * dynamic import para que `next build` no intente evaluarlo en SSR
 * (donde `DOMMatrix` no existe).
 *
 * Errores comunes y su traducción a mensajes de usuario:
 *   - PDF protegido con password: pdfjs lanza PasswordException.
 *   - PDF corrupto: pdfjs lanza InvalidPDFException.
 *   - PDF vacío (0 páginas): devolvemos string vacío.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('extractTextFromPDF solo puede ejecutarse en el navegador.')
  }

  const pdfjs = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()

  let pdf
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  } catch (err) {
    const name = (err as { name?: string })?.name ?? ''
    const msg = (err as { message?: string })?.message ?? String(err)
    if (name === 'PasswordException' || /password/i.test(msg)) {
      throw new Error(
        'Este PDF está protegido con contraseña. Remové la protección antes de subirlo (en Acrobat: Archivo > Propiedades > Seguridad > Sin seguridad).',
      )
    }
    if (name === 'InvalidPDFException' || /invalid/i.test(msg)) {
      throw new Error(
        'El PDF parece estar corrupto o incompleto. Prueba descargarlo de nuevo desde el sitio de la empresa.',
      )
    }
    throw new Error(`No pudimos abrir el PDF: ${msg}`)
  }

  const pagesToRead = Math.min(pdf.numPages, MAX_PDF_PAGES_FOR_TEXT)
  const pages: string[] = []
  for (let i = 1; i <= pagesToRead; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const txt = content.items
      .map((item) => ('str' in item ? (item as TextItem).str : ''))
      .join(' ')
    pages.push(txt)
  }
  return pages.join('\n')
}

/**
 * Renderiza TODAS las páginas del PDF a PNG y las une como un canvas
 * vertical único. Usado como fallback cuando un PDF no tiene capa de
 * texto (escaneo) y debemos pasarlo por OCR.
 *
 * Render a 2x escala (~144 DPI desde el viewport por defecto de 72):
 * suficiente para Tesseract sin inflar memoria desproporcionadamente.
 *
 * Cap de páginas: 5. Una boleta chilena típica son 1-2 páginas; >5
 * son sospechosas (alguien subió un PDF de un libro entero) y la
 * memoria explota.
 */
const MAX_PDF_PAGES_TO_RASTERIZE = 5
const PDF_RASTERIZE_SCALE = 2
const MAX_RASTERIZED_HEIGHT_PX = 12_000

async function rasterizePdfPages(file: File): Promise<Blob | null> {
  if (typeof window === 'undefined') return null
  const pdfjs = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  if (pdf.numPages < 1) return null

  const pagesToRender = Math.min(pdf.numPages, MAX_PDF_PAGES_TO_RASTERIZE)
  const pageCanvases: HTMLCanvasElement[] = []
  let totalHeight = 0
  let maxWidth = 0

  for (let i = 1; i <= pagesToRender; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: PDF_RASTERIZE_SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    pageCanvases.push(canvas)
    totalHeight += canvas.height
    maxWidth = Math.max(maxWidth, canvas.width)

    // Cap defensivo: si la altura acumulada explota, frenamos.
    if (totalHeight > MAX_RASTERIZED_HEIGHT_PX) break
  }

  if (pageCanvases.length === 0) return null
  if (pageCanvases.length === 1) {
    // Caso único, evitamos copia adicional al canvas combinado.
    return new Promise<Blob | null>((resolve) => {
      pageCanvases[0].toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  // Combinar verticalmente.
  const combined = document.createElement('canvas')
  combined.width = maxWidth
  combined.height = totalHeight
  const cctx = combined.getContext('2d')
  if (!cctx) return null
  cctx.fillStyle = '#ffffff'
  cctx.fillRect(0, 0, combined.width, combined.height)
  let y = 0
  for (const c of pageCanvases) {
    cctx.drawImage(c, 0, y)
    y += c.height
  }

  return new Promise<Blob | null>((resolve) => {
    combined.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/**
 * Extrae texto de un archivo de boleta, PDF nativo o imagen (jpg/png/webp).
 *
 *   - PDF con capa de texto: extracción directa con pdfjs.
 *   - PDF escaneado (sin capa de texto): rasteriza hasta 5 páginas y
 *     las pasa por Tesseract como una imagen vertical combinada.
 *   - Imagen JPG/PNG/WebP: directo a Tesseract.
 *   - HEIC/HEIF (iOS): error claro con instrucción para convertir.
 *
 * `onProgress` recibe actualizaciones útiles para UI en el caso OCR.
 */
export async function extractTextFromBoleta(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  if (isHeicFile(file)) {
    throw new Error(
      'iOS guarda fotos en formato HEIC, que el navegador no puede leer. En tu iPhone: Ajustes > Cámara > Formatos > "Más compatible" (JPEG). O convertí la foto a JPG antes de subirla.',
    )
  }

  if (file.type === 'application/pdf') {
    const text = await extractTextFromPDF(file)
    if (countAlphanumeric(text) >= PDF_TEXT_LAYER_THRESHOLD) return text

    // Fallback: PDF parece escaneo. Rasterizar y OCR.
    const rasterized = await rasterizePdfPages(file)
    if (!rasterized) {
      throw new Error(
        'No pudimos leer el PDF. Si es un escaneo, prueba con la versión digital descargada del sitio de la empresa.',
      )
    }
    const asFile = new File([rasterized], 'pdf-page.png', {
      type: 'image/png',
    })
    return extractTextFromImage(asFile, onProgress)
  }

  if (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp' ||
    // Algunos navegadores Android mandan MIME genérico; aceptamos por
    // extensión si el header dice "image/*" o si está vacío.
    (file.type.startsWith('image/') && file.type.length > 0)
  ) {
    return extractTextFromImage(file, onProgress)
  }

  throw new Error(
    `Formato no soportado: ${file.type || 'desconocido'}. Aceptamos PDF, JPG, PNG y WebP.`,
  )
}

/**
 * Wrapper backward-compat para detectar distribuidora eléctrica.
 */
export function detectDistribuidora(text: string): EmpresaElectrica | null {
  const m = detectParser(text)
  if (!m) return null
  if (m.servicio !== 'electricidad') return null
  return m.empresa as EmpresaElectrica
}

/**
 * Wrapper para detectar sanitaria (servicio agua).
 */
export function detectSanitaria(text: string): EmpresaSanitaria | null {
  const m = detectParser(text)
  if (!m) return null
  if (m.servicio !== 'agua') return null
  return m.empresa as EmpresaSanitaria
}

/**
 * Wrapper para detectar empresa de gas (red o GLP cilindros).
 */
export function detectGas(text: string): EmpresaGas | null {
  const m = detectParser(text)
  if (!m) return null
  if (m.servicio !== 'gas') return null
  return m.empresa as EmpresaGas
}
