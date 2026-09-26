import { isValidDate } from '@/lib/dates'
import type { ParsedBoleta } from './types'

/** Señales de lectura incompleta, no una certificación de exactitud. */
export function getExtractionIssues(boleta: ParsedBoleta): string[] {
  const issues: string[] = []
  const producto = boleta.servicio === 'gas' && boleta.tipoVenta === 'producto'
  if (!producto && (
    !isValidDate(boleta.periodo.desde) || !isValidDate(boleta.periodo.hasta) ||
    boleta.periodo.desde > boleta.periodo.hasta
  )) issues.push('el período facturado')
  if (!boleta.cargos.length || boleta.cargos.some((c) => !Number.isFinite(c.monto))) {
    issues.push('el detalle de cargos')
  }
  // El modelo actual usa 0 también cuando no encuentra consumo: requiere revisión.
  if (!producto && (!Number.isFinite(boleta.consumo?.valor) || boleta.consumo.valor <= 0)) {
    issues.push('el consumo del período (puede ser cero o no haberse leído)')
  }
  if (!Number.isFinite(boleta.totales.total)) issues.push('el total')
  return issues
}
