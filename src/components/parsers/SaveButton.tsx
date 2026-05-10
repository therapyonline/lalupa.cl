'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { ParsedBoleta } from '@/lib/parsers'
import { guardarBoleta } from '@/lib/storage/historial'

/**
 * Botón "Guardar en mi histórico" compartido entre los 3 result-view
 * (luz/agua/gas). Internamente llama a `guardarBoleta` que ahora usa
 * id determinístico (empresa + servicio + período + total): doble click
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
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      await guardarBoleta(boleta)
      setStatus('saved')
      onSaved?.()
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error guardando en histórico.',
      )
      setStatus('error')
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
