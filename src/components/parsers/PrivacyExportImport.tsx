'use client'

import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  exportarHistorial,
  importarHistorial,
} from '@/lib/storage/historial'

/**
 * Bloque "Privacidad" con botones Exportar / Importar JSON. Compartido
 * por los 3 result-view (luz, agua, gas).
 *
 * Mantiene la promesa 100% browser-side: ambas operaciones leen/escriben
 * IndexedDB local, sin tocar red. El export usa Blob + ObjectURL para
 * descarga directa, el import lee File via FileReader equivalente.
 */
export function PrivacyExportImport({
  onImported,
}: {
  onImported?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const handleExport = useCallback(async () => {
    setFeedback(null)
    try {
      const blob = await exportarHistorial()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `lalupa-historial-${ts}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setFeedback({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'No pudimos exportar tu historial.',
      })
    }
  }, [])

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setFeedback(null)
      try {
        const { agregadas, omitidas } = await importarHistorial(file)
        const partes = [
          `${agregadas} ${agregadas === 1 ? 'boleta agregada' : 'boletas agregadas'} a tu histórico local`,
        ]
        if (omitidas > 0) {
          partes.push(
            `${omitidas} ${omitidas === 1 ? 'ya existía' : 'ya existían'} (no se sobrescribieron)`,
          )
        }
        setFeedback({ kind: 'success', message: `${partes.join(', ')}.` })
        onImported?.()
      } catch (err) {
        setFeedback({
          kind: 'error',
          message: err instanceof Error ? err.message : 'No pudimos importar.',
        })
      }
    },
    [onImported],
  )

  return (
    <div className="rounded-[20px] border border-border bg-cream-warm/50 p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink">
        Privacidad
      </p>
      <p className="mt-3 text-base leading-relaxed text-ink md:text-lg">
        Tu histórico vive solo en este celular. Nada sale a internet.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleExport}>
          Exportar JSON
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Importar JSON
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
          aria-label="Importar historial JSON"
          tabIndex={-1}
        />
        <span className="text-xs text-body">
          para mover entre dispositivos.
        </span>
      </div>
      {feedback && (
        <p
          role="status"
          className={
            feedback.kind === 'success'
              ? 'mt-4 text-sm text-success'
              : 'mt-4 text-sm text-danger'
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  )
}
