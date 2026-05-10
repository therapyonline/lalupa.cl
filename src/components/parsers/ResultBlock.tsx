import Link from 'next/link'
import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Cargo, ParsedBoleta } from '@/lib/parsers'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

/**
 * Skeleton shape de ResultBlock, para mostrar mientras parseamos la
 * boleta en el navegador. Mismo layout que el componente real para evitar
 * layout shift al hidratar.
 */
export function ResultBlockSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] border border-ink/10 bg-white',
        className,
      )}
      aria-hidden
    >
      <header className="flex items-start justify-between gap-8 bg-ink px-10 py-8">
        <div>
          <Skeleton className="h-3 w-32 bg-cream/20" />
          <Skeleton className="mt-3 h-7 w-48 bg-cream/20" />
        </div>
        <Skeleton className="h-12 w-40 bg-cream/20 md:h-14" />
      </header>
      <ul className="divide-y divide-ink/10">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-4 px-10 py-5"
          >
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-20" />
          </li>
        ))}
      </ul>
      <footer className="flex flex-col gap-6 bg-cream px-10 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-44" />
        </div>
      </footer>
    </div>
  )
}

interface ResultBlockProps {
  boleta: ParsedBoleta
  className?: string
}

export function ResultBlock({ boleta, className }: ResultBlockProps) {
  const flags = boleta.cargos.filter((c) => c.sospechoso)
  const hasFlags = flags.length > 0

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] border border-ink/10 bg-white',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-8 bg-ink px-10 py-8 text-cream">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-cream/70">
            {boleta.empresa} · {capitalize(boleta.servicio)}
          </p>
          <h2 className="mt-3 text-2xl font-medium leading-tight tracking-tight">
            {formatPeriod(boleta.periodo)}
          </h2>
        </div>
        <p className="text-[clamp(36px,5vw,56px)] font-medium leading-none tabular-nums">
          {formatCLP(boleta.totales.total)}
        </p>
      </header>

      <ul>
        {boleta.cargos.map((cargo) => (
          <ResultRow key={cargo.concepto} cargo={cargo} />
        ))}
      </ul>

      <footer className="flex flex-col gap-6 bg-cream px-10 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Total a pagar
          </p>
          <p className="mt-2 text-4xl font-medium leading-none tabular-nums text-ink">
            {formatCLP(boleta.totales.total)}
          </p>
          {boleta.fechaVencimiento && isValid(boleta.fechaVencimiento) && (
            <p className="mt-2 text-sm text-body">
              Vence el{' '}
              {format(boleta.fechaVencimiento, "d 'de' MMMM yyyy", {
                locale: es,
              })}
              .
            </p>
          )}
        </div>
        {hasFlags && (
          <Link
            href="/reclamar-sernac"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-accent-deep"
          >
            Generar reclamo SERNAC
            <span aria-hidden>→</span>
          </Link>
        )}
      </footer>
    </div>
  )
}

function ResultRow({ cargo }: { cargo: Cargo }) {
  const flagged = cargo.sospechoso === true
  const detalleText = flagged ? cargo.razonSospecha : cargo.detalle

  return (
    <li
      className={cn(
        'flex items-start justify-between gap-6 border-b border-border px-10 py-4 last:border-b-0',
        flagged && 'border-l-4 border-l-accent bg-accent-soft',
      )}
    >
      <div className="flex-1">
        <p
          className={cn(
            'text-[15px] font-medium leading-snug',
            flagged ? 'text-accent-deep' : 'text-ink',
          )}
        >
          {cargo.concepto}
        </p>
        {detalleText && (
          <p
            className={cn(
              'mt-1 font-mono text-[11px] uppercase tracking-wide leading-relaxed',
              flagged ? 'text-accent-deep' : 'text-soft',
            )}
          >
            {detalleText}
          </p>
        )}
      </div>
      <p
        className={cn(
          'text-[17px] font-medium tabular-nums',
          flagged ? 'text-accent-deep' : 'text-ink',
        )}
      >
        {formatCLP(cargo.monto)}
      </p>
    </li>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatCLP(n: number): string {
  if (!Number.isFinite(n)) return '-'
  return `$ ${Math.round(n).toLocaleString('es-CL')}`
}

export function formatPeriod({
  desde,
  hasta,
}: {
  desde: Date
  hasta: Date
}): string {
  if (!isValid(desde) || !isValid(hasta)) return 'Período no detectado'
  const sameYear = desde.getFullYear() === hasta.getFullYear()
  const sameMonth = sameYear && desde.getMonth() === hasta.getMonth()

  if (sameMonth) {
    return format(desde, "MMMM 'de' yyyy", { locale: es })
  }
  // En-dash con espacios alrededor en ambas ramas para consistencia.
  // En-dash (U+2013) en vez de hyphen ASCII para rangos de fecha es la
  // convención tipográfica correcta en español.
  if (sameYear) {
    return `${format(desde, 'MMMM', { locale: es })} – ${format(hasta, "MMMM 'de' yyyy", { locale: es })}`
  }
  return `${format(desde, 'MMM yyyy', { locale: es })} – ${format(hasta, 'MMM yyyy', { locale: es })}`
}
