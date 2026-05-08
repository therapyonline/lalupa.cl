/**
 * Tests específicos para las heurísticas de sospecha de cada parser.
 *
 * Las heurísticas son el core de lalupa — si dejan de marcar un cargo
 * legítimamente sospechoso (false negative) o marcan algo correcto como
 * sospechoso (false positive), la herramienta pierde credibilidad.
 *
 * Para cada heurística probamos AMBOS lados: el caso que debe marcarse y
 * un control que NO debe marcarse.
 */

import { describe, expect, it } from 'vitest'
import { ENEL_REAL_2024_06 } from './__fixtures__/enel-real-2024-06'
import { GASCO_REAL_2024_06 } from './__fixtures__/gasco-real-2024-06'
import { parseCGE } from './electricidad/cge'
import { parseEnel } from './electricidad/enel'
import { parseGasco } from './gas/gasco'
import { parseSaesa } from './electricidad/saesa'

describe('sospecha: Reposición sin contexto de corte', () => {
  it('marca Reposición como sospechosa cuando NO hay mención de corte', () => {
    // Inyectamos un cargo "Reposición" sin contexto de corte/suspensión.
    const text =
      ENEL_REAL_2024_06 +
      `\nReposición de servicio                       $   8.000\n`
    const r = parseEnel(text)
    const reposicion = r.cargos.find((c) => c.concepto === 'Reposición')
    expect(reposicion?.sospechoso).toBe(true)
    expect(reposicion?.razonSospecha).toMatch(/sin que la boleta mencione/i)
  })

  it('NO marca Reposición cuando la boleta menciona corte', () => {
    // El fixture SAESA ya menciona "Corte el 01 Oct 2024 Motivo: No pago".
    // Inyectamos un cargo Reposición — debería NO ser sospechoso por
    // contexto explícito.
    const r = parseSaesa(
      `SOCIEDAD AUSTRAL DE ELECTRICIDAD S.A.\nRUT: 96.544.470-3\ngruposaesa.cl/saesa\n` +
        `Corte el 01 Oct 2024 Motivo: No pago saldo energía.\n` +
        `Reposición de servicio    $ 8.000\n` +
        `IVA 19% $ 1.520\nTotal a pagar $ 9.520\n`,
    )
    const reposicion = r.cargos.find((c) => c.concepto === 'Reposición')
    expect(reposicion?.sospechoso).toBeFalsy()
  })
})

describe('sospecha: Cargo único en BT-1', () => {
  it('marca Cargo único como sospechoso (Enel)', () => {
    const text =
      ENEL_REAL_2024_06 + `\nCargo único especial                $   5.000\n`
    const r = parseEnel(text)
    const cargo = r.cargos.find((c) => c.concepto === 'Cargo único')
    expect(cargo?.sospechoso).toBe(true)
    expect(cargo?.razonSospecha).toMatch(
      /no es un componente est[áa]ndar de la tarifa BT-1/i,
    )
  })

  it('marca Cargo único como sospechoso (SAESA, mismo template)', () => {
    const text =
      `SOCIEDAD AUSTRAL DE ELECTRICIDAD S.A.\nRUT: 96.544.470-3\ngruposaesa.cl/saesa\n` +
      `Cargo único                  $ 12.000\n` +
      `IVA 19% $ 2.280\nTotal a pagar $ 14.280\n`
    const r = parseSaesa(text)
    const cargo = r.cargos.find((c) => c.concepto === 'Cargo único')
    expect(cargo?.sospechoso).toBe(true)
  })
})

describe('sospecha: Recargo de delivery extraordinario (Gasco GLP)', () => {
  it('marca Recargo de delivery como sospechoso (no es cargo estándar)', () => {
    const text =
      GASCO_REAL_2024_06 +
      `\nRecargo de delivery extraordinario     $  3.000\n`
    const r = parseGasco(text)
    const cargo = r.cargos.find((c) => c.concepto === 'Recargo de delivery')
    expect(cargo?.sospechoso).toBe(true)
    expect(cargo?.razonSospecha).toMatch(/extraordinario|delivery/i)
  })

  it('NO marca cilindro estándar como sospechoso', () => {
    const r = parseGasco(GASCO_REAL_2024_06)
    const cilindro = r.cargos.find((c) => c.concepto === 'Cilindro Gas Licuado')
    expect(cilindro?.sospechoso).toBeFalsy()
  })
})

describe('sospecha: Cargo fijo CGE vs valor SEC publicado', () => {
  function makeCgeFixture(cargoFijo: number): string {
    return `COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl
Tarifa: BT1
Período facturado: 01/04/2026 al 30/04/2026
Consumo: 250 kWh

DETALLE DE CARGOS:
Cargo fijo BT1 ............... $ ${cargoFijo}
Cargo por energía ............ $ 45.000
IVA 19% ...................... $ 9.000
Total a pagar ................ $ 56.000
`
  }

  it('NO marca cargo fijo dentro de ±5% del valor SEC ($1.048)', () => {
    const r = parseCGE(makeCgeFixture(1048))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo?.sospechoso).toBeFalsy()
  })

  it('marca como sospechoso cuando cargo fijo difiere 5-20% del SEC', () => {
    // 1300 vs 1048 = +24% — entra en cobro_indebido_probable
    const r = parseCGE(makeCgeFixture(1300))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo?.sospechoso).toBe(true)
    expect(cargoFijo?.razonSospecha).toMatch(/SEC|regulado/i)
  })

  it('marca como cobro_indebido_probable cuando difiere >20%', () => {
    const r = parseCGE(makeCgeFixture(1500))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo?.sospechoso).toBe(true)
    expect(cargoFijo?.razonSospecha).toMatch(/SEC|sobre/i)
  })
})

describe('sospecha: Cargo fijo Aguas Andinas vs valor SISS publicado', () => {
  function makeAaFixture(cargoFijo: number): string {
    return `AGUAS ANDINAS S.A.
RUT: 61.808.000-5
Av. Presidente Balmaceda 1398

Lectura Actual    01/03/2026   1457
Lectura Anterior  01/02/2026   1445
Consumo Facturado            12,00
Su consumo en m3 de este mes (1 m3 = 1.000 litros)

Su consumo en $ de este mes se calcula así
Cargo Fijo                                       ${cargoFijo}
Consumo Agua Potable          12,00 m³ × 592,98  7.116
Servicio de Alcantarillado    12,00 m³ × 759,39  9.113

Monto Total                                     17.144
TOTAL A PAGAR                                   17.144

Datos tributarios: Neto $14.407, IVA $2.737
`
  }

  it('NO marca cargo fijo $914 (valor SISS exacto Aguas Andinas G1)', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaFixture(914))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo?.sospechoso).toBeFalsy()
  })

  it('marca como sospechoso si cargo fijo difiere >5% del SISS', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaFixture(1100))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo?.sospechoso).toBe(true)
    expect(cargoFijo?.razonSospecha).toMatch(/SISS/i)
  })

  it('marca cobro_indebido_probable si difiere >20%', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaFixture(1500))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo?.sospechoso).toBe(true)
    expect(cargoFijo?.razonSospecha).toMatch(/SISS|sobre/i)
  })
})

describe('sospecha: el resultado del fixture base no tiene falsos positivos', () => {
  it('Enel fixture limpio no genera ningún cargo sospechoso', () => {
    const r = parseEnel(ENEL_REAL_2024_06)
    const sospechosos = r.cargos.filter((c) => c.sospechoso)
    expect(sospechosos).toHaveLength(0)
  })

  it('Gasco fixture limpio no genera ningún cargo sospechoso', () => {
    const r = parseGasco(GASCO_REAL_2024_06)
    const sospechosos = r.cargos.filter((c) => c.sospechoso)
    expect(sospechosos).toHaveLength(0)
  })

  it('Aguas Andinas fixture (cargo fijo $914 = SISS) no genera falsos positivos', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const { AGUASANDINAS_REAL_2026_03 } = await import(
      './__fixtures__/aguasandinas-real-2026-03'
    )
    const r = parseAguasAndinas(AGUASANDINAS_REAL_2026_03)
    const sospechosos = r.cargos.filter((c) => c.sospechoso)
    expect(sospechosos).toHaveLength(0)
  })
})

describe('sospecha: Consumo agua potable (m³ × tarifa SISS)', () => {
  function makeAaConsumoFixture(consumoCLP: number): string {
    return `AGUAS ANDINAS S.A.
RUT: 61.808.000-5
Av. Presidente Balmaceda 1398

Lectura Actual    01/03/2026   1457
Lectura Anterior  01/02/2026   1445
Consumo Facturado            12,00

Su consumo en $ de este mes se calcula así
Cargo Fijo                                       914
Consumo Agua Potable          12,00 m³ × X       ${consumoCLP}
Servicio de Alcantarillado    12,00 m³ × 759,39  9.113

TOTAL A PAGAR                                   17.144

Datos tributarios: Neto $14.407, IVA $2.737
`
  }

  it('NO marca consumo $7.116 (12 m³ × $592,98 SISS = $7.115,76 ≈ esperado)', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaConsumoFixture(7116))
    const consumo = r.cargos.find((c) => c.concepto === 'Consumo agua potable')
    expect(consumo?.sospechoso).toBeFalsy()
  })

  it('marca como cobro_indebido_probable si consumo es muy superior al esperado', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    // 12 m³ × 592,98 = 7.116. Inflamos a 12.000 = +68% sobre esperado
    const r = parseAguasAndinas(makeAaConsumoFixture(12000))
    const consumo = r.cargos.find((c) => c.concepto === 'Consumo agua potable')
    expect(consumo?.sospechoso).toBe(true)
    expect(consumo?.razonSospecha).toMatch(/sobre.*esperado|SERNAC/i)
  })
})

describe('sospecha: Alcantarillado (m³ × tarifa SISS)', () => {
  function makeAaAlcFixture(alcCLP: number): string {
    return `AGUAS ANDINAS S.A.
RUT: 61.808.000-5
Av. Presidente Balmaceda 1398

Lectura Actual    01/03/2026   1457
Lectura Anterior  01/02/2026   1445
Consumo Facturado            12,00

Su consumo en $ de este mes se calcula así
Cargo Fijo                                       914
Consumo Agua Potable          12,00 m³ × 592,98  7.116
Servicio de Alcantarillado    12,00 m³ × X       ${alcCLP}

TOTAL A PAGAR                                   17.144

Datos tributarios: Neto $14.407, IVA $2.737
`
  }

  it('NO marca alcantarillado $9.113 (12 m³ × $759,39 SISS = $9.112,68 ≈ esperado)', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaAlcFixture(9113))
    const alc = r.cargos.find((c) => c.concepto === 'Servicio de alcantarillado')
    expect(alc?.sospechoso).toBeFalsy()
  })

  it('marca cobro_indebido_probable si alcantarillado supera 20% del esperado', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    // 12 m³ × 759,39 = 9.113. Inflamos a 14.000 = +54% sobre esperado.
    const r = parseAguasAndinas(makeAaAlcFixture(14000))
    const alc = r.cargos.find((c) => c.concepto === 'Servicio de alcantarillado')
    expect(alc?.sospechoso).toBe(true)
    expect(alc?.razonSospecha).toMatch(/SERNAC|sobre.*esperado/i)
  })
})
