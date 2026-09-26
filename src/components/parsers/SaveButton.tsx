'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { ParsedBoleta } from '@/lib/parsers'
import { guardarBoleta } from '@/lib/storage/historial'

/**
 * Botón "Guardar en mi histórico" compartido entre los 3 result-view
 * (luz/agua/gas). Internamente llama a `guardarBoleta` que ahora usa
 * huella del contenido y del suministro: doble click
 * o re-guardar la misma boleta no genera duplicados.
 *
 * Si IndexedDB rechaza por cuota llena, muestra mensaje accionable
 * ("exporta y borra viejas") en vez de un error genérico.
 */
export function SaveButton({
  boleta,
  onSaved,
}: {
  boleta: ParsedBoleta
  onSaved?: () => void
}) {
  const [result, setResult] = useState<{
    boleta: ParsedBoleta
    status: 'saving' | 'saved' | 'error'
    error?: string
  } | null>(null)
  const status = result?.boleta === boleta ? result.status : 'idle'
  const errorMsg = result?.boleta === boleta ? result.error : undefined
  const generation = useRef(0)

  async function handleSave() {
    const request = ++generation.current
    setResult({ boleta, status: 'saving' })
    try {
      await guardarBoleta(boleta)
      if (request !== generation.current) return
      setResult({ boleta, status: 'saved' })
      onSaved?.()
    } catch (err) {
      if (request !== generation.current) return
      setResult({
        boleta,
        status: 'error',
        error:
          err instanceof Error ? err.message : 'Error guardando en histórico.',
      })
    }
  }

  if (status === 'saved') {
    return (
      <Button variant="primary" size="lg" disabled>
        Guardado en histórico ✓
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="dark"
        size="lg"
        onClick={handleSave}
        disabled={status === 'saving'}
      >
        {status === 'saving' ? 'Guardando…' : 'Guardar en mi histórico'}
      </Button>
      {errorMsg && (
        <p className="text-xs text-danger" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
