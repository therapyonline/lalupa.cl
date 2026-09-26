/**
 * Orientación sobre requisitos de la quinta convocatoria, ya cerrada.
 * Revisión: 2026-09-26. No consulta registros oficiales ni acredita adjudicación.
 * Fuentes y alcance en ELEGIBILIDAD_METADATA. No extrapolar a futuras convocatorias.
 */

export type TramoCSE =
  | '0-40'
  | '41-60'
  | '61-80'
  | '81-90'
  | '91-100'
  | 'no_registrado'

export type IntegrantesHogar = number

export interface RespuestasUsuario {
  /** Q1: ¿Tiene 18 años o más? */
  esMayorDeEdad: boolean
  /** Q2: ¿Está inscrito en el Registro Social de Hogares? */
  estaEnRSH: boolean
  /** Q3: Tramo de Calificación Socioeconómica del RSH */
  tramoCSE: TramoCSE
  /** Q4: ¿En el hogar vive una persona electrodependiente inscrita en el Registro? */
  hayElectrodependiente: boolean
  /** Q5: ¿Es cliente residencial (vivienda, no comercio)? */
  esClienteResidencial: boolean
  /** Q6: ¿Era cliente de una empresa o cooperativa concesionaria de distribución? */
  estaEnSistemaRegulado: boolean
  /** Q7: ¿Cumplía la condición de pago al 22 de junio de 2026? */
  estaAlDia: boolean
  /** Q8: ¿Tiene ClaveÚnica? */
  tieneClaveUnica: boolean
  /** Q9: Cantidad de integrantes del hogar según RSH */
  cantidadIntegrantes: IntegrantesHogar
  /** Q10 (opcional): ¿Otra persona del hogar ya postuló a esta convocatoria? */
  otroIntegranteYaPostulo?: boolean
  /** Q11 (opcional): ¿Vive en una agrupación de viviendas (varias casas comparten empalme)? */
  esAgrupacionDeViviendas?: boolean
  /** Q12 (opcional para priorización): ¿Hay personas con discapacidad / dependencia / invalidez en el hogar? */
  hayPersonaConDiscapacidad?: boolean
  /** Q13 (opcional): ¿Hay niños o adolescentes (<18 años) en el hogar? */
  hayNinos?: boolean
  /** Q14 (opcional): ¿Hay adultos mayores en el hogar? */
  hayAdultoMayor?: boolean
  /** Q15 (opcional): ¿Hay alguien que ejerce cuidado de otra persona en el hogar? */
  hayPersonaCuidadora?: boolean
}

export interface ResultadoElegibilidad {
  /** Coincidencia orientativa de respuestas; NO adjudicación ni plazo abierto. */
  califica: boolean
  motivo: string
  /** Referencia semestral por integrantes; no es una asignación oficial. */
  montoSemestralCLP: number | null
  /** Monto mensual estimado en CLP (1 cuota = monto / 6) */
  montoMensualCLP: number | null
  /** Factores declarados; no son un puntaje ni una probabilidad de asignación. */
  factoresPrioridad: string[]
  pasosSiguientes: string[]
  /** Alertas o consideraciones especiales */
  alertas: string[]
  /** Antecedentes por verificar; no equivalen a un rechazo oficial. */
  bloqueadores: string[]
}

// ============================================================================
// CONSTANTES MONETARIAS, 5ta convocatoria 2026
// ============================================================================

/** Montos semestrales según composición del hogar (5ta convocatoria mayo 2026) */
export const MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP = {
  hogar1Integrante: 17346,
  hogar2a3Integrantes: 22548,
  hogar4OMasIntegrantes: 31224,
} as const

/** Calendario 5ta convocatoria */
export const CALENDARIO_5TA_CONVOCATORIA = {
  postulacionInicio: '2026-05-26',
  postulacionFin: '2026-06-05',
  periodoRSH: 'segunda quincena de mayo de 2026',
  periodoRegistroElectrodependientes: 'marzo de 2026',
  fechaAlDiaPago: '2026-06-22',
  resultadosFecha: '2026-08-12',
  primerDescuentoMes: '2026-08',
  ultimoDescuentoMes: '2026-12',
} as const

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

/**
 * Formatea una fecha ISO 'YYYY-MM-DD' a "DD de mes de YYYY" en español.
 *
 * Ej: '2026-06-22' → '22 de junio de 2026'.
 *
 * Lo usamos para los strings que el usuario lee en el wizard de subsidio.
 * No usamos `Date` para evitar quirks de timezone (un ISO date sin hora se
 * parsea como UTC, lo que en CLT puede dar el día anterior). Parseamos
 * manual los componentes y mapeamos el mes.
 */
export function formatFechaCalendario(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return iso
  const year = m[1]
  const monthIdx = parseInt(m[2], 10) - 1
  const day = parseInt(m[3], 10)
  const mes = MESES_ES[monthIdx] ?? ''
  if (!mes) return iso
  return `${day} de ${mes} de ${year}`
}

// ============================================================================
// FUNCIONES PURAS DE CRITERIOS
// ============================================================================

/** Q1, Edad mínima 18 años */
function cumpleEdad(r: RespuestasUsuario): boolean {
  return r.esMayorDeEdad === true
}

/** Q2, Estar en RSH */
function cumpleRSH(r: RespuestasUsuario): boolean {
  return r.estaEnRSH === true
}

/** Q3 + Q4, Cumple criterio principal (tramo 0-40% O electrodependiente) */
function cumpleCriterioPrincipal(r: RespuestasUsuario): boolean {
  if (r.hayElectrodependiente === true) return true
  return r.tramoCSE === '0-40'
}

/** Q5, Cliente residencial */
function cumpleClienteResidencial(r: RespuestasUsuario): boolean {
  return r.esClienteResidencial === true
}

/** Q6, Empresa o cooperativa concesionaria de distribución */
function cumpleSistemaRegulado(r: RespuestasUsuario): boolean {
  return r.estaEnSistemaRegulado === true
}

/** Q7, Al día con la cuenta */
function cumpleAlDia(r: RespuestasUsuario): boolean {
  return r.estaAlDia === true
}

/** Q8, Tiene ClaveÚnica (no bloqueador, hay vías presenciales) */
function tieneClaveUnica(r: RespuestasUsuario): boolean {
  return r.tieneClaveUnica === true
}

// ============================================================================
// CÁLCULO DE MONTO
// ============================================================================

export function calcularMontoSemestral(integrantes: number): number {
  if (!Number.isSafeInteger(integrantes) || integrantes <= 0) return 0
  if (integrantes === 1)
    return MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP.hogar1Integrante
  if (integrantes >= 2 && integrantes <= 3)
    return MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP.hogar2a3Integrantes
  return MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP.hogar4OMasIntegrantes
}

export function calcularMontoMensual(integrantes: number): number {
  return Math.round(calcularMontoSemestral(integrantes) / 6)
}

// ============================================================================
// PRIORIZACIÓN
// ============================================================================

function factoresDePrioridad(r: RespuestasUsuario): string[] {
  const factores: string[] = []
  if (r.hayElectrodependiente)
    factores.push(
      'Persona electrodependiente inscrita en el registro correspondiente.',
    )
  if (r.hayPersonaConDiscapacidad)
    factores.push('Persona con discapacidad, dependencia o invalidez.')
  if (r.hayNinos) factores.push('Niños, niñas o adolescentes en el hogar.')
  if (r.hayAdultoMayor) factores.push('Persona adulta mayor en el hogar.')
  if (r.hayPersonaCuidadora) factores.push('Persona cuidadora en el hogar.')
  return factores
}

// ============================================================================
// EVALUACIÓN PRINCIPAL
// ============================================================================

export function evaluarSubsidioElectrico(
  r: RespuestasUsuario,
): ResultadoElegibilidad {
  const bloqueadores: string[] = []
  const alertas: string[] = [
    'La postulación de la quinta convocatoria está cerrada. Esta revisión no consulta tu resultado oficial ni habilita una nueva solicitud.',
    'El monto por integrantes es referencial: un suministro compartido por varios hogares puede requerir otro cálculo. Verifica el monto asignado en el portal oficial.',
  ]
  if (
    !Number.isSafeInteger(r.cantidadIntegrantes) ||
    r.cantidadIntegrantes < 1
  ) {
    bloqueadores.push(
      'Indica una cantidad entera y válida de integrantes del hogar.',
    )
  }

  if (!cumpleEdad(r)) {
    bloqueadores.push(
      'Revisa que cumplías la edad mínima de 18 años al postular en representación de tu hogar.',
    )
  }

  if (!cumpleRSH(r)) {
    bloqueadores.push(
      'Revisa la inscripción de tu hogar en el RSH vigente en la segunda quincena de mayo de 2026. Una inscripción posterior no acredita ese requisito histórico.',
    )
  } else if (!cumpleCriterioPrincipal(r)) {
    bloqueadores.push(
      'Revisa si tu hogar pertenecía al tramo 0-40% del RSH en la segunda quincena de mayo de 2026 o contaba con una persona electrodependiente inscrita a marzo de 2026.',
    )
  }

  if (!cumpleClienteResidencial(r)) {
    bloqueadores.push(
      'El subsidio aplica solo a clientes residenciales. Las cuentas comerciales no califican.',
    )
  }

  if (!cumpleSistemaRegulado(r)) {
    bloqueadores.push(
      'Confirma que eres cliente de una empresa o cooperativa concesionaria de distribución eléctrica. El cuestionario no comprueba la condición de tu suministro.',
    )
  }

  if (!cumpleAlDia(r)) {
    bloqueadores.push(
      `Debías cumplir la condición de pago al ${formatFechaCalendario(CALENDARIO_5TA_CONVOCATORIA.fechaAlDiaPago)}. Regularizar hoy no acredita que cumplías el requisito en esa fecha.`,
    )
  }

  if (r.otroIntegranteYaPostulo === true) {
    bloqueadores.push(
      'Ya existe una solicitud de otro integrante del hogar. Consulta esa solicitud; esta respuesta no significa que el hogar haya sido rechazado.',
    )
  }

  // Alertas (no bloquean pero son importantes)
  if (!tieneClaveUnica(r)) {
    alertas.push(
      'No tener ClaveÚnica no determina la elegibilidad. Puedes consultar el resultado mediante los canales de atención de ChileAtiende.',
    )
  }

  if (r.esAgrupacionDeViviendas === true) {
    alertas.push(
      'Si perteneces a una agrupación de viviendas, verifica cómo quedó registrada la asignación en tu solicitud oficial.',
    )
  }

  if (r.hayElectrodependiente) {
    alertas.push(
      'La regla para electrodependencia exige los registros y fechas aplicables a esta convocatoria. Tu respuesta no comprueba una inscripción ni una adjudicación automática.',
    )
  }

  // Determinar resultado
  const califica = bloqueadores.length === 0

  if (califica) {
    const monto = calcularMontoSemestral(r.cantidadIntegrantes)
    const factoresPrioridad = factoresDePrioridad(r)
    return {
      califica: true,
      motivo:
        'Tus respuestas coinciden con los requisitos consultados de la quinta convocatoria. Solo el resultado oficial confirma si tu hogar recibió el beneficio.',
      montoSemestralCLP: monto,
      montoMensualCLP: calcularMontoMensual(r.cantidadIntegrantes),
      factoresPrioridad,
      pasosSiguientes: pasosConsulta(),
      alertas,
      bloqueadores: [],
    }
  }

  return {
    califica: false,
    motivo:
      'Hay antecedentes que revisar. Esto no equivale a un rechazo oficial de tu hogar.',
    montoSemestralCLP: null,
    montoMensualCLP: null,
    factoresPrioridad: factoresDePrioridad(r),
    pasosSiguientes: pasosConsulta(),
    alertas,
    bloqueadores,
  }
}

function pasosConsulta(): string[] {
  return [
    'Consulta el resultado y el monto asignado en subsidioelectrico.cl o en la sección Mis trámites / Apoyos recibidos de Ventanilla Única Social.',
    'Contrasta el número de cliente asignado con tu boleta y revisa descuentos y períodos informados.',
    'Si necesitas aclarar una diferencia, conserva la resolución, la boleta y el comprobante de atención; consulta los canales oficiales disponibles.',
  ]
}

export const ELEGIBILIDAD_METADATA = {
  version: '0.2.0',
  ultimaActualizacion: '2026-09-26',
  convocatoria: 5,
  estado: 'postulacion_cerrada',
  fuente: 'https://www.subsidioelectrico.cl/',
  fuentes: {
    montosYAplicacion:
      'https://energia.gob.cl/noticias/nacional/quinto-proceso-de-entrega-del-subsidio-electrico-llega-cifra-mas-alta-de-beneficiarios-desde-su-creacion',
    requisitos:
      'https://www.gob.cl/noticias/como-postular-al-quinto-proceso-subsidio-electrico/',
    cierreYResultados:
      'https://www.gob.cl/noticias/fin-plazo-subsidio-electrico-quinta-convocatoria/',
    consulta:
      'https://www.ventanillaunicasocial.gob.cl/ficha/381/subsidio-electrico',
  },
  notasActualizacion: [
    'Estado editorial verificado: la quinta postulación cerró; no se infiere una sexta convocatoria.',
    'El anuncio de resultados del 11 de agosto actualiza la aplicación a agosto, con cuotas de julio y agosto juntas, según ciclo de facturación.',
    'Los criterios orientativos no consultan RSH, pagos, registro de electrodependencia ni asignación oficial.',
    'Actualizar convocatoria, fuentes, preguntas y versión del borrador solo tras una nueva publicación oficial.',
  ],
} as const
