/**
 * Validación de RUT chileno (algoritmo módulo 11).
 *
 * Acepta formatos: "12.345.678-9", "12345678-9", "12.345.678-K"
 */

export function normalizeRut(rut: string): string {
  return rut.replace(/[\s.]/g, '').toUpperCase()
}

export function formatRut(rut: string): string {
  const clean = normalizeRut(rut).replace(/-/g, '')
  if (clean.length < 2) return rut
  const dv = clean.slice(-1)
  const body = clean.slice(0, -1).replace(/^0+/, '')
  if (!body) return rut
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${withDots}-${dv}`
}

export function validateRut(rut: string): boolean {
  const cleaned = normalizeRut(rut)
  if (!/^\d{1,9}-[\dK]$/.test(cleaned)) return false

  const [body, expected] = cleaned.split('-')
  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = 11 - (sum % 11)
  let computed: string
  if (remainder === 11) computed = '0'
  else if (remainder === 10) computed = 'K'
  else computed = remainder.toString()

  return computed === expected
}
