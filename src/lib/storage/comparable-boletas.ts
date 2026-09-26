import { isValidDate } from '@/lib/dates'
import type { ParsedBoleta } from '@/lib/parsers'
import type { BoletaGuardada } from './historial'
import { supplyKey } from './boleta-identity'

/** Las variantes se conservan en storage; el resumen usa la última lectura por suministro/período. */
export function latestPeriodReadings(all: BoletaGuardada[]): BoletaGuardada[] {
  const periods = new Map<string, BoletaGuardada>()
  const ungrouped: BoletaGuardada[] = []
  for (const boleta of all) {
    const supply = supplyKey(boleta)
    if (
      !supply ||
      boleta.tipoVenta === 'producto' ||
      !isValidDate(boleta.periodo.desde) ||
      !isValidDate(boleta.periodo.hasta)
    ) {
      ungrouped.push(boleta)
      continue
    }
    const period = `${supply}/${boleta.periodo.desde.toISOString()}/${boleta.periodo.hasta.toISOString()}`
    const existing = periods.get(period)
    if (
      !existing ||
      (boleta.guardadoEn.getTime() || 0) >= (existing.guardadoEn.getTime() || 0)
    )
      periods.set(period, boleta)
  }
  return [...ungrouped, ...periods.values()]
}

/** Solo períodos anteriores del mismo suministro; una variante por período. */
export function comparableBoletas(
  all: BoletaGuardada[],
  actual: ParsedBoleta,
): BoletaGuardada[] {
  const key = supplyKey(actual)
  if (
    !key ||
    actual.tipoVenta === 'producto' ||
    !isValidDate(actual.periodo.desde) ||
    !isValidDate(actual.periodo.hasta)
  )
    return []
  return latestPeriodReadings(all)
    .filter(
      (boleta) =>
        boleta.tipoVenta !== 'producto' &&
        supplyKey(boleta) === key &&
        isValidDate(boleta.periodo.desde) &&
        isValidDate(boleta.periodo.hasta) &&
        boleta.periodo.hasta < actual.periodo.desde,
    )
    .sort((a, b) => a.periodo.desde.getTime() - b.periodo.desde.getTime())
    .slice(-5)
}
