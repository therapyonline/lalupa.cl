/**
 * Tests específicos para las heurísticas de sospecha de cada parser.
 *
 * Las heurísticas son el core de lalupa, si dejan de marcar un cargo
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
    // Inyectamos un cargo Reposición, debería NO ser sospechoso por
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

describe('regresión: CGE no aplica una tarifa histórica sin contexto', () => {
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

  it('extrae el cargo fijo sin certificar la tarifa', () => {
    const r = parseCGE(makeCgeFixture(1048))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo).toBeDefined()
    expect(cargoFijo?.sospechoso).toBeFalsy()
  })

  it('no compara abril con una referencia de mayo de 2026', () => {
    // Regresión: antes se comparaba abril con una referencia de mayo.
    const r = parseCGE(makeCgeFixture(1300))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo).toBeDefined()
    expect(cargoFijo?.sospechoso).toBeFalsy()
    expect(cargoFijo?.razonSospecha).toBeUndefined()
  })

  it('no infiere sobrecobro aunque el cargo supere la referencia histórica', () => {
    const r = parseCGE(makeCgeFixture(1500))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo).toBeDefined()
    expect(cargoFijo?.sospechoso).toBeFalsy()
    expect(cargoFijo?.razonSospecha).toBeUndefined()
  })
})

describe('regresión: Aguas Andinas no implica grupo tarifario 1', () => {
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

  it('extrae el cargo fijo sin asignar grupo tarifario', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaFixture(914))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo).toBeDefined()
    expect(cargoFijo?.sospechoso).toBeFalsy()
  })

  it('no aplica el importe de grupo 1 sin acreditar el grupo', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaFixture(1100))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo).toBeDefined()
    expect(cargoFijo?.sospechoso).toBeFalsy()
    expect(cargoFijo?.razonSospecha).toBeUndefined()
  })

  it('no supone impuestos o vigencia al evaluar un cargo fijo', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaFixture(1500))
    const cargoFijo = r.cargos.find((c) => c.concepto === 'Cargo fijo')
    expect(cargoFijo).toBeDefined()
    expect(cargoFijo?.sospechoso).toBeFalsy()
    expect(cargoFijo?.razonSospecha).toBeUndefined()
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

  it('Aguas Andinas fixture sin conceptos de alerta no genera falsos positivos', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const { AGUASANDINAS_REAL_2026_03 } = await import(
      './__fixtures__/aguasandinas-real-2026-03'
    )
    const r = parseAguasAndinas(AGUASANDINAS_REAL_2026_03)
    const sospechosos = r.cargos.filter((c) => c.sospechoso)
    expect(sospechosos).toHaveLength(0)
  })
})

describe('regresión: consumo de agua con grupo y temporada sin confirmar', () => {
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

  it('extrae consumo sin certificar el precio por m³', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaConsumoFixture(7116))
    const consumo = r.cargos.find((c) => c.concepto === 'Consumo agua potable')
    expect(consumo).toBeDefined()
    expect(consumo?.sospechoso).toBeFalsy()
  })

  it('no compara febrero con un precio no punta de marzo', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    // El monto distinto no acredita grupo, temporada, impuestos ni fecha.
    const r = parseAguasAndinas(makeAaConsumoFixture(12000))
    const consumo = r.cargos.find((c) => c.concepto === 'Consumo agua potable')
    expect(consumo).toBeDefined()
    expect(consumo?.sospechoso).toBeFalsy()
    expect(consumo?.razonSospecha).toBeUndefined()
  })
})

describe('regresión: alcantarillado sin referencia aplicable', () => {
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

  it('extrae alcantarillado sin certificar el precio por m³', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    const r = parseAguasAndinas(makeAaAlcFixture(9113))
    const alc = r.cargos.find((c) => c.concepto === 'Servicio de alcantarillado')
    expect(alc).toBeDefined()
    expect(alc?.sospechoso).toBeFalsy()
  })

  it('no compara alcantarillado sin grupo ni impuestos confirmados', async () => {
    const { parseAguasAndinas } = await import('./agua/aguasandinas')
    // El importe alto por sí solo no acredita un sobrecobro.
    const r = parseAguasAndinas(makeAaAlcFixture(14000))
    const alc = r.cargos.find((c) => c.concepto === 'Servicio de alcantarillado')
    expect(alc).toBeDefined()
    expect(alc?.sospechoso).toBeFalsy()
    expect(alc?.razonSospecha).toBeUndefined()
  })
})
