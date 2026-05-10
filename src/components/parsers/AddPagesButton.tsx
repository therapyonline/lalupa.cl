'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
 *
 * Implementado con `<label htmlFor>` en vez de Button.click() programático
 * porque ese patrón es más confiable en todos los browsers (Safari iOS
 * a veces ignora click() en inputs ocultos).
 */
export function AddPagesButton({ onAddText }: Props) {
  const inputId = useId()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Ref para limpiar el setTimeout del status al desmontar el componente
  // (evita "setState on unmounted component" warning si el usuario
  // navega antes del fade del último mensaje).
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [])

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
        return 'iOS guarda fotos en HEIC. En Ajustes > Cámara > Formatos elige "Más compatible" (JPEG).'
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
    const files = list ? Array.from(list) : []
    e.target.value = '' // permite re-seleccionar el mismo archivo
    if (files.length === 0) return

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
          'No pudimos leer texto en las fotos adicionales. Prueba con mejor iluminación.',
        )
      }
      onAddText(text)
      setStatus('Listo. Actualizando resultado…')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error procesando la foto.'
      setError(msg)
    } finally {
      setBusy(false)
      // Mantenemos el último status visible un instante para que el
      // usuario vea el feedback antes de que cambie el resultado. El
      // ref permite cancelar el timer si el componente se desmonta antes.
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => setStatus(null), 1500)
    }
  }

  // El input está oculto con sr-only (no `display:none`) así Safari y
  // navegadores estrictos pueden rastrear el `htmlFor` del label.
  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        multiple
        onChange={handleChange}
        disabled={busy}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        // role=button + tabIndex hace que screen readers anuncien "botón"
        // en vez de "label" y permite activación con Enter/Space.
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        onKeyDown={(e) => {
          if (busy) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const input = document.getElementById(inputId) as HTMLInputElement | null
            input?.click()
          }
        }}
        className={
          busy
            ? 'inline-flex items-center gap-2 rounded-full bg-ink/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-cream cursor-wait'
            : 'inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium uppercase tracking-wide text-cream transition-colors hover:bg-primary-dark cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20'
        }
      >
        {busy ? (
          <>
            <Loader2
              className="h-4 w-4 animate-spin"
              strokeWidth={1.5}
              aria-hidden
            />
            <span>Procesando…</span>
          </>
        ) : (
          <span>Agregar foto (frente, reverso, otra página)</span>
        )}
      </label>
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
