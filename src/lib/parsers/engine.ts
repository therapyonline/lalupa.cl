// Side-effect import: garantiza que los módulos de electricidad, agua y
// gas estén registrados antes de que `detectDistribuidora`,
// `detectSanitaria`, `detectGas` o `detectParser` se invoquen.
import './electricidad'
import './agua'
import './gas'

import { extractPdfWithOcr } from './pdf'
import { normalizeBoletaFile } from './file-input'
export { extractTextFromPDF } from './pdf'
export { countAlphanumeric } from './text-utils'
import { extractTextFromImage, type OcrProgress } from './ocr'
import { detectParser } from './registry'
import type { EmpresaElectrica, EmpresaGas, EmpresaSanitaria } from './types'

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
 * Cap de imágenes que aceptamos en una sola subida múltiple.  Boletas
 * típicas chilenas son 1-3 páginas; >5 fotos sugiere uso indebido.
 */
const MAX_IMAGES_PER_UPLOAD = 5

/**
 * Multi-page version: acepta varias imágenes (típicamente fotos de
 * páginas distintas del mismo PDF físico) y devuelve el texto concatenado
 * con separador de página.
 *
 * Restricción: las múltiples solo aplican a IMÁGENES. Si el caller manda
 * un PDF, debe ser un único archivo.
 *
 * `onProgress` recibe el progreso del OCR de la imagen ACTUAL; el caller
 * puede mantener un contador separado de "página X de N".
 */
export async function extractTextFromImages(
  files: File[],
  onProgress?: (p: OcrProgress, pageIndex: number, totalPages: number) => void,
): Promise<string> {
  if (files.length === 0) {
    throw new Error('No pudimos leer ningún archivo.')
  }
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    throw new Error(
      `Aceptamos hasta ${MAX_IMAGES_PER_UPLOAD} imágenes por boleta. Si tu PDF tiene más páginas, súbelo directamente como PDF.`,
    )
  }
  for (const f of files) {
    if (isHeicFile(f)) {
      throw new Error(
        'iOS guarda fotos en formato HEIC, que el navegador no puede leer. En tu iPhone: Ajustes > Cámara > Formatos > "Más compatible" (JPEG). O convierte la foto a JPG antes de subirla.',
      )
    }
    if (!normalizeBoletaFile(f).type.startsWith('image/')) {
      throw new Error(
        `Para subir varias páginas, cada archivo debe ser imagen (JPG/PNG/WebP). Si quieres subir un PDF, mándalo como un único archivo.`,
      )
    }
  }

  const texts: string[] = []
  for (let i = 0; i < files.length; i++) {
    try {
      texts.push(
        await extractTextFromImage(normalizeBoletaFile(files[i]), (p) =>
          onProgress?.(p, i + 1, files.length),
        ),
      )
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'No pudimos leer la imagen.'
      throw new Error(
        `No pudimos completar la página ${i + 1} de ${files.length}. ${reason}`,
      )
    }
  }
  return texts.join('\n\n')
}

/**
 * Extrae texto de un archivo de boleta, PDF nativo o imagen (jpg/png/webp).
 *
 *   - PDF con capa de texto: extracción directa con pdfjs.
 *   - PDF mixto/escaneado: OCR por página, con canvas acotado y liberado.
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
      'iOS guarda fotos en formato HEIC, que el navegador no puede leer. En tu iPhone: Ajustes > Cámara > Formatos > "Más compatible" (JPEG). O convierte la foto a JPG antes de subirla.',
    )
  }

  file = normalizeBoletaFile(file)
  if (file.type === 'application/pdf')
    return extractPdfWithOcr(file, onProgress)
  if (file.type.startsWith('image/'))
    return extractTextFromImage(file, onProgress)

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
