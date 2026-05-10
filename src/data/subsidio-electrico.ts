/**
 * Wizard del Subsidio Eléctrico Ley 21.667, 5ta convocatoria 2026.
 *
 * Este archivo es la capa que el componente <Wizard> consume:
 *  - `PREGUNTAS_2026`: array de preguntas a mostrar (13 en total)
 *  - `buildRespuestasUsuario(answers)`: mapea respuestas planas del wizard
 *    al shape `RespuestasUsuario` que entiende el motor de elegibilidad
 *  - re-exports del motor (`evaluarSubsidioElectrico`, etc.) que vive en
 *    [`elegibilidad-subsidio.ts`](./elegibilidad-subsidio.ts)
 *
 * **TODO**: cuando llegue la lista oficial actualizada de la SEC,
 * reemplazar `PREGUNTAS_2026` y/o `buildRespuestasUsuario` para reflejar
 * los criterios vigentes. La normativa puede cambiar entre convocatorias.
 */

import {
  type RespuestasUsuario,
  type TramoCSE,
  evaluarSubsidioElectrico,
} from './elegibilidad-subsidio'

export type {
  IntegrantesHogar,
  RespuestasUsuario,
  ResultadoElegibilidad,
  TramoCSE,
} from './elegibilidad-subsidio'

export {
  CALENDARIO_5TA_CONVOCATORIA,
  ELEGIBILIDAD_METADATA,
  MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP,
  calcularMontoMensual,
  calcularMontoSemestral,
  evaluarSubsidioElectrico,
  formatFechaCalendario,
} from './elegibilidad-subsidio'

export type TipoPregunta = 'boolean' | 'select' | 'number'

export interface OpcionPregunta {
  value: string
  label: string
}

export interface PreguntaWizard {
  /** Identificador único; se usa como key en el state de respuestas. */
  id: string
  pregunta: string
  /** Texto auxiliar opcional, mostrado debajo de la pregunta. */
  descripcion?: string
  tipo: TipoPregunta
  /** Para `tipo: 'select'`. */
  opciones?: ReadonlyArray<OpcionPregunta>
  /** Marca la pregunta como saltable. */
  opcional?: boolean
  /** Para `tipo: 'number'`. */
  min?: number
  max?: number
}

/**
 * 13 preguntas cubriendo los criterios obligatorios + factores de
 * priorización del Subsidio Eléctrico Ley 21.667.
 *
 * Mapeo a `RespuestasUsuario`: cada `id` (excepto `rshYTramo`) coincide
 * con el campo correspondiente. `rshYTramo` se separa en `estaEnRSH` +
 * `tramoCSE` dentro de `buildRespuestasUsuario`.
 */
export const PREGUNTAS_2026: ReadonlyArray<PreguntaWizard> = [
  {
    id: 'esMayorDeEdad',
    pregunta: '¿Tienes 18 años o más?',
    descripcion:
      'Solo personas mayores de edad pueden postular en representación de su hogar.',
    tipo: 'boolean',
  },
  {
    id: 'rshYTramo',
    pregunta:
      '¿Estás en el Registro Social de Hogares y en qué tramo de Calificación Socioeconómica?',
    descripcion:
      'Puedes consultar tu tramo en ventanillaunicasocial.gob.cl con tu ClaveÚnica.',
    tipo: 'select',
    opciones: [
      { value: 'no_registrado', label: 'No estoy registrado en el RSH' },
      { value: '0-40', label: 'Sí, Tramo 0% a 40% (más vulnerable)' },
      { value: '41-60', label: 'Sí, Tramo 41% a 60%' },
      { value: '61-80', label: 'Sí, Tramo 61% a 80%' },
      { value: '81-90', label: 'Sí, Tramo 81% a 90%' },
      { value: '91-100', label: 'Sí, Tramo 91% a 100%' },
    ],
  },
  {
    id: 'hayElectrodependiente',
    pregunta:
      '¿En tu hogar vive una persona electrodependiente inscrita en el Registro?',
    descripcion:
      'Las personas electrodependientes postulan automáticamente, sin importar el tramo.',
    tipo: 'boolean',
  },
  {
    id: 'esClienteResidencial',
    pregunta: '¿Tu cuenta de luz es residencial (no comercial)?',
    tipo: 'boolean',
  },
  {
    id: 'estaEnSistemaRegulado',
    pregunta:
      '¿Tu suministro eléctrico está regulado por la SEC (no es un sistema aislado)?',
    descripcion:
      'Algunas zonas extremas tienen sistemas aislados que no están regulados por la SEC y no aplican.',
    tipo: 'boolean',
  },
  {
    id: 'estaAlDia',
    pregunta:
      '¿Estás al día en el pago de tu cuenta de luz, o tienes convenio de pago vigente?',
    descripcion:
      'Si tienes deuda, puedes regularizarla antes del 22 de junio de 2026 para postular.',
    tipo: 'boolean',
  },
  {
    id: 'tieneClaveUnica',
    pregunta: '¿Tienes ClaveÚnica activa?',
    descripcion:
      'Si no tienes, puedes tramitar el subsidio presencialmente en Chile Atiende.',
    tipo: 'boolean',
  },
  {
    id: 'cantidadIntegrantes',
    pregunta: '¿Cuántas personas viven en tu hogar según el RSH?',
    descripcion:
      'El monto del subsidio depende del número de integrantes (1 / 2-3 / 4 o más).',
    tipo: 'number',
    min: 1,
    max: 12,
  },
  {
    id: 'otroIntegranteYaPostulo',
    pregunta:
      '¿Otra persona de tu hogar ya postuló a esta convocatoria del subsidio?',
    descripcion:
      'Solo se permite una postulación por hogar y un postulante por hogar.',
    tipo: 'boolean',
  },
  {
    id: 'hayPersonaConDiscapacidad',
    pregunta:
      '¿En tu hogar hay alguna persona con discapacidad, dependencia o invalidez?',
    descripcion:
      'Mejora la prioridad al adjudicar cuando hay más postulantes que cupos.',
    tipo: 'boolean',
    opcional: true,
  },
  {
    id: 'hayNinos',
    pregunta: '¿Hay niños, niñas o adolescentes (menores de 18) en tu hogar?',
    tipo: 'boolean',
    opcional: true,
  },
  {
    id: 'hayAdultoMayor',
    pregunta: '¿Hay adultos mayores en tu hogar?',
    tipo: 'boolean',
    opcional: true,
  },
  {
    id: 'hayPersonaCuidadora',
    pregunta:
      '¿Hay alguien en el hogar que ejerce cuidados de otra persona?',
    tipo: 'boolean',
    opcional: true,
  },
] as const

export type RespuestasWizard = Record<string, unknown>

/**
 * Mapea las respuestas planas del wizard al shape `RespuestasUsuario`
 * que entiende `evaluarSubsidioElectrico`.
 *
 * Si una respuesta opcional no fue dada (saltada), queda como
 * `undefined` en el resultado, lo cual es válido para los campos
 * opcionales del schema.
 */
export function buildRespuestasUsuario(
  answers: RespuestasWizard,
): RespuestasUsuario {
  const rshYTramo = answers.rshYTramo as TramoCSE | 'no_registrado' | undefined
  const estaEnRSH = rshYTramo !== undefined && rshYTramo !== 'no_registrado'
  const tramoCSE: TramoCSE = (rshYTramo ?? 'no_registrado') as TramoCSE

  const intRaw = answers.cantidadIntegrantes
  const cantidadIntegrantes =
    typeof intRaw === 'number'
      ? intRaw
      : typeof intRaw === 'string'
        ? parseInt(intRaw, 10) || 1
        : 1

  return {
    esMayorDeEdad: Boolean(answers.esMayorDeEdad),
    estaEnRSH,
    tramoCSE,
    hayElectrodependiente: Boolean(answers.hayElectrodependiente),
    esClienteResidencial: Boolean(answers.esClienteResidencial),
    estaEnSistemaRegulado: Boolean(answers.estaEnSistemaRegulado),
    estaAlDia: Boolean(answers.estaAlDia),
    tieneClaveUnica: Boolean(answers.tieneClaveUnica),
    cantidadIntegrantes,
    otroIntegranteYaPostulo:
      answers.otroIntegranteYaPostulo === undefined
        ? undefined
        : Boolean(answers.otroIntegranteYaPostulo),
    hayPersonaConDiscapacidad:
      answers.hayPersonaConDiscapacidad === undefined
        ? undefined
        : Boolean(answers.hayPersonaConDiscapacidad),
    hayNinos:
      answers.hayNinos === undefined ? undefined : Boolean(answers.hayNinos),
    hayAdultoMayor:
      answers.hayAdultoMayor === undefined
        ? undefined
        : Boolean(answers.hayAdultoMayor),
    hayPersonaCuidadora:
      answers.hayPersonaCuidadora === undefined
        ? undefined
        : Boolean(answers.hayPersonaCuidadora),
  }
}

/**
 * Helper directo: corre el wizard end-to-end. Útil para tests rápidos.
 */
export function evaluarRespuestasWizard(answers: RespuestasWizard) {
  return evaluarSubsidioElectrico(buildRespuestasUsuario(answers))
}
