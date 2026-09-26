import type { ParsedBoleta } from '@/lib/parsers/types'
import { isValidDate } from '@/lib/dates'

export function supplyKey(boleta: ParsedBoleta): string | null {
  const cliente = boleta.cliente.numeroCliente
    ?.trim()
    .replace(/\s+/g, '')
    .toUpperCase()
  const direccion = boleta.cliente.direccion
    ?.trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
  if (!cliente && !direccion) return null
  return JSON.stringify([
    boleta.servicio,
    boleta.empresa,
    cliente || null,
    direccion || null,
  ])
}

const date = (value?: Date) =>
  isValidDate(value) ? value!.toISOString() : null

/** Huella del contenido leído. Conserva variantes ambiguas; nunca usa el ID del archivo importado. */
export async function boletaIdentity(boleta: ParsedBoleta): Promise<string> {
  const content = JSON.stringify([
    boleta.servicio,
    boleta.empresa,
    boleta.tipoVenta ?? 'consumo',
    boleta.cliente.numeroCliente ?? '',
    boleta.cliente.direccion ?? '',
    boleta.cliente.nombre ?? '',
    date(boleta.periodo.desde),
    date(boleta.periodo.hasta),
    date(boleta.fechaEmision),
    date(boleta.fechaVencimiento),
    boleta.consumo.unidad,
    boleta.consumo.valor,
    boleta.consumo.tarifa ?? '',
    boleta.cargos.map((c) => [c.concepto, c.monto, c.detalle ?? '']),
    boleta.totales.subtotal,
    boleta.totales.iva,
    boleta.totales.total,
    boleta.raw.replace(/\r\n/g, '\n').trim(),
  ])
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(content),
  )
  return `v2-${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}
