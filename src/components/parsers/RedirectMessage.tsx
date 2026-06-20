'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { safeSessionGet, safeSessionRemove } from '@/lib/session-storage'

const REDIRECT_MESSAGE_KEY = 'lalupa:redirect-message'

/**
 * Lee y consume el mensaje que los result-views guardan antes de
 * redirigir al hub de subida (por ejemplo "No encontramos una boleta
 * procesada. Súbela de nuevo." o "Sube tu boleta para ver el análisis.").
 *
 * Antes este mensaje se escribía pero nunca se leía, así que el usuario
 * que llegaba redirigido no veía ninguna explicación. Acá lo mostramos
 * una vez y lo borramos para que no reaparezca en visitas siguientes.
 */
export function RedirectMessage() {
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    // One-shot al mount: leer y consumir el mensaje (external source).
    /* eslint-disable react-hooks/set-state-in-effect */
    const msg = safeSessionGet(REDIRECT_MESSAGE_KEY)
    if (msg) {
      safeSessionRemove(REDIRECT_MESSAGE_KEY)
      setMensaje(msg)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  if (!mensaje) return null

  return (
    <Alert variant="info" className="mb-6">
      <Alert.Body>{mensaje}</Alert.Body>
    </Alert>
  )
}
