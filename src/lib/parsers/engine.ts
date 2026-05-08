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
 * Umbral mínimo de texto para considerar que un PDF tiene capa de texto
 * legible. Un PDF escaneado (imagen-only) suele entregar 0-30 chars de
 * metadata; un PDF nativo con boleta entrega cientos.
 */
const PDF_TEXT_LAYER_THRESHOLD = 50

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  if (!workerInitialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    workerInitialized = true
  }
  return pdfjs
}

/**
 * Extrae el texto de un PDF en el navegador. Carga `pdfjs-dist` con un
 * dynamic import para que `next build` no intente evaluarlo en SSR
 * (donde `DOMMatrix` no existe).
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('extractTextFromPDF solo puede ejecutarse en el navegador.')
  }

  const pdfjs = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
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
 * Renderiza la primera página del PDF a PNG. Usado como fallback cuando
 * un PDF no tiene capa de texto (escaneo) y debemos pasarlo por OCR.
 *
 * Render a 2x escala (~144 DPI desde el viewport por defecto de 72) —
 * suficiente para Tesseract sin inflar memoria desproporcionadamente.
 */
async function rasterizePdfFirstPage(file: File): Promise<Blob | null> {
  if (typeof window === 'undefined') return null
  const pdfjs = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  if (pdf.numPages < 1) return null
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2 })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  await page.render({ canvasContext: ctx, viewport, canvas }).promise

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/**
 * Extrae texto de un archivo de boleta — PDF nativo o imagen (jpg/png).
 *
 *   - PDF con capa de texto: extracción directa con pdfjs.
 *   - PDF escaneado (sin capa de texto): rasteriza la primera página
 *     y la pasa por Tesseract.
 *   - Imagen JPG/PNG: directo a Tesseract.
 *
 * `onProgress` recibe actualizaciones útiles para UI en el caso OCR.
 */
export async function extractTextFromBoleta(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  if (file.type === 'application/pdf') {
    const text = await extractTextFromPDF(file)
    if (text.trim().length >= PDF_TEXT_LAYER_THRESHOLD) return text

    // Fallback: PDF parece escaneo. Rasterizar y OCR.
    const rasterized = await rasterizePdfFirstPage(file)
    if (!rasterized) return text
    const asFile = new File([rasterized], 'pdf-page.png', {
      type: 'image/png',
    })
    return extractTextFromImage(asFile, onProgress)
  }
  if (file.type.startsWith('image/'))
    return extractTextFromImage(file, onProgress)
  throw new Error(
    `Formato no soportado: ${file.type || 'desconocido'}. Solo PDF, JPG o PNG.`,
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
