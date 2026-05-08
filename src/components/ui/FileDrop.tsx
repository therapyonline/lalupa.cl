'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPT = 'application/pdf,image/jpeg,image/png'
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

type FileDropState = 'idle' | 'dragOver' | 'processing' | 'error'

export interface FileDropProps {
  onFile: (file: File) => void
  className?: string
  /** Texto que reemplaza "Procesando…" mientras está procesando (ej: progreso OCR). */
  statusMessage?: string | null
}

export function FileDrop({ onFile, className, statusMessage }: FileDropProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [state, setState] = React.useState<FileDropState>('idle')
  const [error, setError] = React.useState<string | null>(null)

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato no soportado. Solo PDF, JPG o PNG.'
    }
    if (file.size > MAX_SIZE) {
      return 'Archivo muy grande. El máximo es 10 MB.'
    }
    return null
  }

  const handleFile = (file: File) => {
    const validationError = validate(file)
    if (validationError) {
      setError(validationError)
      setState('error')
      return
    }
    setError(null)
    setState('processing')
    onFile(file)
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
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const openPicker = () => {
    if (state === 'processing') return
    inputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
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
      aria-label="Arrastra tu boleta acá o tócalo para elegir un archivo"
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
        onChange={handleInputChange}
        className="hidden"
        aria-hidden
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
            O toca para elegir el PDF o una foto desde tu galería
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-wide text-soft">
            PDF, JPG o PNG · Máx 10 MB · OCR en tu navegador
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
