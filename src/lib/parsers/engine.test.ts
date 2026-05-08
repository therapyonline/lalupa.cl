import { describe, expect, it } from 'vitest'
import { detectDistribuidora } from './engine'

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
