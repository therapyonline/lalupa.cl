/**
 * Tests para helpers OCR-tolerantes.
 *
 * Cubre los casos que un OCR Tesseract puede mangled:
 *   - "AUT:" en lugar de "RUT:"
 *   - Em-dashes entre label y valor
 *   - Período sin label estándar
 *   - Cliente sin tag claro
 */

import { describe, expect, it } from 'vitest'
import {
  extractFechaEmision,
  extractFechaVencimiento,
  extractIVA,
  extractNumeroCliente,
  extractPeriodo,
  extractTotal,
  normalizeOcrText,
} from './_helpers'
import { isValidDate } from '@/lib/dates'

describe('normalizeOcrText', () => {
  it('reemplaza "AUT:" por "RUT:" cuando OCR confunde A con R', () => {
    expect(normalizeOcrText('AUT: 96.813.520-1')).toBe('RUT: 96.813.520-1')
  })

  it('reemplaza al inicio de línea', () => {
    expect(normalizeOcrText('foo\nAUT: 1234')).toBe('foo\nRUT: 1234')
  })

  it('NO reemplaza palabras que contienen "aut"', () => {
    // "Autoridad", "automático" no deberían tocarse.
    const text = 'Autoridad de control / automático.'
    expect(normalizeOcrText(text)).toBe(text)
  })

  it('es idempotente', () => {
    const once = normalizeOcrText('AUT: 1234')
    const twice = normalizeOcrText(once)
    expect(twice).toBe(once)
  })
})

describe('extractPeriodo (OCR-tolerante)', () => {
  it('extrae con label estándar "Período facturado"', () => {
    const r = extractPeriodo(
      'Período facturado: 15/04/2026 al 15/05/2026',
    )
    expect(isValidDate(r.desde)).toBe(true)
    expect(isValidDate(r.hasta)).toBe(true)
  })

  it('extrae con label mangled "Monto del RA" via fallback genérico', () => {
    const r = extractPeriodo(
      '¿Cuánto debo? Monto del RA 27 may 2023-29 jun 2023',
    )
    expect(isValidDate(r.desde)).toBe(true)
    expect(isValidDate(r.hasta)).toBe(true)
    expect(r.desde.getDate()).toBe(27)
    expect(r.desde.getMonth()).toBe(4) // mayo (0-indexed)
    expect(r.hasta.getDate()).toBe(29)
    expect(r.hasta.getMonth()).toBe(5) // junio
  })

  it('rechaza pares de fechas separados >90 días (no son período mensual)', () => {
    // El año 2021 vs 2024 da diferencia >90 días, no es período típico
    const r = extractPeriodo(
      'Último pago: 30 jun 2021 vs 12 dic 2024 referencias.',
    )
    expect(isValidDate(r.desde)).toBe(false)
  })

  it('devuelve fechas inválidas si no encuentra ningún rango', () => {
    const r = extractPeriodo('Texto sin fechas relevantes.')
    expect(isValidDate(r.desde)).toBe(false)
    expect(isValidDate(r.hasta)).toBe(false)
  })
})

describe('extractFechaVencimiento (OCR-tolerante)', () => {
  it('extrae con dos puntos estándar', () => {
    const d = extractFechaVencimiento('Fecha de vencimiento: 30/05/2026')
    expect(d).toBeDefined()
  })

  it('extrae con em-dashes entre label y valor', () => {
    const d = extractFechaVencimiento('Fecha de vencimiento —— 27 jul 2023')
    expect(d).toBeDefined()
    expect(d?.getDate()).toBe(27)
  })

  it('extrae con "Vence" o "Vto."', () => {
    expect(extractFechaVencimiento('Vence 15 jun 2026')).toBeDefined()
    expect(extractFechaVencimiento('Vto. 20/04/2026')).toBeDefined()
  })
})

describe('extractFechaEmision (OCR-tolerante)', () => {
  it('extrae con label estándar', () => {
    const d = extractFechaEmision('Fecha de emisión: 07 jul 2023')
    expect(d?.getDate()).toBe(7)
  })

  it('extrae con em-dashes', () => {
    const d = extractFechaEmision('Fecha de emisión — 16 may 2026')
    expect(d?.getDate()).toBe(16)
  })
})

describe('extractNumeroCliente (OCR-tolerante)', () => {
  it('extrae con N° estándar', () => {
    expect(extractNumeroCliente('N° Cliente: 12345678-9')).toBe('12345678-9')
  })

  it('NO captura "Fecha" como número (regression false-positive OCR)', () => {
    // El OCR mete "N'Cliente Fecha" sin separador claro. El capture
    // restringido a dígitos descarta "Fecha".
    expect(
      extractNumeroCliente("Cupón N'Cliente Fecha de vencimiento"),
    ).toBeUndefined()
  })

  it('extrae con apóstrofo (OCR mangled de N°)', () => {
    expect(extractNumeroCliente("N'Cliente: 1234567")).toBe('1234567')
  })

  it('acepta dígito con K final (RUT-like)', () => {
    expect(extractNumeroCliente('N° Cliente: 1234567-K')).toBe('1234567-K')
  })
})

describe('normalizeOcrText (patrones extendidos)', () => {
  it('corrige "Tota1" → "Total"', () => {
    expect(normalizeOcrText('Tota1 a pagar $1000')).toContain('Total')
  })

  it('corrige "T0tal" → "Total" (cero en lugar de O)', () => {
    expect(normalizeOcrText('T0tal a pagar $1000')).toContain('Total')
  })

  it('corrige "Per1odo" → "Período"', () => {
    expect(normalizeOcrText('Per1odo facturado: 01/05')).toContain('Período')
  })

  it('corrige "kvvh" → "kWh"', () => {
    expect(normalizeOcrText('Consumo: 100 kvvh')).toContain('kWh')
  })

  it('quita BOM (U+FEFF) y zero-width chars', () => {
    const withBom = '﻿CHILQUINTA'
    expect(normalizeOcrText(withBom)).toBe('CHILQUINTA')
  })
})

describe('extractTotal (con fallback)', () => {
  it('extrae con label estándar "Total a pagar"', () => {
    expect(extractTotal('Total a pagar $ 28.533')).toBe(28533)
  })

  it('extrae "Total Boleta" como alias', () => {
    expect(extractTotal('Total Boleta $ 45.000')).toBe(45000)
  })

  it('fallback: agarra el número más grande con $ cuando label falla', () => {
    // Si el label "Total a pagar" se mangle a "Total a paqar", el regex
    // estándar falla. El fallback busca "Total" + número más grande.
    const text =
      'Total mensual\nÚltimo pago: $22.816\n... cargos varios ...\nMonto del mes: $45.000'
    expect(extractTotal(text)).toBe(45000)
  })

  it('fallback descarta "Último pago" del scan', () => {
    const text =
      'Cargos: $5.000\nTotal del mes: $50.000\nÚltimo pago: $99.999'
    // Aunque $99.999 sea más grande, se descarta por estar cerca de
    // "Último pago".
    expect(extractTotal(text)).toBe(50000)
  })

  it('devuelve 0 si no hay ningún "Total" en el texto', () => {
    expect(extractTotal('Recibo de papelería $1.000')).toBe(0)
  })

  it('NO matchea "Subtotal" como si fuera "Total" (regression)', () => {
    // Sin \b antes de "Total", el regex matcheaba "Total" dentro de
    // "Subtotal" y agarraba el monto del subtotal como total.
    expect(extractTotal('Subtotal $ 5.000')).toBe(0)
  })

  it('cuando hay Subtotal y Total, agarra el Total', () => {
    expect(
      extractTotal('Subtotal $ 5.000\nTotal a pagar $ 10.000'),
    ).toBe(10000)
  })
})

describe('extractIVA (tolerante)', () => {
  it('extrae "IVA 19%" estándar', () => {
    expect(extractIVA('IVA 19% $ 5.000')).toBe(5000)
  })

  it('extrae "I.V.A." con dots', () => {
    expect(extractIVA('I.V.A. $ 5.000')).toBe(5000)
  })

  it('extrae "I V A" con espacios', () => {
    expect(extractIVA('I V A 19% $ 5.000')).toBe(5000)
  })
})
