/**
 * OCR client-side: extrae texto de una imagen de boleta usando Tesseract.js.
 * Carga la librería con dynamic import para no inflar el bundle inicial,
 * y reutiliza el mismo Worker entre llamadas dentro de la sesión.
 *
 * Antes de pasar a Tesseract, aplicamos un preprocesado mínimo
 * (grayscale + contrast stretch), mejora la precisión en fotos de
 * celular con sombras o papel térmico desteñido.
 */
import { PARSER_ASSETS } from '@/generated/parser-assets'
import { normalizeOcrText } from './_helpers'
import { preprocessImageForOcr } from './image-preprocess'

export type OcrProgress = {
  /** Etapa actual del worker (loading, recognizing, etc.). */
  status: string
  /** Progreso 0-1 dentro de la etapa actual. */
  progress: number
}

type TesseractWorker = Awaited<
  ReturnType<typeof import('tesseract.js').createWorker>
>

let progressListener: ((p: OcrProgress) => void) | undefined
let workerGeneration = 0
let queue: Promise<unknown> = Promise.resolve()

let workerPromise: Promise<TesseractWorker> | null = null

async function getWorker(): Promise<TesseractWorker> {
  if (workerPromise) return workerPromise

  const generation = ++workerGeneration
  workerPromise = (async () => {
    const { createWorker, PSM } = await import('tesseract.js')
    const worker = await createWorker('spa', 1, {
      // Servir todos los assets desde el mismo origen, sin CDN externo.
      // Setup automático en `pnpm install` via scripts/setup-tesseract.mjs.
      workerPath: `${PARSER_ASSETS.ocrBase}/worker.min.js`,
      corePath: `${PARSER_ASSETS.ocrBase}/core`,
      langPath: `${PARSER_ASSETS.ocrBase}/lang`,
      cachePath: PARSER_ASSETS.ocrBase,
      // Los archivos del modelo se sirven con .gz desde Vercel
      gzip: true,
      logger: (m: OcrProgress) => {
        if (generation === workerGeneration)
          progressListener?.({ status: m.status, progress: m.progress })
      },
    })

    // Tuning específico para boletas chilenas. Probado contra fotos de
    // celular con iluminación irregular y papel térmico desteñido.
    //
    //   - preserve_interword_spaces: 1 → mantiene los espacios entre
    //     palabras, crítico para que "Cargo fijo" no se vuelva
    //     "Cargofijo" y los regex matcheen.
    //   - user_defined_dpi: 300 → Tesseract está optimizado para 300dpi.
    //     Sin esto, fotos celulares (típicamente equivalente a 72dpi)
    //     reducen confidence porque el modelo asume baja resolución.
    //   - tessedit_pageseg_mode: 6 (SINGLE_BLOCK) → trata la boleta como
    //     un bloque uniforme. AUTO (default 3) divide a veces mal y se
    //     come secciones de cargos. SINGLE_BLOCK es más confiable para
    //     este tipo de documento (texto + tabla simple).
    try {
      await worker.setParameters({
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      })
    } catch (error) {
      await worker.terminate().catch(() => undefined)
      throw error
    }

    return worker
  })()

  return workerPromise
}

/** Timeout total del pipeline OCR (worker boot + preprocesado + recognize). */
const OCR_TIMEOUT_MS = 90_000

/**
 * Mínimo de caracteres alfanuméricos para considerar el resultado OCR
 * "tiene contenido". Una boleta chilena (incluso medio rota) tiene >200
 * letras y números; <30 es ruido o foto fallida.
 */
const OCR_MIN_MEANINGFUL_CHARS = 30

function countAlphanumeric(text: string): number {
  let n = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122)
    )
      n++
  }
  return n
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} excedió el timeout de ${Math.round(ms / 1000)}s. Prueba con una imagen más chica o el PDF original.`,
        ),
      )
    }, ms)
    promise
      .then((v) => {
        clearTimeout(timer)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(timer)
        reject(e)
      })
  })
}

/**
 * Reconoce el texto de una imagen (jpg/png) usando Tesseract en español.
 * El procesamiento ocurre en un Web Worker en este mismo navegador.
 *
 * `onProgress` (opcional) recibe actualizaciones de status + progreso 0-1.
 * Etapas típicas: 'loading tesseract core', 'initializing tesseract',
 * 'loading language traineddata', 'recognizing text'.
 *
 * Si el pipeline excede `OCR_TIMEOUT_MS` (90s), aborta con error claro.
 */
async function recognizeImage(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error(
      'extractTextFromImage solo puede ejecutarse en el navegador.',
    )
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('extractTextFromImage requiere un archivo de imagen.')
  }

  progressListener = onProgress
  let cancelled = false
  const run = (async () => {
    const worker = await getWorker()
    if (cancelled) throw new Error('Lectura cancelada.')
    const preprocessed = await preprocessImageForOcr(file)
    if (cancelled) throw new Error('Lectura cancelada.')
    const result = await worker.recognize(preprocessed)
    // tesseract.js v7's RecognizeResult exposes the text on `data.text` (or
    // `data.blocks[*].text`). We normalize defensively.
    const data = (
      result as {
        data: { text?: string; confidence?: number }
      }
    ).data
    const rawText = data?.text ?? ''

    // Validación post-OCR: si Tesseract devuelve básicamente nada o
    // confidence muy baja, mejor avisar al usuario que dejarle ver una
    // detección fallida más adelante con un error críptico.
    const meaningfulChars = countAlphanumeric(rawText)
    if (meaningfulChars < OCR_MIN_MEANINGFUL_CHARS) {
      throw new Error(
        `El OCR no logró leer texto en la imagen (${meaningfulChars} chars reconocibles). Prueba con una foto más nítida, mejor iluminada y sin recortes que tapen el texto. Si el original es PDF, sube el PDF directamente.`,
      )
    }

    // Corrige errores típicos de Tesseract antes de pasarle el texto a
    // los parsers (ej. "AUT:" → "RUT:" cuando OCR confunde A con R).
    return normalizeOcrText(rawText)
  })()

  try {
    return await withTimeout(run, OCR_TIMEOUT_MS, 'El OCR')
  } catch (err) {
    cancelled = true
    // En cualquier fallo del pipeline (timeout o crash), descartamos el
    // worker, la próxima llamada construirá uno limpio.
    void disposeOcrWorker()
    throw err
  } finally {
    progressListener = undefined
  }
}

/**
 * Libera el worker (útil al desmontar pantallas que ya no necesitan OCR).
 * Volver a llamar `extractTextFromImage` recreará el worker.
 *
 * Importante: nullificamos `workerPromise` ANTES de awaitar el terminate,
 * para evitar que un nuevo caller (e.g. AddPagesButton en result-view)
 * agarre la promesa del worker que se está muriendo.
 */
export async function disposeOcrWorker(): Promise<void> {
  const p = workerPromise
  if (!p) return
  workerPromise = null
  workerGeneration++
  try {
    const worker = await p
    await worker.terminate()
  } catch {
    // ya estaba en proceso de terminación o falló, no es bloqueante
  }
}

/** Serializa trabajos para no mezclar reconocimiento ni progreso de dos llamadas. */
export function extractTextFromImage(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const run = queue.then(() => recognizeImage(file, onProgress))
  queue = run.catch(() => undefined)
  return run
}
