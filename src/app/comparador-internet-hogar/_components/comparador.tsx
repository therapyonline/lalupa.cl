'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { Input } from '@/components/ui/Input'
import { COMUNAS } from '@/data/comunas'
import {
  type PlanScored,
  type ServicioIncluido,
  compararPlanes,
} from '@/data/internet-planes'
import { cn } from '@/lib/utils'

type Servicios = 'solo' | 'tv' | 'completo'
type Orden = 'score' | 'precio' | 'velocidad'

const SERVICIOS_MAP: Record<Servicios, ServicioIncluido[]> = {
  solo: ['internet'],
  tv: ['internet', 'tv'],
  completo: ['internet', 'tv', 'telefonia'],
}

const SERVICIOS_LABEL: Record<Servicios, string> = {
  solo: 'Solo internet',
  tv: 'Internet + TV',
  completo: 'Internet + TV + Telefonía',
}

function formatCLP(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-CL')}`
}

function deltaPct(precioPromo: number, precioPost: number): number {
  if (precioPromo <= 0) return 0
  return Math.round(((precioPost - precioPromo) / precioPromo) * 100)
}

interface Preset {
  label: string
  description: string
  velocidad: number
  presupuesto: number
  tipo: Servicios
}

const PRESETS: ReadonlyArray<Preset> = [
  {
    label: 'Internet básico',
    description: '300 Mbps · hasta $15k · solo internet',
    velocidad: 300,
    presupuesto: 15000,
    tipo: 'solo',
  },
  {
    label: 'Streaming + remoto',
    description: '600 Mbps · hasta $20k · solo internet',
    velocidad: 600,
    presupuesto: 20000,
    tipo: 'solo',
  },
  {
    label: 'Hogar pro / gamer',
    description: '1 Gbps · hasta $30k · solo internet',
    velocidad: 1000,
    presupuesto: 30000,
    tipo: 'solo',
  },
  {
    label: 'Pack familia',
    description: '600 Mbps · hasta $30k · internet + TV',
    velocidad: 600,
    presupuesto: 30000,
    tipo: 'tv',
  },
]

export function Comparador() {
  const [comuna, setComuna] = useState('')
  const [velocidad, setVelocidad] = useState(600)
  const [presupuesto, setPresupuesto] = useState(20000)
  const [tipoServicio, setTipoServicio] = useState<Servicios>('solo')
  const [orden, setOrden] = useState<Orden>('score')

  function applyPreset(p: Preset) {
    setVelocidad(p.velocidad)
    setPresupuesto(p.presupuesto)
    setTipoServicio(p.tipo)
  }

  const planesScored = useMemo<PlanScored[]>(() => {
    return compararPlanes({
      velocidadMin: velocidad,
      presupuestoMaxPromo: presupuesto,
      servicios: SERVICIOS_MAP[tipoServicio],
    })
  }, [velocidad, presupuesto, tipoServicio])

  const planesOrdenados = useMemo<PlanScored[]>(() => {
    const arr = [...planesScored]
    if (orden === 'precio') {
      arr.sort((a, b) => a.precio.mes1a12 - b.precio.mes1a12)
    } else if (orden === 'velocidad') {
      arr.sort((a, b) => b.velocidad.bajada - a.velocidad.bajada)
    } else {
      arr.sort((a, b) => b.score - a.score)
    }
    return arr
  }, [planesScored, orden])

  return (
    <>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Comparador internet hogar 2026
          </p>
          <h1 className="mt-4 max-w-[22ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            ¿Cuál es el plan que más te conviene?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Comparamos planes de fibra y cable de las 7 principales empresas
            chilenas. Filtra por lo que necesitas y mira la letra chica antes
            de firmar.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-soft">
            Si quieres entender primero la diferencia técnica entre fibra
            óptica (FTTH) y cable (HFC), lee la{' '}
            <Link
              href="/guias/fibra-vs-cable-internet-chile"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              guía completa de fibra vs cable en Chile 2026
            </Link>
            .
          </p>

          <div className="mt-8" aria-label="Filtros sugeridos">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Empieza rápido con un perfil
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="group flex flex-col items-start gap-0.5 rounded-2xl border border-border bg-white px-4 py-2 text-left transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  <span className="text-sm font-medium text-ink">
                    {p.label}
                  </span>
                  <span className="font-mono text-[11px] text-soft group-hover:text-body">
                    {p.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
            <FiltersPanel
              comuna={comuna}
              setComuna={setComuna}
              velocidad={velocidad}
              setVelocidad={setVelocidad}
              presupuesto={presupuesto}
              setPresupuesto={setPresupuesto}
              tipoServicio={tipoServicio}
              setTipoServicio={setTipoServicio}
            />

            <div>
              <Toolbar
                total={planesOrdenados.length}
                orden={orden}
                setOrden={setOrden}
              />

              {planesOrdenados.length === 0 ? (
                <Alert variant="info" className="mt-6">
                  <Alert.Title>Sin matches con esos filtros</Alert.Title>
                  <Alert.Body>
                    Prueba subir el presupuesto o bajar la velocidad mínima.
                    Los precios promo van desde ~$10.000 (WOM) hasta ~$30.000
                    (triple pack).
                  </Alert.Body>
                </Alert>
              ) : (
                <ul className="mt-6 flex flex-col gap-4">
                  {planesOrdenados.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} comuna={comuna} />
                  ))}
                </ul>
              )}

              <Alert variant="info" className="mt-10">
                <Alert.Title>Datos referenciales</Alert.Title>
                <Alert.Body>
                  Los precios cambian seguido (típicamente bimestral) y la
                  cobertura por comuna depende de factibilidad técnica que
                  cada empresa valida con tu dirección. Verifica el precio
                  vigente en el sitio oficial antes de contratar.{' '}
                  {comuna && (
                    <>
                      Para tu comuna <strong>{comuna}</strong>, confirmá
                      cobertura en cada empresa.
                    </>
                  )}
                </Alert.Body>
              </Alert>
            </div>
          </div>
        </Container>
      </section>

      <ComunasDatalist />
    </>
  )
}

function FiltersPanel({
  comuna,
  setComuna,
  velocidad,
  setVelocidad,
  presupuesto,
  setPresupuesto,
  tipoServicio,
  setTipoServicio,
}: {
  comuna: string
  setComuna: (s: string) => void
  velocidad: number
  setVelocidad: (n: number) => void
  presupuesto: number
  setPresupuesto: (n: number) => void
  tipoServicio: Servicios
  setTipoServicio: (s: Servicios) => void
}) {
  return (
    <aside className="rounded-[20px] border border-border bg-white p-6 md:p-8 lg:sticky lg:top-24 lg:self-start">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        Tus criterios
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <div>
          <Input
            label="Comuna"
            type="text"
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            placeholder="Ej: Ñuñoa"
            list="comunas-list"
            hint="Para verificar cobertura. No filtra el ranking aún (factibilidad técnica varía por dirección)."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="comparador-velocidad"
            className="text-[13px] font-bold text-ink"
          >
            Velocidad mínima
          </label>
          <input
            id="comparador-velocidad"
            type="range"
            min={100}
            max={1000}
            step={50}
            value={velocidad}
            onChange={(e) => setVelocidad(parseInt(e.target.value, 10))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-primary"
            aria-valuetext={
              velocidad >= 1000 ? '1 Gbps' : `${velocidad} Mbps`
            }
          />
          <div className="flex items-center justify-between text-xs text-soft">
            <span>100 Mbps</span>
            <span className="font-mono text-base font-medium text-ink">
              {velocidad >= 1000 ? '1 Gbps' : `${velocidad} Mbps`}
            </span>
            <span>1 Gbps</span>
          </div>
        </div>

        <div>
          <Input
            label="Presupuesto mensual (CLP)"
            type="number"
            value={String(presupuesto)}
            onChange={(e) => {
              const raw = e.target.value
              const n = parseInt(raw, 10)
              setPresupuesto(Number.isNaN(n) ? 0 : n)
            }}
            min={5000}
            max={100000}
            hint={`${formatCLP(presupuesto)} máximo en precio promo`}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[13px] font-bold text-ink">
            Servicios necesarios
          </legend>
          {(Object.keys(SERVICIOS_MAP) as Servicios[]).map((opt) => (
            <label
              key={opt}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-white px-4 py-3 transition-colors hover:border-ink',
                tipoServicio === opt && 'border-primary bg-primary-soft',
              )}
            >
              <input
                type="radio"
                name="servicios"
                value={opt}
                checked={tipoServicio === opt}
                onChange={() => setTipoServicio(opt)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[14px] text-ink">
                {SERVICIOS_LABEL[opt]}
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </aside>
  )
}

function Toolbar({
  total,
  orden,
  setOrden,
}: {
  total: number
  orden: Orden
  setOrden: (o: Orden) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          Resultados
        </p>
        <p className="mt-1 text-2xl font-medium tracking-tight text-ink md:text-3xl">
          {total} {total === 1 ? 'plan' : 'planes'} matchean
        </p>
      </div>
      <div className="flex flex-col gap-1 sm:items-end">
        <label
          htmlFor="orden"
          className="font-mono text-xs uppercase tracking-[0.1em] text-soft"
        >
          Ordenar por
        </label>
        <select
          id="orden"
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          className="rounded-md border-[1.5px] border-border bg-white px-3 py-2 text-sm font-medium text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
        >
          <option value="score">Score (recomendado)</option>
          <option value="precio">Precio (más bajo primero)</option>
          <option value="velocidad">Velocidad (más alta primero)</option>
        </select>
      </div>
    </div>
  )
}

function PlanCard({ plan, comuna }: { plan: PlanScored; comuna: string }) {
  const subePct = deltaPct(plan.precio.mes1a12, plan.precio.mes13plus)
  const subeFlag =
    subePct >= 50 ? `Sube ${subePct}% al mes 13` : null

  const compromisoFlag =
    plan.compromisoMeses > 12
      ? `Compromiso ${plan.compromisoMeses} meses`
      : null

  return (
    <li>
      <article className="rounded-[20px] border border-border bg-white p-6 md:p-7">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              {plan.empresa}
            </p>
            <h2 className="mt-2 text-xl font-medium leading-tight tracking-tight text-ink md:text-2xl">
              {plan.plan}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-wide text-soft">
              {plan.tecnologia === 'fibra'
                ? 'Fibra simétrica'
                : plan.tecnologia === 'cable'
                  ? 'Cable'
                  : plan.tecnologia === '5g'
                    ? '5G'
                    : 'Inalámbrica'}
            </p>
          </div>
          <ScoreBadge score={plan.score} />
        </header>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat label="Bajada" value={`${plan.velocidad.bajada} Mbps`} />
          <Stat label="Subida" value={`${plan.velocidad.subida} Mbps`} />
          <Stat
            label={`Mes 1–${Math.min(plan.promoDuraMeses, 12)}`}
            value={formatCLP(plan.precio.mes1a12)}
            highlight
          />
          <Stat
            label={`Mes ${plan.promoDuraMeses + 1}+`}
            value={formatCLP(plan.precio.mes13plus)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {compromisoFlag && (
            <Pill variant="warning">{compromisoFlag}</Pill>
          )}
          {plan.compromisoMeses === 0 && (
            <Pill variant="success">Sin permanencia</Pill>
          )}
          {subeFlag && <Pill variant="warning">{subeFlag}</Pill>}
          {plan.alertas.map((a) => {
            const variant = /requiere|limitad|asim[eé]trica|disponibilidad/i.test(a)
              ? 'warning'
              : /referencia/i.test(a)
                ? 'info'
                : 'accent'
            return (
              <Pill key={a} variant={variant}>
                {a}
              </Pill>
            )
          })}
          {comuna && plan.empresa === 'VTR' && (
            <Pill variant="warning">
              Verifica cobertura en {comuna}
            </Pill>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {plan.motivosScore.length > 0 ? (
            <p className="text-xs text-soft">
              {plan.motivosScore[0]}
            </p>
          ) : (
            <span />
          )}
          <Button asChild variant="dark" size="md">
            <a href={plan.fuente} target="_blank" rel="noopener noreferrer">
              Contratar en {plan.empresa}
            </a>
          </Button>
        </div>
      </article>
    </li>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-soft">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-lg font-medium tabular-nums',
          highlight ? 'text-accent-deep' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 75 ? 'success' : score >= 50 ? 'info' : 'warning'
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-soft">
          Score
        </p>
        <p className="text-2xl font-medium tabular-nums tracking-tight text-ink">
          {score}
          <span className="text-sm text-soft">/100</span>
        </p>
      </div>
      <Pill variant={tone}>
        {score >= 75 ? 'Buen match' : score >= 50 ? 'Razonable' : 'Bajo'}
      </Pill>
    </div>
  )
}

function ComunasDatalist() {
  return (
    <datalist id="comunas-list">
      {COMUNAS.map((c) => (
        <option key={`${c.codigoRegion}-${c.nombre}`} value={c.nombre} />
      ))}
    </datalist>
  )
}
