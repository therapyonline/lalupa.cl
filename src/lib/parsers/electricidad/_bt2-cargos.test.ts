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

  it('detecta sufijo "PRESENTE EN PUNTA" en BT-3', () => {
    const r = clasificarTarifa('BT 3 PRESENTE EN PUNTA')
    expect(r.tipo).toBe('BT-3')
    expect(r.presenteEnPunta).toBe(true)
    expect(r.presenteEnPuntaSubtipo).toBeUndefined()
    expect(r.nota).toMatch(/presente en punta/i)
  })

  it('detecta sufijo "PARCIALMENTE PRESENTE EN PUNTA" como subtipo PARCIAL', () => {
    const r = clasificarTarifa('BT 3 PARCIALMENTE PRESENTE EN PUNTA')
    expect(r.tipo).toBe('BT-3')
    expect(r.presenteEnPunta).toBe(true)
    expect(r.presenteEnPuntaSubtipo).toBe('PARCIAL')
    expect(r.nota).toMatch(/parcialmente presente en punta/i)
  })

  it('detecta AT 3 PRESENTE EN PUNTA', () => {
    const r = clasificarTarifa('AT 3 PRESENTE EN PUNTA')
    expect(r.tipo).toBe('AT')
    expect(r.presenteEnPunta).toBe(true)
  })

  it('detecta AT 2 PRESENTE EN PUNTA', () => {
    const r = clasificarTarifa('AT 2 PRESENTE EN PUNTA')
    expect(r.tipo).toBe('AT')
    expect(r.presenteEnPunta).toBe(true)
  })

  it('detecta AT 4.3 sin PEP', () => {
    const r = clasificarTarifa('AT 4.3')
    expect(r.tipo).toBe('AT')
    expect(r.presenteEnPunta).toBe(false)
  })

  it('tarifa BT-1 sin PEP no menciona punta en nota', () => {
    const r = clasificarTarifa('BT-1')
    expect(r.presenteEnPunta).toBe(false)
    expect(r.nota).not.toMatch(/presente en punta/i)
  })
})

// Fixture sintética: boleta CGE AT-4.3 industrial (hospital naval)
// con todos los cargos canónicos vistos en muestras reales 2018.
const CGE_AT43_FIXTURE = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl

Hospital Naval Almirante Adriazola, Talcahuano
N° Cliente: 99887766-K
Tipo de tarifa contratada: AT 4.3
Período facturado: 01/01/2018 al 31/01/2018
Fecha de emisión: 05/02/2018
Fecha de vencimiento: 20/02/2018

Consumo: 149.781 kWh
Potencia leída: 324 kW
Factor potencia: 0,895

DETALLE DE LA CUENTA / FACTURACION:
Administracion del Servicio                                  $    1.362
Coordinacion y Transporte de Electricidad                  $   394.973
Electricidad Consumida (149.781 kWh)                    $ 11.132.023
Cargo por Demanda Maxima de Potencia Suministrada          $   775.007
Cargo Demanda Maxima Leida de Potencia en horas punta    $ 1.440.328
Multa por Consumo Reactivo (10 %)                          $   533.894
Arriendo de Medidor                                          $    3.492
Arriendo Otros Equipos                                       $   65.453

Total a pagar                                              $ 17.072.400
`

describe('CGE AT-4.3 industrial (hospital)', () => {
  it('extrae arriendo de medidor y otros equipos', () => {
    const r = parseCGE(CGE_AT43_FIXTURE)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Arriendo de Medidor')
    expect(conceptos).toContain('Arriendo Otros Equipos')
  })

  it('extrae multa por consumo reactivo con porcentaje variable', () => {
    const r = parseCGE(CGE_AT43_FIXTURE)
    const multa = r.cargos.find((c) => c.concepto === 'Multa por Consumo Reactivo')
    expect(multa).toBeDefined()
    expect(multa?.monto).toBe(533894)
  })

  it('extrae demanda máxima leída en hora punta sin colisionar con otras demandas', () => {
    const r = parseCGE(CGE_AT43_FIXTURE)
    const punta = r.cargos.find(
      (c) =>
        c.concepto ===
        'Cargo por demanda máxima de potencia leída en horas de punta',
    )
    expect(punta).toBeDefined()
    expect(punta?.monto).toBe(1440328)
  })

  it('total a pagar es 17.072.400 sin confusión con cargos individuales', () => {
    const r = parseCGE(CGE_AT43_FIXTURE)
    expect(r.totales.total).toBe(17072400)
  })
})

// Fixture CGE BT-3 PEP basado en Hospital Hernán Henríquez Aravena
// Temuco enero 2018, base SAMU.
const CGE_BT3_PEP_FIXTURE = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl

Hospital Hernán Henríquez Aravena, Temuco
N° Cliente: 11223344-5
Tipo de tarifa contratada: BT 3 PRESENTE EN PUNTA

DETALLE DE LA CUENTA / FACTURACION:
Administracion del Servicio                                  $    1.334
Transporte de Electricidad                                   $    4.235
Electricidad Consumida (1.751 kWh)                         $  139.042
Cargo por Potencia Presente en Punta (23,335 kW)           $  318.326
Multa por Consumo Reactivo (16 %)                           $   73.179
Otros Cargos                                                 $      -78
Ajuste para Facilitar el Pago en Efectivo, Mes Anterior      $       13
Ajuste para Facilitar el Pago en Efectivo, Mes Actual        $       -1

Total a pagar                                              $ 637.900
`

describe('CGE BT-3 PRESENTE EN PUNTA (hospital SAMU)', () => {
  it('extrae "Cargo por Potencia Presente en Punta"', () => {
    const r = parseCGE(CGE_BT3_PEP_FIXTURE)
    const pep = r.cargos.find(
      (c) => c.concepto === 'Cargo por Potencia Presente en Punta',
    )
    expect(pep).toBeDefined()
    expect(pep?.monto).toBe(318326)
  })

  it('extrae ajuste mes anterior y mes actual como dos cargos distintos', () => {
    const r = parseCGE(CGE_BT3_PEP_FIXTURE)
    const ant = r.cargos.find(
      (c) =>
        c.concepto === 'Ajuste para Facilitar el Pago en Efectivo, Mes Anterior',
    )
    const act = r.cargos.find(
      (c) => c.concepto === 'Ajuste para Facilitar el Pago en Efectivo, Mes Actual',
    )
    expect(ant?.monto).toBe(13)
    expect(act?.monto).toBe(-1)
  })

  it('extrae Otros Cargos con signo negativo', () => {
    const r = parseCGE(CGE_BT3_PEP_FIXTURE)
    const otros = r.cargos.find((c) => c.concepto === 'Otros Cargos')
    expect(otros).toBeDefined()
    expect(otros?.monto).toBeLessThan(0)
  })
})

// Fixture CGE AT-3 PEP con 3 líneas de saldo anterior independientes.
const CGE_AT3_PEP_FIXTURE = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl

Tipo de tarifa contratada: AT 3 PRESENTE EN PUNTA
N° Cliente: 55667788-9

Administracion del Servicio                                  $    1.333
Transporte de Electricidad                                 $ 1.632.659
Electricidad Consumida (619.135,2 kWh)                  $ 46.015.366
Cargo por Potencia Presente en Punta (1.320,6 kW)        $ 10.118.173
Multa por Consumo Reactivo (4 %)                           $ 2.245.342
Arriendo de Medidor                                          $    3.514
Pago de la Cuenta Fuera de Plazo                             $      161
Arriendo Otros Equipos                                       $   21.674
Otros Cargos                                                 $        5
Saldo Anterior Vencido                                    $ 77.321.000
Saldo Anterior Servicio Electrico                         $ 75.923.401
Otro Saldo Anterior                                        $ 4.397.599

Total a pagar                                            $ 149.513.000
`

describe('CGE AT-3 PEP con 3 saldos anteriores (hospital regional)', () => {
  it('extrae las 3 líneas de saldo anterior como cargos independientes', () => {
    const r = parseCGE(CGE_AT3_PEP_FIXTURE)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Saldo Anterior Vencido')
    expect(conceptos).toContain('Saldo Anterior Servicio Eléctrico')
    expect(conceptos).toContain('Otro Saldo Anterior')
  })

  it('saldos anteriores tienen montos distintos (no dedup ni colisión)', () => {
    const r = parseCGE(CGE_AT3_PEP_FIXTURE)
    const venc = r.cargos.find((c) => c.concepto === 'Saldo Anterior Vencido')
    const serv = r.cargos.find(
      (c) => c.concepto === 'Saldo Anterior Servicio Eléctrico',
    )
    const otro = r.cargos.find((c) => c.concepto === 'Otro Saldo Anterior')
    expect(venc?.monto).toBe(77321000)
    expect(serv?.monto).toBe(75923401)
    expect(otro?.monto).toBe(4397599)
  })

  it('extrae "Pago de la Cuenta Fuera de Plazo" como cargo de mora', () => {
    const r = parseCGE(CGE_AT3_PEP_FIXTURE)
    const mora = r.cargos.find(
      (c) => c.concepto === 'Pago de la Cuenta Fuera de Plazo',
    )
    expect(mora).toBeDefined()
    expect(mora?.monto).toBe(161)
  })
})
