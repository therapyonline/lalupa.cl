/**
 * OCR client-side: extrae texto de una imagen de boleta usando Tesseract.js.
 * Carga la librería con dynamic import para no inflar el bundle inicial,
 * y reutiliza el mismo Worker entre llamadas dentro de la sesión.
 *
 * Antes de pasar a Tesseract, aplicamos un preprocesado mínimo
 * (grayscale + contrast stretch), mejora la precisión en fotos de
 * celular con sombras o papel térmico desteñido.
 */
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

let workerPromise: Promise<TesseractWorker> | null = null

async function getWorker(
  onProgress?: (p: OcrProgress) => void,
): Promise<TesseractWorker> {
  if (workerPromise) return workerPromise

  workerPromise = (async () => {
    const { createWorker } = await import('tesseract.js')
    return createWorker('spa', 1, {
      // Servir todos los assets desde el mismo origen, sin CDN externo.
      // Setup automático en `pnpm install` via scripts/setup-tesseract.mjs.
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/core',
      langPath: '/tesseract/lang',
      // Los archivos del modelo se sirven con .gz desde Vercel
      gzip: true,
      logger: onProgress
        ? (m: { status: string; progress: number }) =>
            onProgress({ status: m.status, progress: m.progress })
        : undefined,
    })
  })()

  return workerPromise
}

/** Timeout total del pipeline OCR (worker boot + preprocesado + recognize). */
const OCR_TIMEOUT_MS = 90_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} excedió el timeout de ${Math.round(ms / 1000)}s. Probá con una imagen más chica o el PDF original.`,
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
export async function extractTextFromImage(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('extractTextFromImage solo puede ejecutarse en el navegador.')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('extractTextFromImage requiere un archivo de imagen.')
  }

  const run = (async () => {
    const worker = await getWorker(onProgress)
    const preprocessed = await preprocessImageForOcr(file)
    const result = await worker.recognize(preprocessed)
    // tesseract.js v7's RecognizeResult exposes the text on `data.text` (or
    // `data.blocks[*].text`). We normalize defensively.
    const data = (result as { data: { text?: string } }).data
    return data?.text ?? ''
  })()

  try {
    return await withTimeout(run, OCR_TIMEOUT_MS, 'El OCR')
  } catch (err) {
    // En cualquier fallo del pipeline (timeout o crash), descartamos el
    // worker, la próxima llamada construirá uno limpio.
    void disposeOcrWorker()
    throw err
  }
}

/**
 * Libera el worker (útil al desmontar pantallas que ya no necesitan OCR).
 * Volver a llamar `extractTextFromImage` recreará el worker.
 */
export async function disposeOcrWorker(): Promise<void> {
  if (!workerPromise) return
  try {
    const worker = await workerPromise
    await worker.terminate()
  } finally {
    workerPromise = null
  }
}
