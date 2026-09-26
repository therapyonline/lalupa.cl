import { describe, expect, it } from 'vitest'
import {
  calcularMontoMensual,
  calcularMontoSemestral,
  evaluarSubsidioElectrico,
  type RespuestasUsuario,
} from './elegibilidad-subsidio'
import {
  buildRespuestasUsuario,
  evaluarRespuestasWizard,
} from './subsidio-electrico'

const valid: RespuestasUsuario = {
  esMayorDeEdad: true,
  estaEnRSH: true,
  tramoCSE: '0-40',
  hayElectrodependiente: false,
  esClienteResidencial: true,
  estaEnSistemaRegulado: true,
  estaAlDia: true,
  tieneClaveUnica: true,
  cantidadIntegrantes: 4,
}

const answers = {
  esMayorDeEdad: true,
  rshYTramo: '0-40',
  hayElectrodependiente: false,
  esClienteResidencial: true,
  estaEnSistemaRegulado: true,
  estaAlDia: true,
  tieneClaveUnica: true,
  cantidadIntegrantes: 4,
}

describe('orientación del subsidio: quinta convocatoria cerrada', () => {
  it.each([
    [1, 17346, 2891],
    [2, 22548, 3758],
    [3, 22548, 3758],
    [4, 31224, 5204],
    [13, 31224, 5204],
  ])(
    'referencia oficial para %i integrantes',
    (integrantes, semestre, cuota) => {
      expect(calcularMontoSemestral(integrantes)).toBe(semestre)
      expect(calcularMontoMensual(integrantes)).toBe(cuota)
      expect(
        evaluarSubsidioElectrico({
          ...valid,
          cantidadIntegrantes: integrantes,
        }),
      ).toMatchObject({
        califica: true,
        montoSemestralCLP: semestre,
        montoMensualCLP: cuota,
      })
    },
  )

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'no calcula un beneficio con cantidad inválida: %s',
    (cantidadIntegrantes) => {
      expect(calcularMontoSemestral(cantidadIntegrantes)).toBe(0)
      expect(
        evaluarSubsidioElectrico({ ...valid, cantidadIntegrantes }),
      ).toMatchObject({
        califica: false,
        montoSemestralCLP: null,
        montoMensualCLP: null,
      })
    },
  )

  it('coincidir con los requisitos no acredita adjudicación ni plazo abierto', () => {
    const result = evaluarSubsidioElectrico(valid)
    expect(result.califica).toBe(true)
    expect(result.motivo).toContain('Solo el resultado oficial')
    expect(result.alertas.join(' ')).toContain('está cerrada')
    expect(result.alertas.join(' ')).toContain('suministro compartido')
    expect(result.pasosSiguientes[0]).toContain('Consulta el resultado')
    expect(result).not.toHaveProperty('prioridad')
  })

  it.each([
    'esMayorDeEdad',
    'estaEnRSH',
    'esClienteResidencial',
    'estaEnSistemaRegulado',
    'estaAlDia',
  ] as const)('electrodependencia no sustituye el requisito %s', (field) => {
    expect(
      evaluarSubsidioElectrico({
        ...valid,
        hayElectrodependiente: true,
        [field]: false,
      }).califica,
    ).toBe(false)
  })

  it.each(['41-60', '61-80', '81-90', '91-100'] as const)(
    'el tramo %s requiere la condición de electrodependencia',
    (tramoCSE) => {
      expect(evaluarSubsidioElectrico({ ...valid, tramoCSE }).califica).toBe(
        false,
      )
      expect(
        evaluarSubsidioElectrico({
          ...valid,
          tramoCSE,
          hayElectrodependiente: true,
        }).califica,
      ).toBe(true)
    },
  )

  it('ClaveÚnica no es un requisito excluyente', () => {
    const result = evaluarSubsidioElectrico({
      ...valid,
      tieneClaveUnica: false,
    })
    expect(result.califica).toBe(true)
    expect(result.alertas.join(' ')).toContain('ChileAtiende')
  })

  it('una solicitud del mismo hogar no se presenta como un rechazo oficial', () => {
    const result = evaluarSubsidioElectrico({
      ...valid,
      otroIntegranteYaPostulo: true,
    })
    expect(result.califica).toBe(false)
    expect(result.bloqueadores.join(' ')).toContain(
      'no significa que el hogar haya sido rechazado',
    )
  })

  it('la deuda se pregunta al corte histórico, sin prometer regularización posterior', () => {
    const result = evaluarSubsidioElectrico({ ...valid, estaAlDia: false })
    expect(result.bloqueadores.join(' ')).toContain('22 de junio de 2026')
    expect(result.bloqueadores.join(' ')).toContain(
      'Regularizar hoy no acredita',
    )
  })

  it('informa factores declarados sin inventar un puntaje de selección', () => {
    const result = evaluarSubsidioElectrico({
      ...valid,
      hayNinos: true,
      hayPersonaCuidadora: true,
    })
    expect(result.factoresPrioridad).toHaveLength(2)
    expect(result.factoresPrioridad.join(' ')).toMatch(/Niños.*cuidadora/)
    expect(result).not.toHaveProperty('prioridad')
  })
})

describe('entrada del cuestionario', () => {
  it.each([undefined, '', '4personas', '1.5', NaN, Infinity])(
    'no inventa integrantes ni trunca entradas: %s',
    (cantidadIntegrantes) => {
      expect(
        evaluarRespuestasWizard({ ...answers, cantidadIntegrantes })
          .montoSemestralCLP,
      ).toBeNull()
    },
  )
  it('convierte únicamente números completos y conserva respuestas falsas', () => {
    expect(
      buildRespuestasUsuario({
        ...answers,
        cantidadIntegrantes: '4',
        estaAlDia: false,
      }),
    ).toMatchObject({
      cantidadIntegrantes: 4,
      estaAlDia: false,
      hayElectrodependiente: false,
    })
  })
  it.each(['false', 'true', 1])(
    'no convierte %s en una afirmación',
    (esMayorDeEdad) => {
      expect(
        evaluarRespuestasWizard({ ...answers, esMayorDeEdad }).califica,
      ).toBe(false)
    },
  )
  it.each([undefined, 'inventado', null])(
    'no infiere registro RSH a partir de %s',
    (rshYTramo) => {
      expect(
        evaluarRespuestasWizard({
          ...answers,
          rshYTramo,
          hayElectrodependiente: true,
        }).califica,
      ).toBe(false)
    },
  )
})
