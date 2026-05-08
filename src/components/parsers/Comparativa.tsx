import type { ParsedBoleta } from '@/lib/parsers'
import type { BoletaGuardada } from '@/lib/storage/historial'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { formatCLP, formatPeriod } from './ResultBlock'

/**
 * Skeleton de la Comparativa, mismo layout que las filas reales para que
 * la transición desde "leyendo IndexedDB" sea sin layout shift.
 */
export function ComparativaSkeleton({
  rows = 4,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <ul
      className={cn('flex flex-col gap-2', className)}
      aria-label="Cargando histórico"
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="grid grid-cols-[minmax(8rem,auto)_1fr_minmax(7rem,auto)] items-center gap-4 rounded-md px-3 py-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-20 justify-self-end" />
        </li>
      ))}
    </ul>
  )
}

interface ComparativaProps {
  historicas: BoletaGuardada[]
  actual: ParsedBoleta
  maxFilas?: number
  className?: string
}

interface FilaComparativa {
  key: string
  label: string
  monto: number
  isCurrent: boolean
}

export function Comparativa({
  historicas,
  actual,
  maxFilas = 6,
  className,
}: ComparativaProps) {
  const filas: FilaComparativa[] = [
    ...historicas.map<FilaComparativa>((h) => ({
      key: h.id,
      label: formatPeriod(h.periodo),
      monto: h.totales.total,
      isCurrent: false,
    })),
    {
      key: 'actual',
      label: formatPeriod(actual.periodo),
      monto: actual.totales.total,
      isCurrent: true,
    },
  ].slice(-maxFilas)

  const max = Math.max(...filas.map((f) => (Number.isFinite(f.monto) ? f.monto : 0)))
  const promedio = filas.reduce((sum, f) => sum + f.monto, 0) / filas.length

  return (
    <ul
      className={cn('flex flex-col gap-2', className)}
      aria-label="Comparativa de boletas"
    >
      {filas.map((fila) => {
        const pct = max > 0 ? (fila.monto / max) * 100 : 0
        const destacar = fila.isCurrent && fila.monto > promedio
        const label = fila.isCurrent
          ? `Período actual ${fila.label}: ${formatCLP(fila.monto)}${
              destacar ? ', sobre el promedio' : ''
            }`
          : `Período ${fila.label}: ${formatCLP(fila.monto)}`
        return (
          <li
            key={fila.key}
            aria-label={label}
            className={cn(
              'grid grid-cols-[minmax(8rem,auto)_1fr_minmax(7rem,auto)] items-center gap-4 rounded-md px-3 py-3 transition-colors',
              destacar && 'bg-accent-soft',
            )}
          >
            <div
              aria-hidden
              className={cn(
                'text-sm leading-tight',
                fila.isCurrent ? 'font-medium text-ink' : 'text-body',
              )}
            >
              {fila.label}
              {fila.isCurrent && (
                <span className="ml-2 align-middle font-mono text-[10px] uppercase tracking-wide text-accent-deep">
                  actual
                </span>
              )}
            </div>
            <div
              aria-hidden
              className="h-3 overflow-hidden rounded-full bg-ink/5"
            >
              <div
                style={{ width: `${pct}%` }}
                className={cn(
                  'h-full rounded-full transition-all',
                  fila.isCurrent ? 'bg-accent' : 'bg-primary',
                )}
              />
            </div>
            <div
              aria-hidden
              className="text-right font-mono text-sm font-medium tabular-nums text-ink"
            >
              {formatCLP(fila.monto)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
