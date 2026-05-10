/**
 * Tests para los cargos BT-2/BT-3 canónicos del catálogo SEC.
 *
 * Estos cargos NO aparecen en BT-1 residencial pero sí en hogares con
 * potencia contratada, comercio mediano e industriales. Verificamos que
 * los patterns matchean correctamente sobre líneas representativas.
 */

import { describe, expect, it } from 'vitest'
import { parseCGE } from './cge'
import { clasificarTarifa } from './_clasificar-tarifa'

// Fixture sintética: boleta CGE BT-2 con potencia contratada (hogar
// con calefacción eléctrica). Incluye todos los cargos del catálogo
// SEC que sólo aplican a BT-2/BT-3.
const CGE_BT2_FIXTURE = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl

N° Cliente: 12345678-9
Tarifa: BT-2
Período facturado: 15/04/2026 al 15/05/2026
Fecha de emisión: 16/05/2026
Fecha de vencimiento: 30/05/2026

Consumo: 850 kWh
Potencia contratada: 12 kW
Potencia leída: 11,4 kW

DETALLE DE CARGOS:
Cargo fijo BT-2 .............................. $ 1.048
Cargo por energía ............................ $ 132.450
Cargo por uso del sistema de transmisión ..... $ 12.470
Cargo por servicio público ................... $ 720
Cargo por servicio público FET ............... $ 230
Cargo por compras de potencia ................ $ 4.498
Cargo por potencia base ...................... $ 42.244
Cargo por demanda máxima de potencia contratada o suministrada $ 28.500
Cargo por potencia adicional de invierno ..... $ 8.750

Subtotal ..................................... $ 232.910
IVA 19% ...................................... $ 44.253
Total a pagar ................................ $ 277.163
`

describe('CGE BT-2 (hogar con potencia contratada)', () => {
  it('extrae los cargos básicos BT-1 estándar', () => {
    const r = parseCGE(CGE_BT2_FIXTURE)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cargo fijo')
    expect(conceptos).toContain('Cargo por energía')
    expect(conceptos).toContain('Cargo por uso del sistema de transmisión')
  })

  it('extrae cargo por demanda máxima de potencia contratada o suministrada', () => {
    const r = parseCGE(CGE_BT2_FIXTURE)
    const demanda = r.cargos.find(
      (c) =>
        c.concepto ===
        'Cargo por demanda máxima de potencia contratada o suministrada',
    )
    expect(demanda).toBeDefined()
    expect(demanda?.monto).toBe(28500)
  })

  it('extrae cargo por potencia adicional de invierno', () => {
    const r = parseCGE(CGE_BT2_FIXTURE)
    const invierno = r.cargos.find(
      (c) => c.concepto === 'Cargo por potencia adicional de invierno',
    )
    expect(invierno).toBeDefined()
    expect(invierno?.monto).toBe(8750)
  })

  it('extrae cargo por servicio público FET separadamente del estándar', () => {
    const r = parseCGE(CGE_BT2_FIXTURE)
    const fet = r.cargos.find(
      (c) => c.concepto === 'Cargo por servicio público FET',
    )
    expect(fet).toBeDefined()
    expect(fet?.monto).toBe(230)
  })

  it('mantiene el cargo por servicio público (sin FET) como separado', () => {
    const r = parseCGE(CGE_BT2_FIXTURE)
    const servicio = r.cargos.find(
      (c) => c.concepto === 'Cargo por servicio público',
    )
    expect(servicio).toBeDefined()
    expect(servicio?.monto).toBe(720)
  })

  it('extrae el total $277.163 sin confundirse con cargos individuales', () => {
    const r = parseCGE(CGE_BT2_FIXTURE)
    expect(r.totales.total).toBe(277163)
  })
})

describe('clasificarTarifa', () => {
  it('clasifica BT-1 como residencial sin potencia', () => {
    const r = clasificarTarifa('BT-1')
    expect(r.tipo).toBe('BT-1')
    expect(r.esResidencial).toBe(true)
    expect(r.conPotenciaContratada).toBe(false)
  })

  it('clasifica BT1 (sin guión) igual que BT-1', () => {
    const r = clasificarTarifa('BT1')
    expect(r.tipo).toBe('BT-1')
  })

  it('clasifica BT-1A como BT-1', () => {
    expect(clasificarTarifa('BT-1A').tipo).toBe('BT-1')
  })

  it('clasifica BT-2 como residencial con potencia contratada', () => {
    const r = clasificarTarifa('BT-2')
    expect(r.tipo).toBe('BT-2')
    expect(r.esResidencial).toBe(true)
    expect(r.conPotenciaContratada).toBe(true)
    expect(r.nota).toMatch(/potencia contratada/i)
  })

  it('clasifica TRBT-2 (Tarifa Regulada) igual que BT-2', () => {
    expect(clasificarTarifa('TRBT-2').tipo).toBe('BT-2')
  })

  it('clasifica BT-3 como comercial con horario punta', () => {
    expect(clasificarTarifa('BT-3').tipo).toBe('BT-3')
  })

  it('clasifica BT-4 como industrial liviano', () => {
    expect(clasificarTarifa('BT-4').tipo).toBe('BT-industrial')
  })

  it('clasifica AT-2 como alta tensión', () => {
    expect(clasificarTarifa('AT-2').tipo).toBe('AT')
  })

  it('devuelve "desconocida" si el código no calza con el catálogo', () => {
    const r = clasificarTarifa('XYZ-99')
    expect(r.tipo).toBe('desconocida')
    expect(r.esResidencial).toBe(false)
  })

  it('devuelve "desconocida" para undefined', () => {
    expect(clasificarTarifa(undefined).tipo).toBe('desconocida')
  })
})
