/**
 * Indicadores "Chile, en cifras" para la franja antes del footer.
 *
 * TODO: mover a archivo de constantes / API con tarifas reales SEC.
 *
 * Por ahora los 4 valores están hardcodeados según verificación al
 * 2026-05-06. La estructura está pensada para que sea barato swappearlos
 * por valores derivados desde los datasets ya copiados (`tarifas.ts`,
 * `elegibilidad-subsidio.ts`) o por una API pública cuando exista.
 */

import { TARIFAS_BT1_2026 } from './tarifas'

export interface Indicador {
  id: string
  /** Cifra ya formateada lista para mostrar (formato chileno: $ 156,84 / kWh). */
  cifra: string
  caption: string
  linkLabel: string
  href: string
  /** True si href apunta fuera del dominio (target="_blank"). */
  external?: boolean
  fuente: string
  /** True cuando el valor se computa en runtime desde otros datasets. */
  derivado: boolean
  notas?: string
}

export const INDICADORES_HOME: Indicador[] = [
  {
    id: 'tarifa-bt1-promedio',
    cifra: '$ 156,84 / kWh',
    caption: 'Tramo residencial · Abril 2026',
    linkLabel: 'Ver historial',
    href: '/guias',
    fuente: 'SEC — promedio BT-1 nacional',
    derivado: false,
    notas:
      'TODO: derivar con calcularTarifaBT1Promedio() cuando TARIFAS_BT1_2026 tenga todas las distribuidoras completas.',
  },
  {
    id: 'subsidio-electrico-tope',
    cifra: 'Hasta $ 32.224',
    caption: 'semestrales por hogar de 4 o más integrantes',
    linkLabel: '¿Calificas?',
    href: '/subsidio-electrico',
    fuente: 'Ley 21.667 — Quinta convocatoria 2026',
    derivado: false,
  },
  {
    id: 'reclamos-sernac-mes',
    cifra: '31.247',
    caption: 'Reclamos por cobros indebidos en marzo',
    linkLabel: 'Ver fuente',
    href: 'https://www.sernac.cl',
    external: true,
    fuente: 'SERNAC — Estadísticas mensuales',
    derivado: false,
    notas:
      'TODO: automatizar desde portal estadísticas SERNAC (no hay API pública, requiere scraping mensual).',
  },
  {
    id: 'variacion-tarifaria-12m',
    cifra: '+8,3%',
    caption: 'Cambio promedio últimos 12 meses',
    linkLabel: 'Por qué subió',
    href: '/guias',
    fuente: 'CNE — Variación tarifaria 12m',
    derivado: false,
    notas:
      'TODO: calcular desde calendario-tarifario-2026.md (acumular reajustes IPC + Ley 21.667).',
  },
]

/**
 * Promedia precioKWhTotalCLP de TARIFAS_BT1_2026 entre las distribuidoras
 * que ya tienen el campo cargado (no-null). Devuelve `null` si ninguna
 * está completa todavía.
 *
 * Stub anticipatorio para reemplazar el hardcode del indicador
 * `tarifa-bt1-promedio` cuando `tarifas.ts` cubra todas las distribuidoras.
 */
export function calcularTarifaBT1Promedio(): number | null {
  const valores = Object.values(TARIFAS_BT1_2026)
    .map((t) => t.precioKWhTotalCLP)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0)
  if (valores.length === 0) return null
  const promedio = valores.reduce((sum, v) => sum + v, 0) / valores.length
  return Math.round(promedio * 100) / 100
}

export const INDICADORES_METADATA = {
  ultimaActualizacion: '2026-05-06',
  proximaRevision: '2026-06-06',
  fuentesPrimarias: [
    'SEC — Tarifas de suministro vigentes',
    'CNE — Decretos tarifarios PNP',
    'SERNAC — Estadísticas de reclamos',
    'Ministerio de Energía — Subsidio Eléctrico Ley 21.667',
  ],
  pendientes: [
    'Conectar #1 (tarifa BT-1) a calcularTarifaBT1Promedio() cuando tarifas.ts esté completo',
    'Automatizar #3 con scraping mensual SERNAC',
    'Calcular #4 desde calendario-tarifario-2026.md (acumulado 12 meses)',
  ],
} as const
