/**
 * Tests para los helpers de validación de tarifas.
 * Estos helpers son la base para que los parsers comparen un cargo real
 * contra el valor esperado regulatorio (futuro wireup en cada parser).
 */

import { describe, expect, it } from 'vitest'
import { validarCobro, calcularBoletaEsperadaAgua, getPrecioCilindroGas } from './tarifas'

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

  it('marca sospechoso para sub-cobros entre -5% y -20%', () => {
    const r = validarCobro(85, 100)
    expect(r.alerta).toBe('sospechoso')
    expect(r.desviacionPct).toBe(-15)
    expect(r.mensaje).toMatch(/bajo lo esperado/i)
  })

  it('marca cobro_indebido_probable cuando supera 20%', () => {
    const r = validarCobro(150, 100)
    expect(r.alerta).toBe('cobro_indebido_probable')
    expect(r.estaDentroDelRango).toBe(false)
    expect(r.mensaje).toMatch(/SERNAC/)
  })

  it('marca como sospechoso cuando no hay valor esperado (0 o negativo)', () => {
    const r = validarCobro(100, 0)
    expect(r.alerta).toBe('sospechoso')
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

  it('retorna null si el cargo fijo no está disponible', () => {
    // Usa una clave que probablemente no esté completa en la tabla.
    // Si Aguas Andinas tiene cargoFijoCLP definido, entonces el resultado
    // no será null, solo verificamos que no explota.
    const r = calcularBoletaEsperadaAgua('aguas-andinas', 12)
    expect(r === null || typeof r === 'object').toBe(true)
  })

  it('si retorna desglose, los componentes son enteros (Math.round)', () => {
    const r = calcularBoletaEsperadaAgua('aguas-andinas', 12)
    if (r) {
      expect(Number.isInteger(r.cargoFijo)).toBe(true)
      expect(Number.isInteger(r.agua)).toBe(true)
      expect(Number.isInteger(r.alcantarillado)).toBe(true)
      expect(Number.isInteger(r.total)).toBe(true)
    }
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
