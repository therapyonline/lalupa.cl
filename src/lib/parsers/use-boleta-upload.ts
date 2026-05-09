'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  StorageBlockedError,
  StorageQuotaError,
  safeSessionSet,
} from '@/lib/session-storage'
import {
  detectGas,
  detectDistribuidora,
  detectSanitaria,
  disposeOcrWorker,
  extractTextFromBoleta,
  extractTextFromImages,
  AGUA_SLUGS,
  EMPRESA_SLUGS,
  GAS_SLUGS,
  type EmpresaElectrica,
  type EmpresaGas,
  type EmpresaSanitaria,
  type OcrProgress,
} from '.'

const SESSION_KEY = 'lalupa:lastParsed'

const STATUS_LABELS: Record<string, string> = {
  'loading tesseract core': 'Cargando OCR…',
  'initializing tesseract': 'Inicializando OCR…',
  'loading language traineddata': 'Cargando español…',
  'initializing api': 'Preparando…',
  'recognizing text': 'Leyendo la boleta…',
}

function formatOcrStatus(p: OcrProgress): string {
  const label = STATUS_LABELS[p.status] ?? 'Procesando…'
  if (p.status === 'recognizing text') {
    return `${label} ${Math.round(p.progress * 100)}%`
  }
  return label
}

interface UploadConfig<E extends string, S extends string> {
  servicio: 'electricidad' | 'agua' | 'gas'
  basePath: '/boleta-luz' | '/boleta-agua' | '/boleta-gas'
  detect: (text: string) => E | null
  slugs: Record<E, S>
  notFoundMessage: string
}

const CONFIGS = {
  luz: {
    servicio: 'electricidad' as const,
    basePath: '/boleta-luz' as const,
    detect: detectDistribuidora,
    slugs: EMPRESA_SLUGS,
    notFoundMessage:
      'No pudimos identificar la distribuidora desde tu boleta. Elegila manualmente más abajo.',
  } satisfies UploadConfig<EmpresaElectrica, string>,
  agua: {
    servicio: 'agua' as const,
    basePath: '/boleta-agua' as const,
    detect: detectSanitaria,
    slugs: AGUA_SLUGS,
    notFoundMessage:
      'No pudimos identificar la sanitaria desde tu boleta. Elegila manualmente más abajo.',
  } satisfies UploadConfig<EmpresaSanitaria, string>,
  gas: {
    servicio: 'gas' as const,
    basePath: '/boleta-gas' as const,
    detect: detectGas,
    slugs: GAS_SLUGS,
    notFoundMessage:
      'No pudimos identificar la empresa de gas desde tu boleta. Elegila manualmente más abajo.',
  } satisfies UploadConfig<EmpresaGas, string>,
} as const

export interface UploadError {
  message: string
  /** Texto crudo extraído (si llegamos a esa etapa). Útil para mostrar al usuario qué leímos. */
  extractedText?: string
}

/**
 * Hook compartido por los 3 upload-hubs (luz, agua, gas). Centraliza:
 *
 *   - extracción de texto (PDF directo o OCR de imagen)
 *   - detección de empresa
 *   - guardado en sessionStorage con manejo de QuotaExceeded / Private Mode
 *   - redirección a la página de resultado
 *   - cleanup del worker de Tesseract en unmount
 *   - cancelación de uploads stale (si el usuario sube 2 veces antes de
 *     que termine la primera o navega mientras se procesa)
 *   - estado de progreso para mostrar UI de OCR
 */
export function useBoletaUpload(servicio: 'luz' | 'agua' | 'gas') {
  const router = useRouter()
  const [error, setError] = useState<UploadError | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)
  /**
   * Generación del upload actual. Cada nuevo handleFile incrementa
   * generationRef. Si una operación async termina y la generación cambió,
   * descartamos su resultado (el usuario subió otra cosa o navegó).
   */
  const generationRef = useRef(0)
  /** Marca si el componente está montado, evita setState post-unmount. */
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Libera el Worker de Tesseract al desmontar, evita ~50 MB de memoria
      // residual si el usuario navega sin haber subido foto en este viaje.
      void disposeOcrWorker()
    }
  }, [])

  async function handleFiles(files: File[]) {
    const config = CONFIGS[servicio]
    const myGeneration = ++generationRef.current

    setError(null)
    setOcrStatus(null)

    let extractedText: string | undefined
    try {
      const isMultiImage =
        files.length > 1 && files.every((f) => f.type.startsWith('image/'))
      const isSingleImage =
        files.length === 1 && files[0].type.startsWith('image/')

      if (isMultiImage) {
        // Multi-imagen: OCR cada una y concatena.
        const onMultiProgress = (
          p: OcrProgress,
          pageIdx: number,
          total: number,
        ) => {
          if (generationRef.current !== myGeneration) return
          if (!mountedRef.current) return
          const inner = formatOcrStatus(p)
          setOcrStatus(`Foto ${pageIdx} de ${total}: ${inner}`)
        }
        extractedText = await extractTextFromImages(files, onMultiProgress)
      } else {
        const file = files[0]
        const onProgress = isSingleImage
          ? (p: OcrProgress) => {
              if (generationRef.current !== myGeneration) return
              if (!mountedRef.current) return
              setOcrStatus(formatOcrStatus(p))
            }
          : undefined
        extractedText = await extractTextFromBoleta(file, onProgress)
      }

      // Si llegó otro upload o el usuario navegó mientras corríamos OCR,
      // descartamos el resultado.
      if (generationRef.current !== myGeneration || !mountedRef.current) {
        return
      }

      setOcrStatus(null)

      if (!extractedText.trim()) {
        const isImageUpload = files.every((f) => f.type.startsWith('image/'))
        throw new Error(
          isImageUpload
            ? 'No pudimos leer texto en la imagen. Prueba con una foto más nítida y derecha, o sube el PDF.'
            : 'No pudimos extraer texto del PDF. Prueba con la versión digital descargada del sitio de la empresa.',
        )
      }

      const empresa = config.detect(extractedText)
      if (!empresa) {
        throw new Error(config.notFoundMessage)
      }

      const slug = config.slugs[empresa as keyof typeof config.slugs]
      const payload = {
        servicio: config.servicio,
        empresa,
        slug,
        rawText: extractedText,
        timestamp: Date.now(),
      }

      try {
        safeSessionSet(SESSION_KEY, JSON.stringify(payload))
      } catch (e) {
        if (e instanceof StorageQuotaError || e instanceof StorageBlockedError) {
          throw e
        }
        throw new Error('No pudimos guardar la boleta para mostrarte el resultado. Reintenta refrescando la pestaña.')
      }

      // Si el componente se desmontó mientras serializábamos, no navegar.
      if (generationRef.current !== myGeneration || !mountedRef.current) {
        return
      }

      router.push(`${config.basePath}/${slug}`)
    } catch (err) {
      // Si esta operación quedó stale (otro upload empezó), no toques UI.
      if (generationRef.current !== myGeneration || !mountedRef.current) {
        return
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Algo salió mal procesando tu boleta.'
      setError({ message, extractedText })
      setOcrStatus(null)
      setResetKey((k) => k + 1)
    }
  }

  return {
    handleFiles,
    error,
    ocrStatus,
    resetKey,
  }
}
