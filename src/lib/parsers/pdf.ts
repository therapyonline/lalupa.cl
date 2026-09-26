import type { PDFPageProxy } from 'pdfjs-dist'
import { PARSER_ASSETS } from '@/generated/parser-assets'
import { joinPdfTextItems } from './pdf-text'
import { countAlphanumeric } from './text-utils'
import { extractTextFromImage, type OcrProgress } from './ocr'
import { normalizeBoletaFile } from './file-input'

export const MAX_PDF_PAGES = 10
const MAX_CANVAS_PIXELS = 4_000_000
const MAX_CANVAS_SIDE = 2400

export function pdfRasterScale(width: number, height: number): number {
  if (![width, height].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error('El PDF tiene dimensiones de página inválidas.')
  }
  const scale = Math.min(
    2,
    MAX_CANVAS_SIDE / width,
    MAX_CANVAS_SIDE / height,
    Math.sqrt(MAX_CANVAS_PIXELS / width / height),
  )
  if (Math.min(width, height) * scale < 32) {
    throw new Error(
      'La página es demasiado estrecha para leerla. Sube el PDF original de la empresa.',
    )
  }
  return scale
}

async function imageFromPage(page: PDFPageProxy): Promise<File> {
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({
    scale: pdfRasterScale(base.width, base.height),
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  try {
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error('Tu navegador no pudo preparar la imagen de la página.')
    await page.render({ canvasContext: context, viewport, canvas }).promise
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    if (!blob) throw new Error('No pudimos convertir la página a imagen.')
    return new File([blob], `pagina-${page.pageNumber}.png`, {
      type: 'image/png',
    })
  } finally {
    canvas.width = canvas.height = 0
  }
}

async function readPdf(
  file: File,
  useOcr: boolean,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  if (typeof window === 'undefined')
    throw new Error('El lector PDF solo puede ejecutarse en el navegador.')
  file = normalizeBoletaFile(file)
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = PARSER_ASSETS.pdfWorker
  const task = pdfjs.getDocument({
    data: await file.arrayBuffer(),
    disableFontFace: true,
    useWorkerFetch: false,
    verbosity: 0,
    cMapUrl: `${PARSER_ASSETS.pdfBase}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PARSER_ASSETS.pdfBase}/standard_fonts/`,
    wasmUrl: `${PARSER_ASSETS.pdfBase}/wasm/`,
    maxImageSize: 16_000_000,
    canvasMaxAreaInBytes: MAX_CANVAS_PIXELS * 4,
  })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const pdf = await Promise.race([
      task.promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                'El PDF tardó demasiado en abrir. Intenta descargarlo de nuevo.',
              ),
            ),
          30_000,
        )
      }),
    ])
    clearTimeout(timeout)
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(
        `El PDF tiene ${pdf.numPages} páginas. Aceptamos hasta ${MAX_PDF_PAGES}; divide el documento antes de subirlo.`,
      )
    }
    const texts: string[] = []
    for (let index = 1; index <= pdf.numPages; index++) {
      const page = await pdf.getPage(index)
      const report = (p: OcrProgress) =>
        onProgress?.({
          status: `Página ${index} de ${pdf.numPages}: ${p.status}`,
          progress: (index - 1 + p.progress) / pdf.numPages,
        })
      try {
        report({ status: 'Leyendo PDF', progress: 0 })
        const text = joinPdfTextItems((await page.getTextContent()).items)
        texts.push(
          useOcr && countAlphanumeric(text) < 50
            ? await extractTextFromImage(await imageFromPage(page), report)
            : text,
        )
        report({ status: 'Leída', progress: 1 })
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'No pudimos leerla.'
        throw new Error(
          `No pudimos completar la página ${index} de ${pdf.numPages}. ${reason}`,
        )
      } finally {
        page.cleanup()
      }
    }
    return texts.join('\n\n')
  } catch (error) {
    if ((error as Error).name === 'PasswordException')
      throw new Error(
        'Este PDF está protegido con contraseña. Quita la protección antes de subirlo.',
      )
    if ((error as Error).name === 'InvalidPDFException')
      throw new Error(
        'El PDF parece estar corrupto o incompleto. Descárgalo de nuevo desde la empresa.',
      )
    throw error
  } finally {
    clearTimeout(timeout)
    await task.destroy()
  }
}

export const extractTextFromPDF = (file: File) => readPdf(file, false)
export const extractPdfWithOcr = (
  file: File,
  onProgress?: (p: OcrProgress) => void,
) => readPdf(file, true, onProgress)
