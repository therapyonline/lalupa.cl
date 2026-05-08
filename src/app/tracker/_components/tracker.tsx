'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import {
  type BoletaGuardada,
  eliminarBoleta,
  eliminarTodasLasBoletas,
  exportarHistorial,
  importarHistorial,
  listarBoletas,
} from '@/lib/storage/historial'
import { cn } from '@/lib/utils'

type Servicio = 'electricidad' | 'agua' | 'gas'

const SERVICIOS: Servicio[] = ['electricidad', 'agua', 'gas']

const SERVICIO_COLORS: Record<Servicio, string> = {
  electricidad: 'var(--primary)',
  agua: 'var(--accent)',
  gas: 'var(--success)',
}

const SERVICIO_LABEL: Record<Servicio, string> = {
  electricidad: 'Luz',
  agua: 'Agua',
  gas: 'Gas',
}

const SERVICIO_HREF: Record<Servicio, string> = {
  electricidad: '/boleta-luz',
  agua: '/boleta-agua',
  gas: '/boleta-gas',
}

interface MonthBucket {
  year: number
  monthIdx: number
  label: string
  count: number
  total: number
  byService: Record<Servicio, number>
  boletas: BoletaGuardada[]
}

function emptyBucket(year: number, monthIdx: number): MonthBucket {
  const date = new Date(year, monthIdx, 1)
  return {
    year,
    monthIdx,
    label: format(date, 'MMMM', { locale: es }),
    count: 0,
    total: 0,
    byService: { electricidad: 0, agua: 0, gas: 0 },
    boletas: [],
  }
}

function bucketsForYear(boletas: BoletaGuardada[], year: number): MonthBucket[] {
  const buckets: MonthBucket[] = Array.from({ length: 12 }, (_, m) =>
    emptyBucket(year, m),
  )
  for (const b of boletas) {
    if (!b.periodo?.desde) continue
    if (b.periodo.desde.getFullYear() !== year) continue
    const m = b.periodo.desde.getMonth()
    const bucket = buckets[m]
    bucket.count++
    bucket.total += b.totales.total
    if (b.servicio === 'electricidad' || b.servicio === 'agua' || b.servicio === 'gas') {
      bucket.byService[b.servicio] += b.totales.total
    }
    bucket.boletas.push(b)
  }
  return buckets
}

function bucketsLast12(boletas: BoletaGuardada[], now: Date): MonthBucket[] {
  const result: MonthBucket[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const bucket = emptyBucket(d.getFullYear(), d.getMonth())
    for (const b of boletas) {
      if (!b.periodo?.desde) continue
      if (
        b.periodo.desde.getFullYear() === bucket.year &&
        b.periodo.desde.getMonth() === bucket.monthIdx
      ) {
        bucket.count++
        bucket.total += b.totales.total
        if (b.servicio === 'electricidad' || b.servicio === 'agua' || b.servicio === 'gas') {
          bucket.byService[b.servicio] += b.totales.total
        }
        bucket.boletas.push(b)
      }
    }
    result.push(bucket)
  }
  return result
}

function levelFor(total: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (total === 0) return 0
  if (max === 0) return 1
  const ratio = total / max
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}

const LEVEL_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-white border-border',
  1: 'bg-cream-warm/30 border-cream-warm',
  2: 'bg-cream-warm/60 border-cream-warm',
  3: 'bg-accent-soft border-accent/40',
  4: 'bg-accent/20 border-accent',
}

function formatCLP(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '-'
  return `$ ${Math.round(n).toLocaleString('es-CL')}`
}

export function Tracker() {
  const [boletas, setBoletas] = useState<BoletaGuardada[]>([])
  const [loaded, setLoaded] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<MonthBucket | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    listarBoletas()
      .then((all) => {
        setBoletas(all)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [refresh])

  const buckets = useMemo(() => bucketsForYear(boletas, year), [boletas, year])
  const bucketsMobile = useMemo(
    () => bucketsLast12(boletas, new Date()),
    [boletas],
  )

  const yearTotal = buckets.reduce((s, b) => s + b.total, 0)
  const yearCount = buckets.reduce((s, b) => s + b.count, 0)
  const maxMonthTotal = Math.max(...buckets.map((b) => b.total), 0)

  const monthsWithData = buckets.filter((b) => b.count > 0)
  const promedio =
    monthsWithData.length > 0
      ? yearTotal / monthsWithData.length
      : 0
  const masCaro =
    monthsWithData.length > 0
      ? monthsWithData.reduce((a, b) => (b.total > a.total ? b : a))
      : null
  const masBarato =
    monthsWithData.length > 0
      ? monthsWithData.reduce((a, b) => (b.total < a.total ? b : a))
      : null

  const yearsAvailable = useMemo(() => {
    const set = new Set<number>()
    for (const b of boletas) {
      if (b.periodo?.desde) set.add(b.periodo.desde.getFullYear())
    }
    set.add(new Date().getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [boletas])

  const triggerRefresh = useCallback(() => setRefresh((r) => r + 1), [])

  return (
    <main className="flex-1">
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Tracker
          </p>
          <h1 className="mt-4 max-w-[22ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Tu histórico de boletas, en un solo mapa.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Mostramos las boletas que guardaste en este celular, agrupadas por
            mes. Nada vive en servidores: todo es local, exportable e
            importable.
          </p>
        </Container>
      </section>

      {!loaded ? (
        <section className="bg-cream pb-20">
          <Container>
            {/* min-h reserva el espacio del estado vacío/cargado para evitar
                que el body se desplace cuando llega la data desde IndexedDB
                (CLS WCAG/Lighthouse). */}
            <div className="min-h-[420px] rounded-[20px] border border-border bg-white p-10">
              <p
                role="status"
                aria-live="polite"
                className="font-mono text-xs uppercase tracking-[0.1em] text-soft"
              >
                Cargando tu histórico…
              </p>
            </div>
          </Container>
        </section>
      ) : boletas.length === 0 ? (
        <section className="bg-cream pb-20">
          <Container>
            <div className="min-h-[420px] rounded-[20px] border border-border bg-white p-10 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
                Sin boletas todavía
              </p>
              <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
                Sube tu primera boleta
              </h2>
              <p className="mt-3 max-w-md mx-auto text-body">
                Guarda una y vamos armando tu histórico mes a mes. El detalle,
                la comparativa y la alerta de subidas viven solo en este
                celular.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild variant="dark" size="lg">
                  <Link href="/boleta-luz">Subir mi primera boleta</Link>
                </Button>
                <Button asChild variant="ghost" size="md">
                  <Link href="/boleta-agua">Boleta de agua</Link>
                </Button>
                <Button asChild variant="ghost" size="md">
                  <Link href="/boleta-gas">Boleta de gas</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      ) : (
        <>
          <section className="bg-cream pb-12">
            <Container>
              <YearNav
                year={year}
                onYearChange={setYear}
                years={yearsAvailable}
              />

              {/* Desktop: 12-month grid */}
              <ul className="mt-8 hidden grid-cols-3 gap-3 md:grid lg:grid-cols-4">
                {buckets.map((bucket) => (
                  <MonthCell
                    key={`${bucket.year}-${bucket.monthIdx}`}
                    bucket={bucket}
                    maxMonthTotal={maxMonthTotal}
                    onClick={() => setSelectedMonth(bucket)}
                  />
                ))}
              </ul>

              {/* Mobile: vertical card list of last 12 months */}
              <ul className="mt-8 flex flex-col gap-3 md:hidden">
                {bucketsMobile.map((bucket) => (
                  <MonthCardMobile
                    key={`${bucket.year}-${bucket.monthIdx}`}
                    bucket={bucket}
                    onClick={() => setSelectedMonth(bucket)}
                  />
                ))}
              </ul>
            </Container>
          </section>

          <section className="bg-white py-16">
            <Container>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
                Resumen {year}
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
                {yearCount} {yearCount === 1 ? 'boleta' : 'boletas'} ·{' '}
                {formatCLP(yearTotal)} en total
              </h2>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard
                  label="Promedio mensual"
                  value={formatCLP(promedio)}
                  hint={
                    monthsWithData.length > 0
                      ? `${monthsWithData.length} ${
                          monthsWithData.length === 1 ? 'mes' : 'meses'
                        } con boletas`
                      : 'Sin datos aún'
                  }
                />
                <SummaryCard
                  label="Mes más caro"
                  value={masCaro ? formatCLP(masCaro.total) : '-'}
                  hint={masCaro ? masCaro.label : 'Sin datos'}
                  tone="danger"
                />
                <SummaryCard
                  label="Mes más barato"
                  value={masBarato ? formatCLP(masBarato.total) : '-'}
                  hint={masBarato ? masBarato.label : 'Sin datos'}
                  tone="success"
                />
              </div>

              <div className="mt-12">
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
                  Evolución mensual por servicio
                </p>
                <h3 className="mt-2 text-2xl font-medium tracking-tight text-ink">
                  {year}
                </h3>
                <LineChart buckets={buckets} className="mt-6" />
              </div>
            </Container>
          </section>

          <section className="bg-cream py-16">
            <Container>
              <ManagementPanel onChanged={triggerRefresh} />
            </Container>
          </section>
        </>
      )}

      {selectedMonth && (
        <MonthModal
          bucket={selectedMonth}
          onClose={() => setSelectedMonth(null)}
          onDeleted={() => {
            triggerRefresh()
            setSelectedMonth(null)
          }}
        />
      )}
    </main>
  )
}

function YearNav({
  year,
  onYearChange,
  years,
}: {
  year: number
  onYearChange: (y: number) => void
  years: number[]
}) {
  const idx = years.indexOf(year)
  const canPrev = idx >= 0 && idx < years.length - 1
  const canNext = idx > 0
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => canPrev && onYearChange(years[idx + 1])}
        disabled={!canPrev}
        className="font-mono text-sm uppercase tracking-wide text-soft hover:text-ink disabled:opacity-30"
      >
        ← {canPrev ? years[idx + 1] : ''}
      </button>
      <h2 className="font-mono text-3xl font-medium text-ink md:text-4xl">
        {year}
      </h2>
      <button
        type="button"
        onClick={() => canNext && onYearChange(years[idx - 1])}
        disabled={!canNext}
        className="font-mono text-sm uppercase tracking-wide text-soft hover:text-ink disabled:opacity-30"
      >
        {canNext ? years[idx - 1] : ''} →
      </button>
    </div>
  )
}

function MonthCell({
  bucket,
  maxMonthTotal,
  onClick,
}: {
  bucket: MonthBucket
  maxMonthTotal: number
  onClick: () => void
}) {
  const level = levelFor(bucket.total, maxMonthTotal)
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex h-full w-full flex-col items-start gap-2 rounded-md border px-4 py-3 text-left transition-all hover:scale-[1.02] hover:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
          LEVEL_BG[level],
        )}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-soft">
          {bucket.label}
        </span>
        <span className="text-lg font-medium tabular-nums text-ink">
          {formatCLP(bucket.total)}
        </span>
        <span className="text-xs text-body">
          {bucket.count} {bucket.count === 1 ? 'boleta' : 'boletas'}
        </span>
      </button>
    </li>
  )
}

function MonthCardMobile({
  bucket,
  onClick,
}: {
  bucket: MonthBucket
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-md border border-border bg-white px-5 py-4 text-left hover:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      >
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-soft">
            {bucket.label} {bucket.year}
          </span>
          <p className="mt-1 text-lg font-medium tabular-nums text-ink">
            {formatCLP(bucket.total)}
          </p>
          <p className="text-xs text-body">
            {bucket.count} {bucket.count === 1 ? 'boleta' : 'boletas'}
          </p>
        </div>
        <span aria-hidden className="text-soft">
          →
        </span>
      </button>
    </li>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'success' | 'danger'
}) {
  return (
    <div className="rounded-[20px] border border-border bg-cream p-6">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        {label}
      </p>
      <p
        className={cn(
          'mt-3 text-3xl font-medium leading-tight tabular-nums tracking-tight',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-danger',
          !tone && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs uppercase tracking-wide text-soft">{hint}</p>}
    </div>
  )
}

function LineChart({
  buckets,
  className,
}: {
  buckets: MonthBucket[]
  className?: string
}) {
  const width = 800
  const height = 240
  const padding = { top: 16, right: 16, bottom: 32, left: 56 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const allValues = buckets.flatMap((b) => SERVICIOS.map((s) => b.byService[s]))
  const rawMax = Math.max(...allValues, 0)
  const maxY = rawMax > 0 ? rawMax * 1.1 : 1

  const xStep = buckets.length > 1 ? innerW / (buckets.length - 1) : innerW

  const lines = SERVICIOS.map((servicio) => {
    const points = buckets.map((b, i) => {
      const v = b.byService[servicio]
      const x = padding.left + i * xStep
      const y = padding.top + innerH - (v / maxY) * innerH
      return { x, y, value: v, label: b.label }
    })
    return { servicio, points }
  })

  const yTicks = 4
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxY * i) / yTicks),
  )

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Evolución mensual de gasto por servicio"
      >
        {tickValues.map((tv, i) => {
          const y = padding.top + innerH - (tv / maxY) * innerH
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerW}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="2 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                className="fill-soft font-mono"
              >
                {tv === 0 ? '0' : `$${(tv / 1000).toFixed(0)}k`}
              </text>
            </g>
          )
        })}

        {buckets.map((b, i) => {
          const x = padding.left + i * xStep
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              className="fill-soft font-mono uppercase"
            >
              {b.label.slice(0, 3)}
            </text>
          )
        })}

        {lines.map(({ servicio, points }) => (
          <g key={servicio}>
            <polyline
              fill="none"
              stroke={SERVICIO_COLORS[servicio]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            />
            {points.map((p, i) => (
              <circle
                key={`${servicio}-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.value > 0 ? 3 : 0}
                fill={SERVICIO_COLORS[servicio]}
              >
                <title>
                  {p.label} · {SERVICIO_LABEL[servicio]}: {formatCLP(p.value)}
                </title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-4 flex flex-wrap gap-3">
        {SERVICIOS.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-2 text-xs text-body"
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: SERVICIO_COLORS[s] }}
            />
            {SERVICIO_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  )
}

function MonthModal({
  bucket,
  onClose,
  onDeleted,
}: {
  bucket: MonthBucket
  onClose: () => void
  onDeleted: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar esta boleta del histórico?')) return
    await eliminarBoleta(id)
    onDeleted()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[20px] border border-border bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-cream px-6 py-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              {bucket.label} {bucket.year}
            </p>
            <h3 className="mt-1 text-2xl font-medium tracking-tight text-ink">
              {formatCLP(bucket.total)}
            </h3>
            <p className="text-xs text-body">
              {bucket.count} {bucket.count === 1 ? 'boleta' : 'boletas'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-2xl leading-none text-soft hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {bucket.boletas.length === 0 ? (
            <div className="text-center">
              <p className="text-body">Este mes no tiene boletas guardadas.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SERVICIOS.map((s) => (
                  <Button asChild key={s} variant="ghost" size="sm">
                    <Link href={SERVICIO_HREF[s]}>
                      Subir boleta de {SERVICIO_LABEL[s].toLowerCase()}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {bucket.boletas.map((b) => (
                <li
                  key={b.id}
                  className="flex items-start justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-medium text-ink">{b.empresa}</p>
                    <p className="text-xs uppercase tracking-wide text-soft">
                      {SERVICIO_LABEL[b.servicio as Servicio] ?? b.servicio} ·{' '}
                      {format(b.periodo.desde, 'd MMM', { locale: es })}–
                      {format(b.periodo.hasta, 'd MMM yyyy', { locale: es })}
                    </p>
                    {b.cargos.some((c) => c.sospechoso) && (
                      <Pill variant="warning" className="mt-2">
                        {b.cargos.filter((c) => c.sospechoso).length}{' '}
                        {b.cargos.filter((c) => c.sospechoso).length === 1
                          ? 'flag'
                          : 'flags'}
                      </Pill>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-medium tabular-nums text-ink">
                      {formatCLP(b.totales.total)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="text-xs uppercase tracking-wide text-soft hover:text-danger"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ManagementPanel({ onChanged }: { onChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)
  const [confirmStep, setConfirmStep] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!confirmStep) return
    const t = setTimeout(() => setConfirmStep(false), 5000)
    return () => clearTimeout(t)
  }, [confirmStep])

  async function handleExport() {
    setFeedback(null)
    try {
      const blob = await exportarHistorial()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lalupa-historial-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setFeedback({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'No pudimos exportar.',
      })
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFeedback(null)
    try {
      const count = await importarHistorial(file)
      setFeedback({
        kind: 'success',
        message: `Importadas ${count} ${count === 1 ? 'boleta' : 'boletas'}.`,
      })
      onChanged()
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No pudimos importar.',
      })
    }
  }

  async function handleDelete() {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }
    setDeleting(true)
    setFeedback(null)
    try {
      const count = await eliminarTodasLasBoletas()
      setFeedback({
        kind: 'success',
        message: `Borrado: ${count} ${count === 1 ? 'boleta' : 'boletas'}.`,
      })
      setConfirmStep(false)
      onChanged()
    } catch (err) {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No pudimos borrar.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-[20px] border border-border bg-white p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink">
        Gestión del histórico
      </p>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-body">
        Tu histórico vive solo en este celular. Exportá un JSON para mover a
        otro dispositivo o respaldar; importá uno existente para recuperarlo.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="dark" size="md" onClick={handleExport}>
          Exportar JSON
        </Button>
        <Button
          variant="ghost"
          size="md"
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
          tabIndex={-1}
          aria-hidden
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-wide transition-colors',
            confirmStep
              ? 'bg-danger text-cream hover:bg-danger/80'
              : 'border border-danger text-danger hover:bg-danger hover:text-cream',
            deleting && 'opacity-50',
          )}
        >
          {deleting
            ? 'Borrando…'
            : confirmStep
              ? '¿Seguro? Click para confirmar'
              : 'Borrar todo'}
        </button>
      </div>
      {feedback && (
        <p
          role="status"
          className={cn(
            'mt-4 text-sm',
            feedback.kind === 'success' ? 'text-success' : 'text-danger',
          )}
        >
          {feedback.message}
        </p>
      )}
      <Alert variant="info" className="mt-8">
        <Alert.Title>Privacidad</Alert.Title>
        <Alert.Body>
          Todo se guarda en IndexedDB de tu navegador (db `lalupa`). No hay
          servidor que sincronice. Si limpias los datos del navegador o
          cambias de celular, se pierde, usá Exportar para hacer respaldo.
        </Alert.Body>
      </Alert>
    </div>
  )
}
