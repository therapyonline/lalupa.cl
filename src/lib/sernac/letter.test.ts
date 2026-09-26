import { describe, expect, it } from 'vitest'
import { buildHechosTemplate, buildPeticionTemplate, type ReclamoBoletaPayload } from './letter'

const payload: ReclamoBoletaPayload = {
  empresaSlug: 'cge', empresaNombre: 'CGE', servicio: 'electricidad', total: 45000,
  cargosSospechosos: [{ concepto: 'Cargo fijo', monto: 1500, razon: 'Diferencia con la referencia' }],
}

describe('borrador de reclamo', () => {
  it('no inventa contactos previos ni afirma que una alerta es un hecho probado', () => {
    const text = buildHechosTemplate(payload)
    expect(text).not.toMatch(/Solicité aclaración|que no corresponde|recibí boleta/)
    expect(text).toContain('gestiones efectivamente realizadas')
    expect(text).toContain('lectura orientativa')
    expect(text).toContain('[fecha de emisión no detectada]')
  })
  it('pide corregir la diferencia demostrada y no reembolsar el cargo completo', () => {
    const text = buildPeticionTemplate(payload)
    expect(text).toContain('Cargo fijo')
    expect(text).toContain('únicamente la diferencia')
    expect(text).not.toContain('1.500')
  })
  it('deja completar los hechos si no hay cargos o fechas válidas', () => {
    const empty = { ...payload, cargosSospechosos: [], periodoDesde: 'invalid', periodoHasta: 'invalid' }
    expect(buildHechosTemplate(empty)).toContain('[identificar cargo, monto y motivo]')
    expect(buildHechosTemplate(empty)).toContain('período no detectado')
    expect(buildPeticionTemplate(empty)).not.toContain('()')
  })
})
