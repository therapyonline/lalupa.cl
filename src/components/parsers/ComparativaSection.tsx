'use client'

import { useEffect, useState } from 'react'
import { Container } from '@/components/layout/Container'
import {
  Comparativa,
  ComparativaSkeleton,
} from '@/components/parsers/Comparativa'
import type { ParsedBoleta } from '@/lib/parsers'
import {
  type BoletaGuardada,
  listarBoletas,
} from '@/lib/storage/historial'

/**
 * Sección "Histórico {Empresa}" compartida por los 3 result-view.
 *
 * Carga las boletas guardadas del IndexedDB para esta empresa+servicio,
 * deduplica vs la actual (misma fecha de inicio = misma boleta), y
 * renderiza la tabla de Comparativa o un estado vacío con CTA a guardar.
 *
 * Maneja error de carga (IndexedDB corrupta o version mismatch) con un
 * mensaje visible en lugar de pretender que no hay datos.
 */
export function ComparativaSection({
  empresa,
  actual,
  slug,
  refreshTick,
}: {
  empresa: string
  actual: ParsedBoleta
  slug: string
  refreshTick: number
}) {
  const [historicas, setHistoricas] = useState<BoletaGuardada[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    listarBoletas(empresa, actual.servicio)
      .then((all) => {
        const dedup = all.filter(
          (b) => b.periodo.desde.getTime() !== actual.periodo.desde.getTime(),
        )
        setHistoricas(dedup.slice(-5))
        setLoaded(true)
      })
      .catch((e) => {
        setLoadError(
          e instanceof Error
            ? e.message
            : 'No pudimos leer tu histórico local.',
        )
        setHistoricas([])
        setLoaded(true)
      })
  }, [empresa, actual.servicio, actual.periodo.desde, refreshTick])

  if (!loaded) {
    return (
      <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Histórico {empresa} · {slug}
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Cargando tu histórico…
          </h2>
          <ComparativaSkeleton className="mt-8" rows={4} />
        </Container>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
        <Container>
          <div className="rounded-[20px] border border-danger/20 bg-danger/5 p-8 md:p-12">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Histórico {empresa}
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              No pudimos leer tu histórico
            </h2>
            <p className="mt-3 max-w-md text-body">
              El navegador rechazó la lectura de IndexedDB. Esto pasa en
              modo incógnito o si bloqueaste storage para este sitio. Tus
              datos siguen en tu dispositivo, pero la app no los puede ver
              en este momento.
            </p>
            <p className="mt-2 max-w-md font-mono text-xs text-soft">
              {loadError}
            </p>
          </div>
        </Container>
      </section>
    )
  }

  if (historicas.length === 0) {
    return (
      <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
        <Container>
          <div className="rounded-[20px] border border-border bg-cream-warm/30 p-8 text-center md:p-12">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Histórico {empresa}
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Esta es tu primera boleta acá
            </h2>
            <p className="mx-auto mt-3 max-w-md text-body">
              Cuando guardes este período en tu histórico (botón de arriba),
              empezamos a comparar mes a mes y te avisamos si tu cuenta sube
              sin razón aparente.
            </p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          Histórico {empresa} · {slug}
        </p>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
          Tus últimos {historicas.length + 1} períodos
        </h2>
        <p className="mt-3 max-w-2xl text-body">
          Comparamos las últimas boletas guardadas contra la actual. Si la
          actual supera el promedio, la fila queda destacada.
        </p>

        <Comparativa
          className="mt-8"
          historicas={historicas}
          actual={actual}
        />
      </Container>
    </section>
  )
}
