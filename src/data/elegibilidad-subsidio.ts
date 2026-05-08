/**
 * Elegibilidad y monto del Subsidio Eléctrico Ley 21.667, 5ta convocatoria 2026
 *
 * Fuente: https://www.subsidioelectrico.cl/ (extraído 2026-05-06)
 * Marco legal: Ley 21.667, Decreto Exento Nº136/2024 Ministerio de Energía
 *
 * Esta lógica replica las condiciones del formulario oficial para que la
 * calculadora de lalupa.cl pueda pre-evaluar elegibilidad antes de redirigir
 * al usuario al sitio del Ministerio.
 *
 * IMPORTANTE: actualizar fechas y montos cuando inicie la 6ta convocatoria
 * (probablemente noviembre 2026).
 */

// ============================================================================
// TIPOS
// ============================================================================

export type TramoCSE =
  | '0-40'
  | '41-60'
  | '61-80'
  | '81-90'
  | '91-100'
  | 'no_registrado';

export type IntegrantesHogar = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | number;

export interface RespuestasUsuario {
  /** Q1: ¿Tiene 18 años o más? */
  esMayorDeEdad: boolean;
  /** Q2: ¿Está inscrito en el Registro Social de Hogares? */
  estaEnRSH: boolean;
  /** Q3: Tramo de Calificación Socioeconómica del RSH */
  tramoCSE: TramoCSE;
  /** Q4: ¿En el hogar vive una persona electrodependiente inscrita en el Registro? */
  hayElectrodependiente: boolean;
  /** Q5: ¿Es cliente residencial (vivienda, no comercio)? */
  esClienteResidencial: boolean;
  /** Q6: ¿Está conectado a una empresa o cooperativa eléctrica regulada (NO sistema aislado)? */
  estaEnSistemaRegulado: boolean;
  /** Q7: ¿Está al día en el pago de la cuenta de luz (o tiene convenio de pago vigente)? */
  estaAlDia: boolean;
  /** Q8: ¿Tiene ClaveÚnica? */
  tieneClaveUnica: boolean;
  /** Q9: Cantidad de integrantes del hogar según RSH */
  cantidadIntegrantes: IntegrantesHogar;
  /** Q10 (opcional): ¿Otra persona del hogar ya postuló a esta convocatoria? */
  otroIntegranteYaPostulo?: boolean;
  /** Q11 (opcional): ¿Vive en una agrupación de viviendas (varias casas comparten empalme)? */
  esAgrupacionDeViviendas?: boolean;
  /** Q12 (opcional para priorización): ¿Hay personas con discapacidad / dependencia / invalidez en el hogar? */
  hayPersonaConDiscapacidad?: boolean;
  /** Q13 (opcional): ¿Hay niños o adolescentes (<18 años) en el hogar? */
  hayNinos?: boolean;
  /** Q14 (opcional): ¿Hay adultos mayores en el hogar? */
  hayAdultoMayor?: boolean;
  /** Q15 (opcional): ¿Hay alguien que ejerce cuidado de otra persona en el hogar? */
  hayPersonaCuidadora?: boolean;
}

export interface ResultadoElegibilidad {
  califica: boolean;
  motivo: string;
  /** Monto semestral estimado en CLP (null si no califica) */
  montoSemestralCLP: number | null;
  /** Monto mensual estimado en CLP (1 cuota = monto / 6) */
  montoMensualCLP: number | null;
  /** Probabilidad de priorización (alta / media / baja) */
  prioridad: 'alta' | 'media' | 'baja' | 'na';
  pasosSiguientes: string[];
  /** Alertas o consideraciones especiales */
  alertas: string[];
  /** Por qué no califica (si aplica), útil para guiar al usuario */
  bloqueadores: string[];
}

// ============================================================================
// CONSTANTES MONETARIAS, 5ta convocatoria 2026
// ============================================================================

/** Montos semestrales según composición del hogar (5ta convocatoria mayo 2026) */
export const MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP = {
  hogar1Integrante: 17346,
  hogar2a3Integrantes: 22548,
  hogar4OMasIntegrantes: 32224,
} as const;

/** Calendario 5ta convocatoria */
export const CALENDARIO_5TA_CONVOCATORIA = {
  postulacionInicio: '2026-05-26',
  postulacionFin: '2026-06-05',
  fechaCorteRSH: '2026-05-31', // segunda quincena mayo 2026
  fechaCorteElectrodependientes: '2026-03-31', // marzo 2026
  fechaAlDiaPago: '2026-06-22',
  resultadosFecha: '2026-08-31',
  primeraCuotaFecha: '2026-09-01',
  ultimaCuotaFecha: '2026-12-31',
} as const;

// ============================================================================
// FUNCIONES PURAS DE CRITERIOS
// ============================================================================

/** Q1, Edad mínima 18 años */
function cumpleEdad(r: RespuestasUsuario): boolean {
  return r.esMayorDeEdad === true;
}

/** Q2, Estar en RSH */
function cumpleRSH(r: RespuestasUsuario): boolean {
  return r.estaEnRSH === true;
}

/** Q3 + Q4, Cumple criterio principal (tramo 0-40% O electrodependiente) */
function cumpleCriterioPrincipal(r: RespuestasUsuario): boolean {
  if (r.hayElectrodependiente) return true;
  return r.tramoCSE === '0-40';
}

/** Q5, Cliente residencial */
function cumpleClienteResidencial(r: RespuestasUsuario): boolean {
  return r.esClienteResidencial === true;
}

/** Q6, Sistema regulado (no aislado) */
function cumpleSistemaRegulado(r: RespuestasUsuario): boolean {
  return r.estaEnSistemaRegulado === true;
}

/** Q7, Al día con la cuenta */
function cumpleAlDia(r: RespuestasUsuario): boolean {
  return r.estaAlDia === true;
}

/** Q8, Tiene ClaveÚnica (no bloqueador, hay vías presenciales) */
function tieneClaveUnica(r: RespuestasUsuario): boolean {
  return r.tieneClaveUnica === true;
}

// ============================================================================
// CÁLCULO DE MONTO
// ============================================================================

export function calcularMontoSemestral(integrantes: number): number {
  if (integrantes <= 0) return 0;
  if (integrantes === 1) return MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP.hogar1Integrante;
  if (integrantes >= 2 && integrantes <= 3) return MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP.hogar2a3Integrantes;
  return MONTOS_SUBSIDIO_5TA_CONVOCATORIA_CLP.hogar4OMasIntegrantes;
}

export function calcularMontoMensual(integrantes: number): number {
  return Math.round(calcularMontoSemestral(integrantes) / 6);
}

// ============================================================================
// PRIORIZACIÓN
// ============================================================================

function calcularPrioridad(r: RespuestasUsuario): 'alta' | 'media' | 'baja' {
  // Alta: persona electrodependiente (postulación automática)
  if (r.hayElectrodependiente) return 'alta';

  // Media: tramo 0-40% + algún factor de vulnerabilidad adicional
  if (
    r.tramoCSE === '0-40' &&
    (r.hayPersonaConDiscapacidad ||
      r.hayNinos ||
      r.hayAdultoMayor ||
      r.hayPersonaCuidadora)
  ) {
    return 'media';
  }

  // Baja: tramo 0-40% sin vulnerabilidad adicional
  return 'baja';
}

// ============================================================================
// EVALUACIÓN PRINCIPAL
// ============================================================================

export function evaluarSubsidioElectrico(r: RespuestasUsuario): ResultadoElegibilidad {
  const bloqueadores: string[] = [];
  const alertas: string[] = [];

  if (!cumpleEdad(r)) {
    bloqueadores.push('Debes tener 18 años o más para postular en representación de tu hogar.');
  }

  if (!cumpleRSH(r)) {
    bloqueadores.push(
      'Tu hogar debe estar inscrito en el Registro Social de Hogares (RSH). Regístrate en https://www.ventanillaunicasocial.gob.cl/.',
    );
  } else if (!cumpleCriterioPrincipal(r)) {
    bloqueadores.push(
      'Para calificar debes pertenecer al tramo 0-40% del RSH O tener una persona electrodependiente en el hogar inscrita en el Registro de Personas Electrodependientes.',
    );
  }

  if (!cumpleClienteResidencial(r)) {
    bloqueadores.push(
      'El subsidio aplica solo a clientes residenciales. Las cuentas comerciales no califican.',
    );
  }

  if (!cumpleSistemaRegulado(r)) {
    bloqueadores.push(
      'El subsidio aplica solo a clientes regulados por la SEC. Los sistemas aislados (algunas zonas extremas) no califican.',
    );
  }

  if (!cumpleAlDia(r)) {
    bloqueadores.push(
      `Debes estar al día en el pago de tu cuenta de luz al ${CALENDARIO_5TA_CONVOCATORIA.fechaAlDiaPago} (o tener convenio de pago vigente). Regulariza con tu empresa eléctrica antes de postular.`,
    );
  }

  if (r.otroIntegranteYaPostulo === true) {
    bloqueadores.push(
      'Otro integrante de tu hogar ya postuló en esta convocatoria. Solo se permite una postulación por hogar.',
    );
  }

  // Alertas (no bloquean pero son importantes)
  if (!tieneClaveUnica(r)) {
    alertas.push(
      'No tienes ClaveÚnica. Puedes obtenerla en https://claveunica.gob.cl/ o postular presencialmente en Chile Atiende con tu cédula y boleta de luz.',
    );
  }

  if (r.esAgrupacionDeViviendas === true) {
    alertas.push(
      'Vives en una agrupación de viviendas. Asegúrate de declararlo en el formulario para que la SEC verifique y entregue el subsidio desagrupado (un descuento por hogar).',
    );
  }

  if (r.hayElectrodependiente) {
    alertas.push(
      'Hogar con persona electrodependiente: postulación automática garantizada (sin importar tramo CSE), siempre que estén inscritos en el Registro de Personas Electrodependientes.',
    );
  }

  // Determinar resultado
  const califica = bloqueadores.length === 0;

  if (califica) {
    const monto = calcularMontoSemestral(r.cantidadIntegrantes);
    const prioridad = calcularPrioridad(r);
    return {
      califica: true,
      motivo: descripcionMotivoCalifica(r, prioridad),
      montoSemestralCLP: monto,
      montoMensualCLP: calcularMontoMensual(r.cantidadIntegrantes),
      prioridad,
      pasosSiguientes: pasosCalificas(r),
      alertas,
      bloqueadores: [],
    };
  }

  return {
    califica: false,
    motivo: 'No califica para esta convocatoria por las razones detalladas en bloqueadores.',
    montoSemestralCLP: null,
    montoMensualCLP: null,
    prioridad: 'na',
    pasosSiguientes: pasosNoCalificas(r),
    alertas,
    bloqueadores,
  };
}

function descripcionMotivoCalifica(r: RespuestasUsuario, prioridad: 'alta' | 'media' | 'baja'): string {
  if (r.hayElectrodependiente) {
    return 'Tu hogar califica con prioridad alta por incluir una persona electrodependiente.';
  }
  if (prioridad === 'media') {
    return 'Tu hogar califica con prioridad media por estar en tramo 0-40% RSH y tener integrantes vulnerables (discapacidad, niños, adulto mayor o cuidadora).';
  }
  return 'Tu hogar califica para postular al Subsidio Eléctrico de la 5ta convocatoria.';
}

function pasosCalificas(r: RespuestasUsuario): string[] {
  const pasos: string[] = [
    `Postulá entre el ${CALENDARIO_5TA_CONVOCATORIA.postulacionInicio} y el ${CALENDARIO_5TA_CONVOCATORIA.postulacionFin} en https://www.subsidioelectrico.cl/`,
    'Iniciá sesión con tu ClaveÚnica',
    'Tené a mano tu boleta de luz para copiar el número de cliente exacto (con dígito verificador, puntos y guiones)',
    'Completá: región, comuna, empresa eléctrica, número de cliente, correo y teléfono',
    'Declará si vivís en agrupación de viviendas (varias casas con un solo empalme)',
  ];

  if (r.hayElectrodependiente) {
    pasos.unshift(
      'Tu postulación es automática por persona electrodependiente. Verificá igual en el portal por seguridad.',
    );
  }

  pasos.push(
    `Resultados publicados en agosto 2026. Primera cuota se aplicará desde septiembre 2026 en tu boleta como "Subsidio Eléctrico Ley N°21.667".`,
  );

  return pasos;
}

function pasosNoCalificas(r: RespuestasUsuario): string[] {
  const pasos: string[] = [];

  if (!r.estaEnRSH) {
    pasos.push(
      'Inscribite en el Registro Social de Hogares: https://www.ventanillaunicasocial.gob.cl/',
    );
  } else if (r.tramoCSE !== '0-40' && !r.hayElectrodependiente) {
    pasos.push(
      'Si tu situación socioeconómica cambió, actualizá tu RSH: https://www.ventanillaunicasocial.gob.cl/',
    );
    pasos.push(
      'Si en tu hogar hay una persona electrodependiente, inscribila en el Registro de Personas Electrodependientes con tu empresa eléctrica (necesitás certificado médico).',
    );
  }

  if (!r.estaAlDia) {
    pasos.push(
      'Regularizá tu deuda con la empresa eléctrica antes del 22 de junio de 2026 (puede ser convenio de pago).',
    );
  }

  if (!r.esClienteResidencial) {
    pasos.push(
      'Verificá con tu empresa eléctrica si tu cuenta puede pasar a cliente residencial.',
    );
  }

  // Otros subsidios alternativos
  pasos.push('Considerá otros beneficios: SAP (agua), Bono Gas Licuado, Aporte Familiar Permanente.');

  return pasos;
}

// ============================================================================
// TESTS UNITARIOS BÁSICOS (Vitest / Jest compatible)
// ============================================================================

/**
 * Para correr: ts-node con un test runner.
 * Estos casos cubren los escenarios principales documentados en R3.1.
 */

export const TEST_CASES = {
  /** Caso 1: Califica claramente, prioridad baja (tramo 0-40 sin vulnerabilidades) */
  calificaBaja: {
    input: {
      esMayorDeEdad: true,
      estaEnRSH: true,
      tramoCSE: '0-40',
      hayElectrodependiente: false,
      esClienteResidencial: true,
      estaEnSistemaRegulado: true,
      estaAlDia: true,
      tieneClaveUnica: true,
      cantidadIntegrantes: 2,
    } as RespuestasUsuario,
    expected: {
      califica: true,
      montoSemestralCLP: 22548,
      montoMensualCLP: 3758,
      prioridad: 'baja',
    },
  },

  /** Caso 2: Califica con prioridad alta (electrodependiente) */
  calificaElectrodependiente: {
    input: {
      esMayorDeEdad: true,
      estaEnRSH: true,
      tramoCSE: '61-80', // sin importar tramo
      hayElectrodependiente: true,
      esClienteResidencial: true,
      estaEnSistemaRegulado: true,
      estaAlDia: true,
      tieneClaveUnica: true,
      cantidadIntegrantes: 5,
    } as RespuestasUsuario,
    expected: {
      califica: true,
      montoSemestralCLP: 32224,
      montoMensualCLP: 5371,
      prioridad: 'alta',
    },
  },

  /** Caso 3: Califica con prioridad media (0-40 + adulto mayor) */
  calificaMedia: {
    input: {
      esMayorDeEdad: true,
      estaEnRSH: true,
      tramoCSE: '0-40',
      hayElectrodependiente: false,
      esClienteResidencial: true,
      estaEnSistemaRegulado: true,
      estaAlDia: true,
      tieneClaveUnica: true,
      cantidadIntegrantes: 1,
      hayAdultoMayor: true,
    } as RespuestasUsuario,
    expected: {
      califica: true,
      montoSemestralCLP: 17346,
      montoMensualCLP: 2891,
      prioridad: 'media',
    },
  },

  /** Caso 4: NO califica, tramo alto sin electrodependiente */
  noCalificaTramoAlto: {
    input: {
      esMayorDeEdad: true,
      estaEnRSH: true,
      tramoCSE: '91-100',
      hayElectrodependiente: false,
      esClienteResidencial: true,
      estaEnSistemaRegulado: true,
      estaAlDia: true,
      tieneClaveUnica: true,
      cantidadIntegrantes: 3,
    } as RespuestasUsuario,
    expected: {
      califica: false,
      montoSemestralCLP: null,
    },
  },

  /** Caso 5: NO califica, no está al día */
  noCalificaDeuda: {
    input: {
      esMayorDeEdad: true,
      estaEnRSH: true,
      tramoCSE: '0-40',
      hayElectrodependiente: false,
      esClienteResidencial: true,
      estaEnSistemaRegulado: true,
      estaAlDia: false,
      tieneClaveUnica: true,
      cantidadIntegrantes: 4,
    } as RespuestasUsuario,
    expected: {
      califica: false,
      montoSemestralCLP: null,
    },
  },

  /** Caso 6: Borderline, no tiene ClaveÚnica pero tiene todo lo demás (NO bloquea, alerta) */
  borderlineSinClaveUnica: {
    input: {
      esMayorDeEdad: true,
      estaEnRSH: true,
      tramoCSE: '0-40',
      hayElectrodependiente: false,
      esClienteResidencial: true,
      estaEnSistemaRegulado: true,
      estaAlDia: true,
      tieneClaveUnica: false, // sin clave
      cantidadIntegrantes: 1,
    } as RespuestasUsuario,
    expected: {
      califica: true, // sigue calificando, hay alternativas presenciales
      montoSemestralCLP: 17346,
    },
  },
} as const;

// ============================================================================
// METADATA
// ============================================================================

export const ELEGIBILIDAD_METADATA = {
  version: '0.1.0',
  ultimaActualizacion: '2026-05-06',
  proximaRevision: '2026-08-31', // tras resultados 5ta convocatoria
  convocatoriaVigente: 5,
  fuente: 'https://www.subsidioelectrico.cl/',
  notasActualizacion: [
    'Cuando se publique la 6ta convocatoria (probablemente nov 2026), actualizar MONTOS y CALENDARIO.',
    'Si cambia la metodología (ej: incluir tramo 41-60), revisar cumpleCriterioPrincipal.',
  ],
} as const;
