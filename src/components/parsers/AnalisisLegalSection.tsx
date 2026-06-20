'use client'

import { Alert } from '@/components/ui/Alert'
import {
  type AnalisisLegal,
  type SeveridadAnalisis,
  analizarLegalmente,
} from '@/lib/parsers'
import type { ParsedBoleta } from '@/lib/parsers'

const SEVERIDAD_VARIANT: Record<SeveridadAnalisis, 'danger' | 'warning' | 'info'> = {
  alerta_legal: 'danger',
  derecho_disponible: 'warning',
  informativo: 'info',
}

const SEVERIDAD_ETIQUETA: Record<SeveridadAnalisis, string> = {
  alerta_legal: 'Alerta legal',
  derecho_disponible: 'Derecho disponible',
  informativo: 'Para tu información',
}

/**
 * Sección que muestra los hallazgos del análisis legal ortogonal sobre
 * la boleta. Cada alerta cita la norma chilena específica (DS 327, DS
 * 1199, DS 67, leyes 21.667 / 21.012 / 19.496) y entrega una acción
 * concreta para el usuario.
 *
 * Si no hay hallazgos, no renderiza nada (la boleta no tiene problemas
 * legales detectables con los checks actuales).
 */
export function AnalisisLegalSection({ boleta }: { boleta: ParsedBoleta }) {
  const hallazgos = analizarLegalmente(boleta)
  if (hallazgos.length === 0) return null

  return (
    <section className="bg-cream pb-12" aria-label="Análisis legal de tu boleta">
      <div className="mx-auto max-w-2xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          Análisis legal
        </p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
          {hallazgos.length === 1
            ? 'Detectamos un punto que vale la pena revisar'
            : `Detectamos ${hallazgos.length} puntos que valen la pena revisar`}
        </h2>
        <p className="mt-3 text-body">
          Esto es independiente del análisis de cargos sospechosos por monto:
          son derechos del consumidor o restricciones legales de la empresa
          basadas en normativa chilena vigente. Para cada uno te decimos qué
          ley aplica y qué puedes hacer.
        </p>

        <ul className="mt-6 flex flex-col gap-4">
          {hallazgos.map((h) => (
            <li key={h.id}>
              <AnalisisCard hallazgo={h} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function AnalisisCard({ hallazgo }: { hallazgo: AnalisisLegal }) {
  const variant = SEVERIDAD_VARIANT[hallazgo.severidad]
  const etiqueta = SEVERIDAD_ETIQUETA[hallazgo.severidad]
  return (
    <Alert variant={variant}>
      <Alert.Title>
        <span className="mr-2 inline-block rounded-full bg-ink/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink">
          {etiqueta}
        </span>
        {hallazgo.titulo}
      </Alert.Title>
      <Alert.Body>
        <p>{hallazgo.descripcion}</p>
        <p className="mt-3 font-medium text-ink">
          Qué puedes hacer: <span className="font-normal">{hallazgo.accionSugerida}</span>
        </p>
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">
            Fundamento legal: {hallazgo.fundamentoLegal.norma}
          </summary>
          <p className="mt-2 text-soft">{hallazgo.fundamentoLegal.resumen}</p>
          <p className="mt-2">
            <a
              href={hallazgo.fundamentoLegal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              Ver norma completa
            </a>
          </p>
        </details>
      </Alert.Body>
    </Alert>
  )
}
