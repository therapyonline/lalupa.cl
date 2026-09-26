/**
 * Aritmética de simulaciones históricas. No acredita aplicabilidad regulatoria.
 */

import { describe, expect, it } from 'vitest'
import { validarCobro, calcularBoletaEsperadaAgua, getPrecioCilindroGas, calcularBoletaEsperadaElectricidad, TARIFAS_BT1_2026, TARIFAS_AGUA_2026 } from './tarifas'

describe('validarCobro', () => {
  it('marca OK cuando la desviación es <= ±5%', () => {
    const r = validarCobro(105, 100)
    expect(r.alerta).toBe('ok')
    expect(r.estaDentroDelRango).toBe(true)
    expect(r.desviacionPct).toBe(5)
  })

  it('marca OK en el borde exacto del 5%', () => {
    const r = validarCobro(95, 100)
    expect(r.alerta).toBe('ok')
  })

  it('marca sospechoso cuando la desviación es entre 5% y 20%', () => {
    const r = validarCobro(115, 100)
    expect(r.alerta).toBe('sospechoso')
    expect(r.estaDentroDelRango).toBe(false)
    expect(r.desviacionPct).toBe(15)
  })

  it('distingue diferencias a favor sin inferir sobrecobros', () => {
    const r = validarCobro(85, 100)
    expect(r.alerta).toBe('diferencia_a_favor')
    expect(r.desviacionPct).toBe(-15)
    expect(r.mensaje).toMatch(/bajo la referencia/i)
  })

  it('marca diferencia_alta cuando supera 20%', () => {
    const r = validarCobro(150, 100)
    expect(r.alerta).toBe('diferencia_alta')
    expect(r.estaDentroDelRango).toBe(false)
    expect(r.mensaje).toMatch(/Confirma período/)
  })

  it('no infiere una alerta cuando falta referencia', () => {
    const r = validarCobro(100, 0)
    expect(r.alerta).toBe('sin_referencia')
    expect(r.mensaje).toMatch(/no hay valor esperado/i)
  })

  it('respeta tolerancia personalizada', () => {
    // Con 10% de tolerancia, 108 debería estar OK
    const r = validarCobro(108, 100, 10)
    expect(r.alerta).toBe('ok')
  })

  it('expresa la desviación como porcentaje firmado', () => {
    expect(validarCobro(110, 100).desviacionPct).toBe(10)
    expect(validarCobro(90, 100).desviacionPct).toBe(-10)
  })
})

describe('calcularBoletaEsperadaAgua', () => {
  it('retorna null si la sanitaria no está en la tabla', () => {
    expect(calcularBoletaEsperadaAgua('no-existe', 12)).toBeNull()
  })

  it('retorna null si el grupo no tiene tarifa completa', () => {
    expect(calcularBoletaEsperadaAgua('aguas_andinas_g2', 12)).toBeNull()
  })

  it('no recorta el consumo por un límite de punta fuera de ese período', () => {
    const r = calcularBoletaEsperadaAgua('aguas_andinas_g1', 50, 40, false)
    expect(r).toEqual({ cargoFijo: 914, agua: 29649, alcantarillado: 37970,
      sobreconsumo: 0, total: 68533, precioPromedioM3: 1371 })
  })

  it('no duplica consumo en punta cuando falta el límite', () => {
    const r = calcularBoletaEsperadaAgua('aguas_andinas_g1', 12, 0, true)
    expect(r?.agua).toBe(7116)
    expect(r?.sobreconsumo).toBe(0)
  })

  it('separa volumen normal y exceso con límite de punta conocido', () => {
    const r = calcularBoletaEsperadaAgua('aguas_andinas_g1', 50, 40, true)
    expect(r?.agua).toBe(23721)
    expect(r?.sobreconsumo).toBe(17017)
  })

})

describe('getPrecioCilindroGas', () => {
  it('retorna null para combinación formato/región sin datos', () => {
    expect(getPrecioCilindroGas('15kg', 'NO_EXISTE_REGION')).toBeNull()
  })

  it('si retorna datos, promedio entre rangoMin y rangoMax', () => {
    const r = getPrecioCilindroGas('15kg', 'RM')
    if (r) {
      expect(r.rangoMin).toBeLessThanOrEqual(r.promedioCLP)
      expect(r.promedioCLP).toBeLessThanOrEqual(r.rangoMax)
    }
  })
})

it.each([NaN, Infinity, -Infinity])('no clasifica datos no finitos: %s', (value) => {
  expect(validarCobro(value, 100).alerta).toBe('sin_referencia')
  expect(validarCobro(100, value).alerta).toBe('sin_referencia')
})
it('un descuento de 50% no propone reclamar un sobrecobro', () => {
  expect(validarCobro(50, 100).alerta).toBe('diferencia_a_favor')
})


describe('simulaciones históricas: datos incompletos o inválidos', () => {
  it.each([NaN, Infinity, -Infinity, -1])('rechaza consumo inválido: %s', (value) => {
    expect(calcularBoletaEsperadaElectricidad('cge_rm_stxd3', value)).toBeNull()
    expect(calcularBoletaEsperadaAgua('aguas_andinas_g1', value)).toBeNull()
    expect(calcularBoletaEsperadaAgua('aguas_andinas_g1', 12, value, true)).toBeNull()
  })

  it('permite consumo cero sin inventar consumo variable', () => {
    expect(calcularBoletaEsperadaElectricidad('cge_rm_stxd3', 0)?.total).toBe(1048)
    expect(calcularBoletaEsperadaAgua('aguas_andinas_g1', 0)?.total).toBe(914)
  })

  it.each(['inexistente', 'chilquinta_urbano', 'saesa_default', 'frontel_default'])(
    'no calcula electricidad con referencia incompleta: %s', (zone) => {
      expect(calcularBoletaEsperadaElectricidad(zone, 250)).toBeNull()
    },
  )

  it('no convierte un componente ausente o corrupto a cero', () => {
    const electric = TARIFAS_BT1_2026.cge_rm_stxd3
    const water = TARIFAS_AGUA_2026.aguas_andinas_g1
    const originalElectric = { ...electric }
    const originalWater = { ...water }
    try {
      electric.cargoServicioPublicoCLPKWh = null
      water.alcantarilladoCLPM3 = null
      expect(calcularBoletaEsperadaElectricidad('cge_rm_stxd3', 250)).toBeNull()
      expect(calcularBoletaEsperadaAgua('aguas_andinas_g1', 12)).toBeNull()
      Object.assign(electric, originalElectric, { cargoFijoCLP: NaN })
      Object.assign(water, originalWater, { aguaPotableNoPuntaCLPM3: Infinity })
      expect(calcularBoletaEsperadaElectricidad('cge_rm_stxd3', 250)).toBeNull()
      expect(calcularBoletaEsperadaAgua('aguas_andinas_g1', 12)).toBeNull()
    } finally {
      Object.assign(electric, originalElectric)
      Object.assign(water, originalWater)
    }
  })
})
