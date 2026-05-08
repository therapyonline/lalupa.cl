'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { FileDrop } from '@/components/ui/FileDrop'
import { ExtractedTextPreview } from '@/components/parsers/ExtractedTextPreview'
import { OcrPhotoTips } from '@/components/parsers/OcrPhotoTips'
import {
  EMPRESA_SLUGS,
  detectDistribuidora,
  disposeOcrWorker,
  extractTextFromBoleta,
  type OcrProgress,
} from '@/lib/parsers'

const SESSION_KEY = 'lalupa:lastParsed'

interface ErrorState {
  message: string
  extractedText?: string
}

export function UploadHub() {
  const router = useRouter()
  const [error, setError] = useState<ErrorState | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)

  // Libera el Worker de Tesseract al desmontar, evita ~50 MB de memoria
  // residual si el usuario navega sin haber subido foto en este viaje.
  useEffect(() => {
    return () => {
      void disposeOcrWorker()
    }
  }, [])

  async function handleFile(file: File) {
    setError(null)
    setOcrStatus(null)
    let extractedText: string | undefined
    try {
      const isImage = file.type.startsWith('image/')
      const onProgress = isImage
        ? (p: OcrProgress) => {
            setOcrStatus(formatOcrStatus(p))
          }
        : undefined

      extractedText = await extractTextFromBoleta(file, onProgress)
      setOcrStatus(null)

      if (!extractedText.trim()) {
        throw new Error(
          isImage
            ? 'No pudimos leer texto en la imagen. Probá con una foto más nítida y derecha, o subí el PDF.'
            : 'No pudimos extraer texto del PDF, ni siquiera con OCR de la primera página. Probá con la versión digital descargada del sitio de la empresa.',
        )
      }

      const empresa = detectDistribuidora(extractedText)
      if (!empresa) {
        throw new Error(
          'No pudimos identificar la distribuidora desde tu boleta. Elegila manualmente más abajo.',
        )
      }

      const slug = EMPRESA_SLUGS[empresa]
      const payload = {
        servicio: 'electricidad' as const,
        empresa,
        slug,
        rawText: extractedText,
        timestamp: Date.now(),
      }

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
      router.push(`/boleta-luz/${slug}`)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Algo salió mal procesando tu boleta.'
      setError({ message, extractedText })
      setOcrStatus(null)
      setResetKey((k) => k + 1)
    }
  }

  return (
    <div>
      <FileDrop key={resetKey} onFile={handleFile} statusMessage={ocrStatus} />
      <OcrPhotoTips />
      {error && (
        <div className="mt-6">
          <Alert variant="warning">
            <Alert.Title>No pudimos procesar tu boleta</Alert.Title>
            <Alert.Body>{error.message}</Alert.Body>
          </Alert>
          {error.extractedText && (
            <ExtractedTextPreview
              text={error.extractedText}
              className="mt-4"
            />
          )}
        </div>
      )}
    </div>
  )
}

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
