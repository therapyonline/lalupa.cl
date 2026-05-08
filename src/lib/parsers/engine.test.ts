import { describe, expect, it } from 'vitest'
import {
  countAlphanumeric,
  detectDistribuidora,
  isHeicFile,
} from './engine'

describe('detectDistribuidora', () => {
  it('detecta CGE por RUT (alta confianza)', () => {
    expect(detectDistribuidora('Texto con RUT 99.513.400-4 al medio')).toBe(
      'CGE',
    )
  })

  it('detecta Enel por RUT', () => {
    expect(detectDistribuidora('boleta Enel RUT 96.800.570-7 .')).toBe('Enel')
  })

  it('detecta Chilquinta por RUT', () => {
    expect(detectDistribuidora('Chilquinta 96.813.520-1')).toBe('Chilquinta')
  })

  it('detecta SAESA por RUT', () => {
    expect(detectDistribuidora('Auxiliar 96.544.470-3 boleta')).toBe('SAESA')
  })

  it('detecta Frontel por RUT', () => {
    expect(detectDistribuidora('Empresa Eléctrica RUT 76.073.164-1 .')).toBe(
      'Frontel',
    )
  })

  it('detecta CGE por keyword "Compañía General de Electricidad" si no hay RUT', () => {
    expect(
      detectDistribuidora(
        'COMPAÑIA GENERAL DE ELECTRICIDAD S.A.\nDirección X.',
      ),
    ).toBe('CGE')
  })

  it('detecta Enel por keyword "Enel Distribución"', () => {
    expect(detectDistribuidora('Enel Distribución Chile envía esta boleta.')).toBe(
      'Enel',
    )
  })

  it('detecta SAESA por keyword "gruposaesa.cl"', () => {
    expect(detectDistribuidora('Visita gruposaesa.cl para más info')).toBe(
      'SAESA',
    )
  })

  it('devuelve null cuando ninguna keyword ni RUT coincide', () => {
    expect(
      detectDistribuidora('Este texto no menciona ninguna distribuidora.'),
    ).toBeNull()
  })

  it('devuelve null para texto vacío', () => {
    expect(detectDistribuidora('')).toBeNull()
  })

  it('prefiere RUT sobre keywords cuando ambos están presentes', () => {
    const text =
      'Documento corporativo con RUT 96.800.570-7. Menciona también CGE en el footer.'
    expect(detectDistribuidora(text)).toBe('Enel')
  })
})

describe('countAlphanumeric', () => {
  it('cuenta letras y dígitos básicos', () => {
    expect(countAlphanumeric('hola 123')).toBe(7)
  })

  it('cuenta acentos castellanos comunes', () => {
    expect(countAlphanumeric('cañón')).toBe(5)
    expect(countAlphanumeric('día')).toBe(3)
    expect(countAlphanumeric('Información')).toBe(11)
  })

  it('ignora puntuación y whitespace', () => {
    expect(countAlphanumeric('  ,;:.!?  ')).toBe(0)
    expect(countAlphanumeric('a, b, c.')).toBe(3)
  })

  it('string vacío da 0', () => {
    expect(countAlphanumeric('')).toBe(0)
  })

  it('rechaza metadata-only PDF strings (debajo del threshold)', () => {
    const onlyMetadata = '/Producer (Adobe PDF Library 17.0)\n/CreationDate'
    expect(countAlphanumeric(onlyMetadata)).toBeLessThan(50)
  })

  it('acepta texto real de boleta (encima del threshold)', () => {
    const realBoleta =
      'CGE DISTRIBUCION S A RUT 99 513 400 4 Boleta Cliente 1234567 Periodo Mayo 2026 Total a pagar 45000 cge cl'
    expect(countAlphanumeric(realBoleta)).toBeGreaterThan(50)
  })
})

describe('isHeicFile', () => {
  it('detecta por MIME type image/heic', () => {
    expect(isHeicFile({ name: 'foo.png', type: 'image/heic' })).toBe(true)
  })

  it('detecta por MIME type image/heif', () => {
    expect(isHeicFile({ name: 'foo.png', type: 'image/heif' })).toBe(true)
  })

  it('detecta por extensión .heic (Android a veces deja type vacío)', () => {
    expect(isHeicFile({ name: 'IMG_0123.heic', type: '' })).toBe(true)
  })

  it('detecta por extensión .heif (mayúsculas)', () => {
    expect(isHeicFile({ name: 'foto.HEIF', type: '' })).toBe(true)
  })

  it('rechaza JPG normal', () => {
    expect(isHeicFile({ name: 'foto.jpg', type: 'image/jpeg' })).toBe(false)
  })

  it('rechaza PDF', () => {
    expect(isHeicFile({ name: 'boleta.pdf', type: 'application/pdf' })).toBe(false)
  })

  it('rechaza PNG aunque "heic" aparezca en el medio del nombre', () => {
    expect(isHeicFile({ name: 'theicstorm.png', type: 'image/png' })).toBe(false)
  })
})
