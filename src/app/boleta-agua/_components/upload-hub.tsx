'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FileDrop } from '@/components/ui/FileDrop'
import { ExtractedTextPreview } from '@/components/parsers/ExtractedTextPreview'
import { OcrPhotoTips } from '@/components/parsers/OcrPhotoTips'
import {
  AGUA_SLUGS,
  detectParser,
  disposeOcrWorker,
  extractTextFromBoleta,
  type EmpresaSanitaria,
  type OcrProgress,
} from '@/lib/parsers'

const SESSION_KEY = 'lalupa:lastParsed'

interface ErrorState {
  message: string
  extractedText?: string
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

export function UploadHubAgua() {
  const router = useRouter()
  const [error, setError] = useState<ErrorState | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string | null>(null)

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
        ? (p: OcrProgress) => setOcrStatus(formatOcrStatus(p))
        : undefined

      extractedText = await extractTextFromBoleta(file, onProgress)
      setOcrStatus(null)

      if (!extractedText.trim()) {
        throw new Error(
          isImage
            ? 'No pudimos leer texto en la imagen. Probá con una foto más nítida y derecha, o subí el PDF.'
            : 'No pudimos extraer texto del PDF, ni siquiera con OCR de la primera página. Probá con la versión digital descargada del sitio de la sanitaria.',
        )
      }

      const parser = detectParser(extractedText)
      if (!parser) {
        throw new Error(
          'No pudimos identificar la sanitaria desde tu boleta. Elegila manualmente más abajo.',
        )
      }

      if (parser.servicio !== 'agua') {
        throw new Error(
          `Detectamos que esto parece una boleta de ${parser.servicio} (${parser.empresa}), no de agua. Subila en la página correspondiente.`,
        )
      }

      const empresa = parser.empresa as EmpresaSanitaria
      const slug = AGUA_SLUGS[empresa]
      if (!slug) {
        throw new Error(
          `${empresa} fue detectada pero su slug de URL no está mapeado. Reportar bug.`,
        )
      }

      const payload = {
        servicio: 'agua' as const,
        empresa,
        slug,
        rawText: extractedText,
        timestamp: Date.now(),
      }

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
      router.push(`/boleta-agua/${slug}`)
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
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/boleta-luz">Ver boleta de luz</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
