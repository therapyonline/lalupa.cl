'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  analizarUsoPatrones,
  clearTelemetry,
  readTelemetry,
} from '@/lib/parsers/telemetry'

/**
 * Inspector de la telemetría local. Cumple la promesa "todo se queda
 * en tu navegador" mostrando literalmente lo que está guardado en
 * localStorage para el namespace `lalupa:parser-telemetry`.
 *
 * El usuario puede:
 *   - Ver cuántas boletas ha analizado.
 *   - Ver qué tipos de cargo se detectaron (sin montos, sin datos
 *     personales, solo el nombre canónico del concepto).
 *   - Borrar todo con un click.
 *
 * No se hacen requests de red. Todo viene de `localStorage`.
 */
export function TelemetryInspector() {
  const [snapshot, setSnapshot] = useState<{
    total: number
    ultimoUpdate: string
    items: Array<{ concepto: string; matches: number; tasaUso: number }>
  } | null>(null)
  const [cleared, setCleared] = useState(false)

  const refresh = useCallback(() => {
    const snap = readTelemetry()
    setSnapshot({
      total: snap.totalAnalisis,
      ultimoUpdate: snap.ultimoUpdate,
      items: analizarUsoPatrones(),
    })
  }, [])

  useEffect(() => {
    // One-shot al mount: leer localStorage (external source) y reflejar
    // en state. El lint warning "set-state-in-effect" no aplica acá
    // porque NO estamos sincronizando state derivado, estamos hidratando
    // desde un sistema externo (Web Storage).
    /* eslint-disable react-hooks/set-state-in-effect */
    refresh()
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refresh])

  function handleClear() {
    if (!confirm('¿Borrar el registro local de qué conceptos detectó la lupa?')) return
    clearTelemetry()
    setCleared(true)
    refresh()
  }

  if (!snapshot) return null

  const isEmpty = snapshot.total === 0

  return (
    <div className="rounded-[20px] border border-border bg-cream-warm/40 p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink">
        Inspector de telemetría local
      </p>
      <p className="mt-3 text-base leading-relaxed text-body">
        Esto es exactamente lo que la lupa registra en{' '}
        <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[13px]">
          localStorage
        </code>
        : cuántas boletas analizaste y qué tipos de cargo detectamos. Sin
        montos, sin empresa, sin tu nombre. Solo el nombre del concepto
        para saber qué patrones del parser usás de verdad.
      </p>

      {isEmpty ? (
        <div className="mt-5 rounded-md bg-ink/5 p-4 text-sm text-body">
          {cleared ? (
            <>
              <strong className="text-ink">Borrado.</strong> El registro está
              vacío. Apenas analices una boleta nueva vuelve a llenarse.
            </>
          ) : (
            <>
              No hay datos todavía. Apenas analices una boleta aparecen acá
              los conceptos detectados.
            </>
          )}
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-body">
            Analizaste{' '}
            <strong className="font-medium text-ink">
              {snapshot.total}{' '}
              {snapshot.total === 1 ? 'boleta' : 'boletas'}
            </strong>{' '}
            desde este navegador.
          </p>
          <div className="mt-4 max-h-72 overflow-y-auto rounded-md border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Conceptos de cargo detectados por la lupa en este navegador
              </caption>
              <thead className="sticky top-0 bg-cream-warm">
                <tr className="border-b border-border">
                  <th scope="col" className="px-3 py-2 font-medium text-ink">
                    Concepto
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right font-medium text-ink"
                  >
                    Veces
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right font-medium text-ink"
                  >
                    Tasa
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.items.map((item) => (
                  <tr key={item.concepto} className="border-b border-border/40">
                    <td className="px-3 py-2 text-body">{item.concepto}</td>
                    <td className="px-3 py-2 text-right font-mono text-body">
                      {item.matches}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-body">
                      {(item.tasaUso * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-soft">
            Última actualización local:{' '}
            {new Date(snapshot.ultimoUpdate).toLocaleString('es-CL')}.
          </p>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={refresh}>
          Recargar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
        >
          Borrar registro local
        </Button>
      </div>
    </div>
  )
}
