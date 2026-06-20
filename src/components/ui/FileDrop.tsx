'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Aceptamos PDF, JPG, PNG y WebP. HEIC/HEIF (iOS) los aceptamos en el
// input para que extractTextFromBoleta tire un error claro con la
// instrucción de cambiar formato; sin esto, iOS muestra "no compatible"
// silenciosamente y el usuario no entiende.
const ACCEPT =
  'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
const HEIC_EXTENSIONS = ['.heic', '.heif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB por archivo
const MAX_FILES = 5

type FileDropState = 'idle' | 'dragOver' | 'processing' | 'error'

export interface FileDropProps {
  /**
   * Recibe siempre un array. Si el caller espera un solo archivo, mira
   * `files[0]`; si quiere multi-página, itera. El componente se encarga
   * de validar formato y tamaño antes de llamar.
   */
  onFiles: (files: File[]) => void
  className?: string
  /** Texto que reemplaza "Procesando…" mientras está procesando (ej: progreso OCR). */
  statusMessage?: string | null
}

export function FileDrop({ onFiles, className, statusMessage }: FileDropProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [state, setState] = React.useState<FileDropState>('idle')
  const [error, setError] = React.useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase()
    const looksHeicByExt = HEIC_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    )
    // HEIC se "acepta" en el input solo para dar el mensaje accionable
    // de inmediato (no podemos decodificarlo en el navegador). Lo
    // rechazamos acá mismo, sin pasar a estado processing, igual que
    // AddPagesButton.
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      looksHeicByExt
    if (isHeic) {
      return 'iOS guarda fotos en HEIC. En Ajustes > Cámara > Formatos elige "Más compatible" (JPEG), o convierte la foto a JPG antes de subirla.'
    }
    const accepted =
      ACCEPTED_TYPES.includes(file.type) ||
      // Algunos navegadores Android dejan type vacío y mandan extensión.
      (file.type === '' && /\.(jpe?g|png|webp|pdf)$/i.test(lowerName))
    if (!accepted) {
      return 'Formato no soportado. Aceptamos PDF, JPG, PNG y WebP.'
    }
    if (file.size > MAX_SIZE) {
      return 'Archivo muy grande. El máximo es 10 MB por archivo.'
    }
    if (file.size === 0) {
      return 'El archivo está vacío.'
    }
    return null
  }

  const handleFiles = (selected: FileList | File[]) => {
    const files = Array.from(selected)
    if (files.length === 0) return
    if (files.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} archivos por subida.`)
      setState('error')
      return
    }

    // Validación: cada archivo individual válido.
    for (const f of files) {
      const e = validateFile(f)
      if (e) {
        setError(e)
        setState('error')
        return
      }
    }

    // Si es múltiple, todos deben ser imágenes (PDF debe ir solo).
    if (files.length > 1) {
      const hasPdf = files.some((f) => f.type === 'application/pdf')
      const allImages = files.every((f) => f.type.startsWith('image/'))
      if (hasPdf) {
        setError(
          'Sube el PDF como archivo único, sin combinar con imágenes.',
        )
        setState('error')
        return
      }
      if (!allImages) {
        setError(
          'Para subir varias páginas, todas deben ser imágenes (JPG/PNG/WebP).',
        )
        setState('error')
        return
      }
    }

    setError(null)
    setState('processing')
    onFiles(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (state === 'processing') return
    setState('dragOver')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (state === 'dragOver') setState(error ? 'error' : 'idle')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (state === 'processing') return
    handleFiles(e.dataTransfer.files)
  }

  const openPicker = () => {
    if (state === 'processing') return
    inputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (list) handleFiles(list)
    e.target.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Arrastra tu boleta acá o tócalo para elegir un archivo. Si son varias fotos, puedes subirlas juntas."
      aria-busy={state === 'processing'}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-10 py-20 text-center transition-colors',
        'cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
        state === 'dragOver' && 'border-primary bg-cream-warm/40',
        state === 'error' && 'border-danger',
        state === 'processing' && 'cursor-wait border-primary',
        state === 'idle' && 'border-ink hover:bg-cream-warm/20',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleInputChange}
        className="hidden"
        aria-label="Seleccionar archivo de boleta"
        tabIndex={-1}
      />

      {state === 'processing' ? (
        <>
          <Loader2
            className="h-12 w-12 animate-spin text-primary"
            strokeWidth={1.5}
          />
          <p
            role="status"
            aria-live="polite"
            className="mt-5 text-base font-medium text-ink"
          >
            {statusMessage ?? 'Procesando…'}
          </p>
        </>
      ) : (
        <>
          <span aria-hidden className="text-[48px] leading-none">
            📄
          </span>
          <p className="mt-6 text-xl font-medium text-ink">
            Arrastra tu boleta acá
          </p>
          <p className="mt-2 text-sm text-body">
            PDF, foto, o varias fotos del frente y reverso de la boleta
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-wide text-soft">
            PDF, JPG, PNG o WebP · Hasta {MAX_FILES} fotos · Máx 10 MB c/u · OCR en tu navegador
          </p>
          {error && (
            <p
              role="alert"
              className="mt-5 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
