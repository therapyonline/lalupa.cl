/**
 * Helpers de fechas defensivos. La motivación es que muchos parsers
 * devuelven `new Date(NaN)` como fallback cuando no pueden extraer una
 * fecha, y eso explota más tarde en `toISOString()` con
 * `RangeError: Invalid time value`. Estos wrappers traducen Invalid
 * Dates a `undefined` o a strings vacíos según corresponda.
 */

export function isValidDate(d: Date | null | undefined): d is Date {
  if (!d) return false
  if (!(d instanceof Date)) return false
  return !Number.isNaN(d.getTime())
}

/**
 * Devuelve `date.toISOString()` o `undefined` si la fecha es inválida.
 * Usar en serialización para storage / payloads donde queremos omitir
 * fechas no detectadas en vez de crashear.
 */
export function safeISOString(d: Date | null | undefined): string | undefined {
  return isValidDate(d) ? d.toISOString() : undefined
}
