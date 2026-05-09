'use client'

import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { extractTextFromImages, type OcrProgress } from '@/lib/parsers'

const MAX_ADDITIONAL_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024
const HEIC_EXT = ['.heic', '.heif']

interface Props {
  /**
   * Llamado con el texto OCR de las nuevas imágenes (ya concatenado).
   * El caller decide cómo combinarlo con el texto previo y re-parsear.
   */
  onAddText: (newText: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  'loading tesseract core': 'Cargando OCR',
  'initializing tesseract': 'Inicializando OCR',
  'loading language traineddata': 'Cargando español',
  'initializing api': 'Preparando',
  'recognizing text': 'Leyendo la foto',
}

function formatStatus(p: OcrProgress, page: number, total: number): string {
  const label = STATUS_LABELS[p.status] ?? 'Procesando'
  const pct =
    p.status === 'recognizing text' ? ` ${Math.round(p.progress * 100)}%` : ''
  if (total > 1) return `Foto ${page} de ${total}: ${label}${pct}…`
  return `${label}${pct}…`
}

/**
 * Botón "Agregar otra foto". Cuando faltan datos (cargos al reverso del
 * PDF físico, por ejemplo), el usuario puede sumar fotos adicionales
 * sin tener que re-uploadear desde cero. El OCR corre sobre las nuevas
 * fotos y el texto se concatena al rawText actual.
 */
export function AddPagesButton({ onAddText }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validate(files: File[]): string | null {
    if (files.length === 0) return null
    if (files.length > MAX_ADDITIONAL_FILES) {
      return `Máximo ${MAX_ADDITIONAL_FILES} fotos adicionales por subida.`
    }
    for (const f of files) {
      const lower = f.name.toLowerCase()
      const isHeic =
        f.type === 'image/heic' ||
        f.type === 'image/heif' ||
        HEIC_EXT.some((e) => lower.endsWith(e))
      if (isHeic) {
        return 'iOS guarda fotos en HEIC. En Ajustes > Cámara > Formatos elegí "Más compatible" (JPEG).'
      }
      if (!f.type.startsWith('image/')) {
        return 'Solo imágenes (JPG/PNG/WebP) para agregar páginas.'
      }
      if (f.size > MAX_SIZE) {
        return 'Cada foto debe pesar menos de 10 MB.'
      }
      if (f.size === 0) {
        return 'El archivo está vacío.'
      }
    }
    return null
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    const files = Array.from(list)
    e.target.value = '' // permite re-seleccionar el mismo archivo si el usuario quiere

    const v = validate(files)
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setBusy(true)
    setStatus('Iniciando OCR…')
    try {
      const text = await extractTextFromImages(files, (p, idx, total) => {
        setStatus(formatStatus(p, idx, total))
      })
      if (!text.trim()) {
        throw new Error(
          'No pudimos leer texto en las fotos adicionales. Probá con mejor iluminación.',
        )
      }
      onAddText(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando.')
    } finally {
      setBusy(false)
      setStatus(null)
    }
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        multiple
        onChange={handleChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="dark"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
            <span>Procesando…</span>
          </>
        ) : (
          <span>Agregar foto del reverso</span>
        )}
      </Button>
      {status && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs font-medium text-soft"
        >
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
