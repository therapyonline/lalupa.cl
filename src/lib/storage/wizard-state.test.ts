import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readSessionDraft,
  reclamoDraftSchema,
  reclamoPayloadSchema,
  reclamoSource,
  subsidioDraftSchema,
  STORAGE_NOTICE,
  INVALID_DRAFT_NOTICE,
} from './wizard-state'

afterEach(() => vi.unstubAllGlobals())
describe('borradores recuperados', () => {
  it.each([-1, 1.5, 99, '2', null])('rechaza pasos inválidos: %s', (step) => {
    expect(subsidioDraftSchema.safeParse({ step, answers: {} }).success).toBe(
      false,
    )
    expect(reclamoDraftSchema.safeParse({ step, data: {} }).success).toBe(false)
  })
  it('valida tipos, opciones y límites reales de las preguntas', () => {
    expect(
      subsidioDraftSchema.safeParse({
        step: 1,
        answers: { esMayorDeEdad: false, rshYTramo: '0-40' },
      }).success,
    ).toBe(true)
    for (const answers of [
      { esMayorDeEdad: 'false' },
      { rshYTramo: 'inventado' },
      { desconocida: 3 },
      { integrantesHogar: -1 },
    ]) {
      expect(subsidioDraftSchema.safeParse({ step: 1, answers }).success).toBe(
        false,
      )
    }
  })
  it('recupera borradores antiguos parciales sin exigir campos completos', () => {
    const parsed = reclamoDraftSchema.parse({
      step: 2,
      data: { nombre: 'Ana' },
    })
    expect(parsed.data.nombre).toBe('Ana')
    expect(parsed.data.hechos).toBe('')
    expect(
      reclamoDraftSchema.safeParse({ step: 2, data: { nombre: {} } }).success,
    ).toBe(false)
  })
  it('distingue almacenamiento bloqueado, JSON corrupto y borrador inexistente', () => {
    const getItem = vi.fn()
    vi.stubGlobal('sessionStorage', { getItem })
    getItem.mockImplementationOnce(() => {
      throw new DOMException('blocked')
    })
    expect(readSessionDraft('key', subsidioDraftSchema).notice).toBe(
      STORAGE_NOTICE,
    )
    getItem.mockReturnValueOnce('{')
    expect(readSessionDraft('key', subsidioDraftSchema).notice).toBe(
      INVALID_DRAFT_NOTICE,
    )
    getItem.mockReturnValueOnce(null)
    expect(readSessionDraft('key', subsidioDraftSchema)).toEqual({ data: null })
    getItem.mockReturnValueOnce(JSON.stringify({ step: 0, answers: {} }))
    expect(readSessionDraft('key', subsidioDraftSchema).data?.step).toBe(0)
    getItem.mockReturnValueOnce('a'.repeat(250_001))
    expect(readSessionDraft('key', subsidioDraftSchema).notice).toBe(
      INVALID_DRAFT_NOTICE,
    )
  })
  it('vincula borrador al contenido de la boleta y rechaza payloads malformados', async () => {
    const payload = reclamoPayloadSchema.parse({
      empresaSlug: 'cge',
      empresaNombre: 'CGE',
      servicio: 'electricidad',
      total: 100,
      cargosSospechosos: [],
    })
    expect(await reclamoSource(payload)).toBe(await reclamoSource(payload))
    expect(await reclamoSource({ ...payload, numeroCliente: 'otro' })).not.toBe(
      await reclamoSource(payload),
    )
    expect(
      reclamoPayloadSchema.safeParse({
        ...payload,
        cargosSospechosos: 'no array',
      }).success,
    ).toBe(false)
    expect(
      reclamoPayloadSchema.safeParse({ ...payload, total: Infinity }).success,
    ).toBe(false)
  })
})
