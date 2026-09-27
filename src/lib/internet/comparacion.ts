export interface TramoPrecio {
  desde: number
  hasta: number | null
  mensualCLP: number | null
}
export interface PlanInternet {
  id: string
  empresa: string
  nombre: string
  tecnologia: string
  bajadaMbps: number
  subidaMbps: number | null
  servicios: readonly ('internet' | 'tv')[]
  tramos: readonly TramoPrecio[]
  /** null = sin confirmar; 0 solo cuando la fuente publica gratuidad. */
  instalacionCLP: number | null
  observadaEl: string
  /** Fecha límite editorial inclusiva; no es vigencia contractual. */
  revisarEl: string
  ofertaHasta?: string
  fuente: string
  condiciones: string
}
export type Horizonte = 12 | 24
export type OrdenInternet = 'empresa' | 'promedio' | 'velocidad'

function importe(n: number | null): n is number {
  return n !== null && Number.isSafeInteger(n) && n >= 0
}
function fechaValida(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s + 'T12:00:00Z')
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s
}
export function fechaSantiago(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha)
}
/** Un dato vencido o con fechas inválidas no entra al catálogo comparable. */
export function precioDisponible(plan: PlanInternet, hoy: string): boolean {
  const fechas = [
    hoy,
    plan.observadaEl,
    plan.revisarEl,
    ...(plan.ofertaHasta ? [plan.ofertaHasta] : []),
  ]
  return (
    fechas.every(fechaValida) &&
    hoy >= plan.observadaEl &&
    hoy <= plan.revisarEl &&
    (!plan.ofertaHasta || hoy <= plan.ofertaHasta)
  )
}
/** No rellena huecos, precios desconocidos ni instalación ausente con cero. */
export function proyectarCosto(plan: PlanInternet, meses: Horizonte) {
  if (meses !== 12 && meses !== 24)
    throw new RangeError('Horizonte no admitido')
  const incompleto = {
    mensualidades: null,
    instalacion: plan.instalacionCLP,
    total: null,
    promedio: null,
  }
  let mensualidades = 0
  if (
    plan.tramos.some(
      (t) =>
        !Number.isInteger(t.desde) ||
        t.desde < 1 ||
        (t.hasta !== null && (!Number.isInteger(t.hasta) || t.hasta < t.desde)),
    )
  )
    return incompleto
  for (let mes = 1; mes <= meses; mes++) {
    const tramos = plan.tramos.filter(
      (t) => t.desde <= mes && (t.hasta === null || t.hasta >= mes),
    )
    if (tramos.length !== 1 || !importe(tramos[0].mensualCLP)) return incompleto
    mensualidades += tramos[0].mensualCLP
    if (!Number.isSafeInteger(mensualidades)) return incompleto
  }
  const total = importe(plan.instalacionCLP)
    ? mensualidades + plan.instalacionCLP
    : null
  if (total !== null && !Number.isSafeInteger(total)) return incompleto
  return {
    mensualidades,
    instalacion: plan.instalacionCLP,
    total,
    promedio: total === null ? null : total / meses,
  }
}
export interface FiltrosInternet {
  empresa?: string
  bajadaMin?: number
  servicios?: 'solo' | 'tv' | 'todos'
  presupuesto?: number
  meses: Horizonte
  orden: OrdenInternet
}
export function filtrarPlanes(
  planes: readonly PlanInternet[],
  hoy: string,
  filtros: FiltrosInternet,
): PlanInternet[] {
  const { presupuesto } = filtros
  if (presupuesto !== undefined && !importe(presupuesto)) return []
  return planes
    .filter((plan) => {
      if (!precioDisponible(plan, hoy)) return false
      if (filtros.empresa && plan.empresa !== filtros.empresa) return false
      if (filtros.bajadaMin && plan.bajadaMbps < filtros.bajadaMin) return false
      if (filtros.servicios === 'solo' && plan.servicios.includes('tv'))
        return false
      if (filtros.servicios === 'tv' && !plan.servicios.includes('tv'))
        return false
      if (presupuesto !== undefined) {
        const promedio = proyectarCosto(plan, filtros.meses).promedio
        if (promedio === null || promedio > presupuesto) return false
      }
      return true
    })
    .sort((a, b) => {
      if (filtros.orden === 'velocidad' && a.bajadaMbps !== b.bajadaMbps)
        return b.bajadaMbps - a.bajadaMbps
      if (filtros.orden === 'promedio') {
        const x = proyectarCosto(a, filtros.meses).promedio
        const y = proyectarCosto(b, filtros.meses).promedio
        if (x !== y) return x === null ? 1 : y === null ? -1 : x - y
      }
      return (
        a.empresa.localeCompare(b.empresa, 'es') || a.id.localeCompare(b.id)
      )
    })
}
