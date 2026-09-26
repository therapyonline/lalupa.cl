'use client'

import { Alert } from '@/components/ui/Alert'
import { REVISION_REFERENCIAS } from '@/data/normativa-chilena'
import {
  type AnalisisLegal,
  type SeveridadAnalisis,
  analizarLegalmente,
} from '@/lib/parsers'
import type { ParsedBoleta } from '@/lib/parsers'

const SEVERIDAD_VARIANT: Record<SeveridadAnalisis, 'warning' | 'info'> = {
  revision: 'warning',
  informativo: 'info',
}

const SEVERIDAD_ETIQUETA: Record<SeveridadAnalisis, string> = {
  revision: 'Requiere antecedentes',
  informativo: 'Para tu información',
}

/** Señales documentales para revisar; ni presencia ni ausencia certifican legalidad. */
export function AnalisisLegalSection({ boleta }: { boleta: ParsedBoleta }) {
  const hallazgos = analizarLegalmente(boleta)
  if (hallazgos.length === 0) return null

  return (
    <section
      className="bg-cream pb-12"
      aria-label="Puntos de revisión de tu boleta"
    >
      <div className="mx-auto max-w-2xl px-4">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          Revisión orientativa
        </p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
          {hallazgos.length === 1
            ? 'Detectamos un punto que vale la pena revisar'
            : `Detectamos ${hallazgos.length} puntos que valen la pena revisar`}
        </h2>
        <p className="mt-3 text-body">
          Estas señales vienen de los datos que logramos leer. No confirman un
          cobro indebido, un beneficio pendiente ni que corresponda una
          devolución. Contrástalas con el original y reúne los antecedentes
          indicados.
        </p>

        <ul className="mt-6 flex flex-col gap-4">
          {hallazgos.map((h) => (
            <li key={h.id}>
              <AnalisisCard hallazgo={h} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-soft">
          Revisión de estos criterios: {REVISION_REFERENCIAS.fecha}. Las fuentes
          de contexto y los canales de atención no sustituyen la norma aplicable
          a tu caso.
        </p>
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
          Qué puedes hacer:{' '}
          <span className="font-normal">{hallazgo.accionSugerida}</span>
        </p>
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">
            {hallazgo.fundamentoLegal.tipo === 'norma'
              ? 'Norma de referencia'
              : hallazgo.fundamentoLegal.tipo === 'contexto'
                ? 'Contexto oficial'
                : 'Canal de orientación'}
            : {hallazgo.fundamentoLegal.norma}
          </summary>
          <p className="mt-2 text-soft">{hallazgo.fundamentoLegal.resumen}</p>
          <p className="mt-2">
            <a
              href={hallazgo.fundamentoLegal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              Ver fuente oficial
            </a>
          </p>
        </details>
      </Alert.Body>
    </Alert>
  )
}
