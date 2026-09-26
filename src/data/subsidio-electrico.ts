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
 * **TODO**: cuando se publique una nueva convocatoria oficial,
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
    pregunta: '¿Tenías 18 años o más al postular?',
    descripcion:
      'Solo personas mayores de edad pueden postular en representación de su hogar.',
    tipo: 'boolean',
  },
  {
    id: 'rshYTramo',
    pregunta:
      '¿Estás en el Registro Social de Hogares y en qué tramo de Calificación Socioeconómica?',
    descripcion:
      'Responde según el RSH vigente en la segunda quincena de mayo de 2026. Puedes consultar tus antecedentes en Ventanilla Única Social.',
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
      'Para esta convocatoria importaba la inscripción vigente a marzo de 2026 y contar con RSH; esta respuesta no verifica esos registros.',
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
      '¿Eras cliente de una empresa o cooperativa concesionaria de distribución eléctrica?',
    descripcion:
      'Consulta a tu empresa si desconoces la condición del suministro; estar en una zona aislada no permite concluir por sí solo que no cumples.',
    tipo: 'boolean',
  },
  {
    id: 'estaAlDia',
    pregunta:
      '¿Cumplías la condición de pago de la cuenta de luz al 22 de junio de 2026?',
    descripcion:
      'Responde sobre esa fecha, no sobre tu deuda actual. Si hubo repactación, confirma con la empresa cómo quedó registrada.',
    tipo: 'boolean',
  },
  {
    id: 'tieneClaveUnica',
    pregunta: '¿Tienes ClaveÚnica activa?',
    descripcion:
      'La falta de ClaveÚnica no bloquea esta orientación. ChileAtiende también informa resultados por sus canales de atención.',
    tipo: 'boolean',
  },
  {
    id: 'cantidadIntegrantes',
    pregunta: '¿Cuántas personas viven en tu hogar según el RSH?',
    descripcion:
      'El monto del subsidio depende del número de integrantes (1 / 2-3 / 4 o más).',
    tipo: 'number',
    min: 1,
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
      'Factor de priorización declarado; no permite estimar una probabilidad de adjudicación.',
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
    pregunta: '¿Hay alguien en el hogar que ejerce cuidados de otra persona?',
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
  const tramos: readonly TramoCSE[] = [
    '0-40',
    '41-60',
    '61-80',
    '81-90',
    '91-100',
  ]
  const tramoCSE: TramoCSE = tramos.includes(answers.rshYTramo as TramoCSE)
    ? (answers.rshYTramo as TramoCSE)
    : 'no_registrado'
  const estaEnRSH = tramoCSE !== 'no_registrado'

  const intRaw = answers.cantidadIntegrantes
  const cantidadIntegrantes =
    typeof intRaw === 'number'
      ? intRaw
      : typeof intRaw === 'string'
        ? Number(intRaw)
        : NaN

  return {
    esMayorDeEdad: answers.esMayorDeEdad === true,
    estaEnRSH,
    tramoCSE,
    hayElectrodependiente: answers.hayElectrodependiente === true,
    esClienteResidencial: answers.esClienteResidencial === true,
    estaEnSistemaRegulado: answers.estaEnSistemaRegulado === true,
    estaAlDia: answers.estaAlDia === true,
    tieneClaveUnica: answers.tieneClaveUnica === true,
    cantidadIntegrantes,
    otroIntegranteYaPostulo:
      answers.otroIntegranteYaPostulo === undefined
        ? undefined
        : answers.otroIntegranteYaPostulo === true,
    hayPersonaConDiscapacidad:
      answers.hayPersonaConDiscapacidad === undefined
        ? undefined
        : answers.hayPersonaConDiscapacidad === true,
    hayNinos:
      answers.hayNinos === undefined ? undefined : answers.hayNinos === true,
    hayAdultoMayor:
      answers.hayAdultoMayor === undefined
        ? undefined
        : answers.hayAdultoMayor === true,
    hayPersonaCuidadora:
      answers.hayPersonaCuidadora === undefined
        ? undefined
        : answers.hayPersonaCuidadora === true,
  }
}

/**
 * Helper directo: corre el wizard end-to-end. Útil para tests rápidos.
 */
export function evaluarRespuestasWizard(answers: RespuestasWizard) {
  return evaluarSubsidioElectrico(buildRespuestasUsuario(answers))
}
