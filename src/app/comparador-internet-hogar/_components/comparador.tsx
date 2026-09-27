'use client'

import { useState, useSyncExternalStore } from 'react'
import { Container } from '@/components/layout/Container'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  fechaSantiago,
  filtrarPlanes,
  precioDisponible,
  proyectarCosto,
  type PlanInternet,
  type Horizonte,
  type OrdenInternet,
} from '@/lib/internet/comparacion'

const selectClass =
  'min-h-12 w-full rounded-md border border-border bg-white px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const clp = (n: number) => `$ ${Math.round(n).toLocaleString('es-CL')}`
const fechaVisible = (s: string) => s.split('-').reverse().join('/')

// Actualiza también una pestaña abierta al cambiar la fecha de Santiago.
function suscribirFecha(notify: () => void) {
  const timer = window.setInterval(notify, 60_000)
  document.addEventListener('visibilitychange', notify)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', notify)
  }
}
const fechaActual = () => fechaSantiago(new Date())

export function Comparador({
  planes,
  fechaServidor,
}: {
  planes: readonly PlanInternet[]
  fechaServidor: string
}) {
  const fechaCliente = useSyncExternalStore(
    suscribirFecha,
    fechaActual,
    () => fechaServidor,
  )
  const hoy = fechaCliente > fechaServidor ? fechaCliente : fechaServidor
  const [meses, setMeses] = useState<Horizonte>(24)
  const [empresa, setEmpresa] = useState('')
  const [velocidad, setVelocidad] = useState(0)
  const [servicios, setServicios] = useState<'todos' | 'solo' | 'tv'>('todos')
  const [presupuesto, setPresupuesto] = useState('')
  const [orden, setOrden] = useState<OrdenInternet>('empresa')
  const presupuestoInvalido =
    presupuesto !== '' &&
    (!/^\d+$/.test(presupuesto) || !Number.isSafeInteger(Number(presupuesto)))
  const disponibles = planes.filter((p) => precioDisponible(p, hoy))
  const resultados = presupuestoInvalido
    ? []
    : filtrarPlanes(planes, hoy, {
        empresa,
        bajadaMin: velocidad,
        servicios,
        meses,
        orden,
        presupuesto: presupuesto === '' ? undefined : Number(presupuesto),
      })
  function limpiar() {
    setEmpresa('')
    setVelocidad(0)
    setServicios('todos')
    setPresupuesto('')
    setOrden('empresa')
  }

  return (
    <section
      id="planes"
      aria-labelledby="planes-heading"
      className="bg-cream pb-16 scroll-mt-24"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside
            aria-label="Filtros de planes"
            className="rounded-[20px] border border-border bg-white p-6 lg:sticky lg:top-24 lg:self-start"
          >
            <h2 className="text-xl font-medium text-ink">
              Ajusta la comparación
            </h2>
            <div className="mt-6 flex flex-col gap-5">
              <div className="text-sm font-medium text-ink">
                <label htmlFor="internet-periodo">Período a comparar</label>
                <select
                  id="internet-periodo"
                  className={`mt-2 ${selectClass}`}
                  value={meses}
                  onChange={(e) =>
                    setMeses(Number(e.target.value) as Horizonte)
                  }
                >
                  <option value={12}>12 meses</option>
                  <option value={24}>24 meses</option>
                </select>
              </div>
              <Input
                label="Presupuesto promedio mensual (CLP)"
                type="number"
                min={0}
                step={1}
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                placeholder="Sin límite"
                error={
                  presupuestoInvalido
                    ? 'Ingresa pesos enteros, sin valores negativos.'
                    : undefined
                }
                hint={`Filtra por la proyección total dividida en ${meses} meses, incluida la instalación. Solo muestra planes cuyo total se puede calcular.`}
              />
              <div className="text-sm font-medium text-ink">
                <label htmlFor="internet-empresa">Empresa</label>
                <select
                  id="internet-empresa"
                  className={`mt-2 ${selectClass}`}
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                >
                  <option value="">Todas las del catálogo</option>
                  {[...new Set(planes.map((p) => p.empresa))]
                    .sort()
                    .map((nombre) => (
                      <option key={nombre}>{nombre}</option>
                    ))}
                </select>
              </div>
              <div className="text-sm font-medium text-ink">
                <label htmlFor="internet-bajada">Bajada mínima anunciada</label>
                <select
                  id="internet-bajada"
                  className={`mt-2 ${selectClass}`}
                  value={velocidad}
                  onChange={(e) => setVelocidad(Number(e.target.value))}
                >
                  <option value={0}>Cualquiera</option>
                  <option value={600}>600 Mbps</option>
                  <option value={800}>800 Mbps</option>
                  <option value={940}>940 Mbps</option>
                  <option value={1000}>1.000 Mbps</option>
                </select>
              </div>
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-ink">
                  Servicios
                </legend>
                {(
                  [
                    ['todos', 'Todos'],
                    ['solo', 'Sin pack de TV'],
                    ['tv', 'Con televisión'],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex min-h-11 items-center gap-3 rounded-md border p-3 text-sm text-ink ${servicios === value ? 'border-primary bg-primary-soft' : 'border-border'}`}
                  >
                    <input
                      type="radio"
                      name="servicios"
                      value={value}
                      checked={servicios === value}
                      onChange={() => setServicios(value)}
                      className="h-4 w-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <Button variant="ghost" onClick={limpiar}>
                Limpiar filtros
              </Button>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="planes-heading"
                  className="text-2xl font-medium text-ink"
                >
                  Planes con precios observados
                </h2>
                <p
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-2 text-sm text-body"
                >
                  {presupuestoInvalido
                    ? 'Corrige el presupuesto para comparar.'
                    : `${resultados.length} planes coinciden con tus filtros.`}
                </p>
              </div>
              <div className="text-sm font-medium text-ink">
                <label htmlFor="internet-orden">Ordenar por</label>
                <select
                  id="internet-orden"
                  className={`mt-2 ${selectClass}`}
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as OrdenInternet)}
                >
                  <option value="empresa">Empresa (A–Z)</option>
                  <option value="promedio">
                    Promedio proyectado: menor primero
                  </option>
                  <option value="velocidad">Bajada: mayor primero</option>
                </select>
              </div>
            </div>
            {disponibles.length < planes.length && (
              <p className="mt-4 rounded-lg border border-border bg-white p-4 text-sm text-body">
                {planes.length - disponibles.length} precios requieren una nueva
                revisión y están fuera de la comparación.{' '}
                <a
                  href="#proveedores"
                  className="font-medium text-ink underline"
                >
                  Consulta las empresas
                </a>
                .
              </p>
            )}
            {!resultados.length && !presupuestoInvalido && (
              <div className="mt-6 rounded-[20px] border border-border bg-white p-6">
                <h3 className="text-lg font-medium text-ink">
                  No hay planes en esta selección
                </h3>
                <p className="mt-2 text-body">
                  Cambia los filtros o consulta otras ofertas con los
                  proveedores. Este resultado no significa que no haya servicio
                  disponible en tu domicilio.
                </p>
              </div>
            )}
            <ul className="mt-6 space-y-5" aria-label="Planes comparados">
              {resultados.map((plan) => (
                <PlanCard key={plan.id} plan={plan} meses={meses} />
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

function PlanCard({ plan, meses }: { plan: PlanInternet; meses: Horizonte }) {
  const costo = proyectarCosto(plan, meses)
  return (
    <li>
      <article
        aria-labelledby={`plan-${plan.id}`}
        className="rounded-[20px] border border-border bg-white p-6 md:p-7"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-body">
          {plan.empresa} · {plan.tecnologia}
        </p>
        <h3
          id={`plan-${plan.id}`}
          className="mt-2 text-2xl font-medium tracking-tight text-ink"
        >
          {plan.nombre}
        </h3>
        <p className="mt-2 text-sm text-body">
          Hasta {plan.bajadaMbps} Mbps de bajada ·{' '}
          {plan.subidaMbps === null
            ? 'Subida por confirmar'
            : `Hasta ${plan.subidaMbps} Mbps de subida`}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          {plan.tramos.map((t) => (
            <div key={t.desde}>
              <dt className="text-xs text-body">
                {t.hasta === null
                  ? `Desde el mes ${t.desde}`
                  : `Meses ${t.desde}–${t.hasta}`}
              </dt>
              <dd className="mt-1 text-xl font-medium tabular-nums text-ink">
                {t.mensualCLP === null ? 'Por confirmar' : clp(t.mensualCLP)}
                <span className="text-xs font-normal"> /mes</span>
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-body">Instalación publicada</dt>
            <dd className="mt-1 font-medium text-ink">
              {plan.instalacionCLP === null
                ? 'Por confirmar'
                : clp(plan.instalacionCLP)}
            </dd>
          </div>
        </dl>
        <div className="mt-5 rounded-xl bg-cream p-4">
          <p className="text-sm font-medium text-ink">
            Proyección a {meses} meses
          </p>
          {costo.total === null ? (
            <p className="mt-2 text-body">
              Faltan datos para un total completo.
            </p>
          ) : (
            <>
              <p className="mt-2 text-2xl font-medium tabular-nums text-ink">
                {clp(costo.total)}{' '}
                <span className="text-sm font-normal">en total</span>
              </p>
              <p className="mt-1 text-sm text-body">
                {clp(costo.promedio!)} promedio mensual
              </p>
            </>
          )}
          <details className="mt-3 text-sm text-body">
            <summary className="cursor-pointer font-medium text-ink underline">
              Ver cálculo y alcance
            </summary>
            <p className="mt-2">
              Mensualidades:{' '}
              {costo.mensualidades === null
                ? 'por confirmar'
                : clp(costo.mensualidades)}
              . Instalación:{' '}
              {plan.instalacionCLP === null
                ? 'por confirmar'
                : clp(plan.instalacionCLP)}
              . El promedio divide la suma por {meses} meses. No incluye
              reajustes futuros, equipos opcionales, consumos extra ni cargos
              por término.
            </p>
          </details>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-body">
          {plan.condiciones}
        </p>
        <p className="mt-3 text-xs text-body">
          Consulta editorial:{' '}
          <time dateTime={plan.observadaEl}>
            {fechaVisible(plan.observadaEl)}
          </time>
          .{' '}
          {plan.ofertaHasta
            ? `Campaña publicada hasta ${fechaVisible(plan.ofertaHasta)}.`
            : 'La fuente no fija aquí un término de campaña.'}
        </p>
        <p className="mt-2 text-xs text-body">
          Confirma factibilidad, cotización y condiciones de salida con la
          empresa.
        </p>
        <a
          href={plan.fuente}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:bg-primary"
        >
          Ver oferta y cobertura en {plan.empresa}
          <span className="sr-only"> (abre otra pestaña)</span>
        </a>
      </article>
    </li>
  )
}
