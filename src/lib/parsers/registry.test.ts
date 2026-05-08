import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  clearParsers,
  detectParser,
  getParser,
  listParsers,
  registerParser,
} from './registry'
import type { ParserModule } from './types'

function buildStub(overrides: Partial<ParserModule>): ParserModule {
  return {
    empresa: 'TestCo',
    servicio: 'electricidad',
    fingerprint: { keywords: ['TestCo'], format: 'stub' },
    detect: (text) => text.includes('TestCo'),
    parse: () => {
      throw new Error('stub')
    },
    ...overrides,
  }
}

describe('registry', () => {
  beforeEach(() => {
    clearParsers()
  })
  afterEach(() => {
    clearParsers()
  })

  describe('registerParser', () => {
    it('registra un módulo y aparece en listParsers', () => {
      const m = buildStub({})
      registerParser(m)
      expect(listParsers()).toEqual([m])
    })

    it('reemplaza el módulo cuando se registra otro con misma empresa+servicio', () => {
      const a = buildStub({ fingerprint: { keywords: ['v1'], format: 'v1' } })
      const b = buildStub({ fingerprint: { keywords: ['v2'], format: 'v2' } })
      registerParser(a)
      registerParser(b)
      const all = listParsers()
      expect(all).toHaveLength(1)
      expect(all[0].fingerprint.format).toBe('v2')
    })

    it('coexisten módulos con misma empresa pero distinto servicio', () => {
      registerParser(buildStub({ servicio: 'electricidad' }))
      registerParser(buildStub({ servicio: 'agua' }))
      expect(listParsers()).toHaveLength(2)
    })
  })

  describe('detectParser', () => {
    it('devuelve null cuando no hay módulos registrados', () => {
      expect(detectParser('texto cualquiera')).toBeNull()
    })

    it('devuelve null para texto vacío', () => {
      registerParser(buildStub({}))
      expect(detectParser('')).toBeNull()
    })

    it('devuelve el módulo cuyo `detect()` retorna true', () => {
      const m = buildStub({})
      registerParser(m)
      expect(detectParser('boleta de TestCo')).toBe(m)
    })

    it('devuelve null cuando ningún `detect()` matchea', () => {
      registerParser(buildStub({}))
      expect(detectParser('un texto sin keywords conocidas')).toBeNull()
    })

    it('da prioridad al RUT indexado sobre detect() de otro módulo', () => {
      const cgeStub = buildStub({
        empresa: 'CGE',
        fingerprint: { keywords: ['CGE', '99.513.400-4'], format: 'cge' },
        detect: (t) => /\bCGE\b/i.test(t),
      })
      const enelStub = buildStub({
        empresa: 'Enel',
        fingerprint: { keywords: ['Enel', '96.800.570-7'], format: 'enel' },
        detect: (t) => /Enel/i.test(t),
      })
      registerParser(cgeStub)
      registerParser(enelStub)
      // Texto contiene RUT de Enel + keyword de CGE: gana Enel por RUT-priority
      const r = detectParser(
        'Documento corporativo con RUT 96.800.570-7. Menciona también CGE en el footer.',
      )
      expect(r).toBe(enelStub)
    })

    it('cae a detect() cuando ningún RUT del texto está indexado', () => {
      registerParser(buildStub({ detect: (t) => t.includes('hola') }))
      expect(detectParser('hola, sin RUT')).not.toBeNull()
    })

    it('matchea RUT con espacios como separadores (OCR ruidoso)', () => {
      const cge = buildStub({
        empresa: 'CGE',
        fingerprint: { keywords: ['99.513.400-4'], format: 'cge' },
        detect: () => false,
      })
      registerParser(cge)
      expect(detectParser('rut: 99 513 400 - 4 dirección…')).toBe(cge)
    })

    it('matchea RUT con comas como separadores', () => {
      const cge = buildStub({
        empresa: 'CGE',
        fingerprint: { keywords: ['99.513.400-4'], format: 'cge' },
        detect: () => false,
      })
      registerParser(cge)
      expect(detectParser('Rut 99,513,400-4')).toBe(cge)
    })

    it('matchea RUT con dos puntos en lugar de guión (raro pero pasa con OCR)', () => {
      const cge = buildStub({
        empresa: 'CGE',
        fingerprint: { keywords: ['99.513.400-4'], format: 'cge' },
        detect: () => false,
      })
      registerParser(cge)
      expect(detectParser('99.513.400:4')).toBe(cge)
    })

    it('fallback OCR-tolerante: matchea keyword aún si el OCR rompe puntuación', () => {
      const chilq = buildStub({
        empresa: 'Chilquinta',
        fingerprint: {
          keywords: ['chilquinta.cl', 'Chilquinta Energía'],
          format: 'chilq',
        },
        // detect estricto solo encuentra el dominio sin alteración
        detect: (t) => /chilquinta\.cl/.test(t),
      })
      registerParser(chilq)
      // Aquí el "detect" estricto falla, pero el normalizador encuentra el match
      expect(detectParser('Chilquinta . cl footer texto')).toBe(chilq)
      expect(detectParser('Chilquinta Energia, S.A.')).toBe(chilq)
    })

    it('fallback no matchea con keywords cortos (<4 chars normalizados)', () => {
      const noisy = buildStub({
        empresa: 'NoisyCo',
        fingerprint: { keywords: ['CGE'], format: 'noisy' },
        detect: () => false,
      })
      registerParser(noisy)
      // 'CGE' normalizado son 3 chars → no debería matchear
      expect(detectParser('comerciante general estatal')).toBeNull()
    })

    /**
     * Simulación de errores típicos de OCR sobre el dominio de un parser:
     *   - Espacios extra en RUT
     *   - Espacios extra dentro del dominio
     *   - Acentos perdidos
     *   - Mayúsculas/minúsculas mezcladas
     *
     * Validamos que la cascada (RUT-loose → detect → normalized fallback)
     * recupera la detección.
     */
    it('detecta texto OCR-noisy aunque cada nivel falle individualmente', () => {
      const enelStub = buildStub({
        empresa: 'Enel',
        fingerprint: {
          keywords: ['Enel Distribución', 'enel.cl', '96.800.570-7'],
          format: 'enel',
        },
        // detect es estricto (formato PDF)
        detect: (t) => /Enel\s+Distribuci[óo]n|enel\.cl/i.test(t),
      })
      registerParser(enelStub)

      // Caso 1: solo RUT roto por OCR
      expect(
        detectParser('Documento  RUT 96 800 570 - 7  facturado'),
      ).toBe(enelStub)

      // Caso 2: solo dominio roto por OCR (no hay RUT, detect estricto falla)
      expect(detectParser('Visita enel . cl para más info')).toBe(enelStub)

      // Caso 3: nombre largo sin acento (detect ve "Distribucion" sin tilde)
      expect(
        detectParser('Empresa: Enel Distribucion s.a. cliente 12345'),
      ).toBe(enelStub)
    })
  })

  describe('getParser', () => {
    it('encuentra por empresa y servicio (case-insensitive en empresa)', () => {
      const m = buildStub({ empresa: 'CGE' })
      registerParser(m)
      expect(getParser('CGE', 'electricidad')).toBe(m)
      expect(getParser('cge', 'electricidad')).toBe(m)
    })

    it('devuelve null si el servicio no coincide', () => {
      registerParser(buildStub({ empresa: 'CGE', servicio: 'electricidad' }))
      expect(getParser('CGE', 'agua')).toBeNull()
    })

    it('devuelve null para empresa no registrada', () => {
      registerParser(buildStub({ empresa: 'CGE' }))
      expect(getParser('Mundo', 'electricidad')).toBeNull()
    })
  })

  describe('clearParsers', () => {
    it('vacía el registry', () => {
      registerParser(buildStub({}))
      registerParser(buildStub({ empresa: 'OtroCo' }))
      clearParsers()
      expect(listParsers()).toHaveLength(0)
      expect(detectParser('boleta de TestCo')).toBeNull()
    })
  })
})
