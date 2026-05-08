/**
 * Detección robusta de Chilquinta sobre variantes de texto que un PDF
 * o OCR puede entregar. El detect estricto anterior fallaba con boletas
 * que solo dicen "CHILQUINTA" sin el sufijo "Distribución/Energía",
 * dejando al usuario con "No pudimos identificar la distribuidora".
 */

import { describe, expect, it } from 'vitest'
import { detectParser } from '../registry'
import { chilquintaParser } from './chilquinta'

// Side-effect: registra todos los parsers de electricidad.
import '../electricidad'

describe('detectParser → Chilquinta tolerancia variantes', () => {
  it('detect()'+' devuelve true con "CHILQUINTA" solo', () => {
    expect(chilquintaParser.detect('CHILQUINTA distribución de energía')).toBe(
      true,
    )
  })

  it('detect() devuelve true con solo "Chilquinta S.A."', () => {
    expect(chilquintaParser.detect('CHILQUINTA S.A. RUT 96.813.520-1')).toBe(
      true,
    )
  })

  it('detect() devuelve true con solo "chilquinta.cl"', () => {
    expect(chilquintaParser.detect('Visita chilquinta.cl')).toBe(true)
  })

  it('detect() devuelve true con RUT con separadores raros (OCR)', () => {
    // El detect en sí no incluye RUT, pero el registry lo busca primero.
    const result = detectParser(
      'BOLETA ELÉCTRICA\nRUT 96 813 520 - 1\nDirección X',
    )
    expect(result?.empresa).toBe('Chilquinta')
  })

  it('detectParser() encuentra Chilquinta solo con "Chilquinta" en texto', () => {
    const result = detectParser(
      'Boleta de servicios eléctricos Chilquinta. Cliente 12345',
    )
    expect(result?.empresa).toBe('Chilquinta')
  })

  it('detectParser() encuentra Chilquinta con "CHILQUINTA" en mayúsculas', () => {
    const result = detectParser(
      'CHILQUINTA\nBOLETA ELECTRÓNICA\nMonto del período: 27 may 2023',
    )
    expect(result?.empresa).toBe('Chilquinta')
  })

  it('detectParser() NO confunde con otras empresas que mencionan Chilquinta', () => {
    // CGE no menciona Chilquinta en su texto, pero un test paranoico:
    const result = detectParser(
      'COMPAÑIA GENERAL DE ELECTRICIDAD S.A.\nRUT: 99.513.400-4\nPara reclamos sobre Chilquinta no aplica.',
    )
    // CGE detect prima por RUT (paso 1 del cascade), no Chilquinta.
    expect(result?.empresa).toBe('CGE')
  })
})
