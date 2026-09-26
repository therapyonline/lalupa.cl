/**
 * Catálogo histórico para simulaciones, NO tarifas vigentes verificadas.
 *
 * Las cifras se conservaron del dataset original (enero-mayo de 2026).
 * Revisión de alcance: 2026-09-25. No se confirmaron importes nuevos.
 * Faltan vigencia final, fuente archivada, zona/red y tratamiento tributario
 * comprobados por componente. Las fechas y notas son antecedentes pendientes
 * de cotejo, no evidencia suficiente para validar una boleta.
 *
 * No usar estos helpers aritméticos para marcar cargos como sospechosos.
 * Una validación requiere el documento oficial aplicable a TODO el período,
 * sector/grupo, opción, temporada, unidades e impuestos, sin valores inferidos.
 */

// ============================================================================
// TIPOS
// ============================================================================

export type ServicioBasico = 'electricidad' | 'agua' | 'gas';

export interface TarifaElectricaBT1 {
  /** Cargo fijo mensual independiente del consumo (CLP/mes, IVA incluido) */
  cargoFijoCLP: number | null;
  /** Cargo por uso del sistema de transmisión (CLP/kWh, IVA incluido) */
  cargoTransmisionCLPKWh: number | null;
  /** Cargo por servicio público / FET (CLP/kWh, sin IVA) */
  cargoServicioPublicoCLPKWh: number | null;
  /** Cargo por compras de potencia (CLP/kWh, IVA incluido) */
  cargoComprasPotenciaCLPKWh: number | null;
  /** Cargo por energía base / componente principal (CLP/kWh, IVA incluido) */
  cargoEnergiaCLPKWh: number | null;
  /** Cargo por potencia base en su componente de distribución (CLP/kWh, IVA incluido) */
  cargoPotenciaBaseCLPKWh: number | null;
  /** Costo total estimado por kWh (suma de todos los cargos variables) */
  precioKWhTotalCLP: number | null;
  vigenciaDesde: string; // ISO YYYY-MM-DD
  fuente: string;
  notas?: string;
}

export interface TarifaAguaPotable {
  cargoFijoCLP: number | null;
  /** Precio agua potable fuera de período punta (CLP/m³) */
  aguaPotableNoPuntaCLPM3: number | null;
  /** Precio agua potable en período punta verano (CLP/m³) */
  aguaPotablePuntaCLPM3: number | null;
  /** Sobreconsumo agua potable punta, penalty (CLP/m³) */
  sobreconsumoPuntaCLPM3: number | null;
  /** Cargo alcantarillado (CLP/m³) */
  alcantarilladoCLPM3: number | null;
  /** Período punta del año, formato MM-MM */
  periodoPunta: string;
  vigenciaDesde: string;
  fuente: string;
  notas?: string;
}

export interface TarifaGasCilindro {
  empresa: string;
  formato: '5kg' | '11kg' | '15kg' | '45kg';
  precioMinCLP: number;
  precioMaxCLP: number;
  precioPromedioCLP: number;
  region: string;
  vigenciaDesde: string;
  fuente: string;
}

// ============================================================================
// TARIFAS ELECTRICIDAD BT-1 (residencial, mayo 2026)
// ============================================================================

/**
 * Cargo fijo BT-1 por distribuidora (CLP/mes, IVA incluido).
 * Referencia histórica; no habilita validación automática por empresa.
 */
export const CARGO_FIJO_BT1_2026: Record<string, number> = {
  enel: 716.27, // Neto $601.908 + IVA
  chilquinta_a: 1225.80, // Tarifa A urbana
  chilquinta_b: 910.18, // Tarifa B rural
  cge: 1048.46, // Constante en todas las zonas STxD/STxE
  conafe: 1048.46, // Subsidiaria CGE
  saesa: 1201.26, // Neto $1.009,461 + IVA (enero 2026, sin actualización abr/may detectada)
  frontel: 1268.82, // Neto $1.066,238 + IVA (febrero 2026)
};

/**
 * Tarifa BT-1 representativa por distribuidora, mayo 2026.
 * Valores tomados de la zona/tipo de red más común para cada empresa.
 *
 * NOTA: Para CGE el componente $/kWh varía por sector tarifario (STxD-3 RM 15.964 vs STxE rural 21.435).
 * NOTA: Para Enel el cargo de potencia varía por área T1-T6 y tipo de red BT_AA / BT_SS.
 * Estos son valores RM / urbanos representativos.
 */
export const TARIFAS_BT1_2026: Record<string, TarifaElectricaBT1> = {
  enel_rm_centro_bt_aa_t1: {
    cargoFijoCLP: 716.27,
    cargoTransmisionCLPKWh: 15.964, // con IVA (transporte total Neto 13.415)
    cargoServicioPublicoCLPKWh: 0.855, // sin IVA
    cargoComprasPotenciaCLPKWh: 30.974, // con IVA
    cargoEnergiaCLPKWh: 155.936, // con IVA
    cargoPotenciaBaseCLPKWh: 23.431, // BT_AA T1 con IVA
    precioKWhTotalCLP: 227.16, // suma componentes variables
    vigenciaDesde: '2026-05-01',
    fuente: 'https://www.enel.cl/content/dam/enel-cl/es/personas/informacion-de-utilidad/tarifas-y-reglamentos/tarifas/tarifas-reguladas/2026/Enel%20Distribuci%C3%B3n%20Chile%20SA._Tarifas%20Suministro%20El%C3%A9ctrico%2024T_%20VAD%205T%20Mayo%20de%202026.pdf',
    notas: 'Valor representativo para Las Condes, Providencia, Santiago Centro (BT_AA red aérea-aérea T1). El precio sube hasta ~280 $/kWh en redes BT_SS subterráneas y áreas T6.',
  },
  cge_rm_stxd3: {
    cargoFijoCLP: 1048.46,
    cargoTransmisionCLPKWh: 15.964, // STxD-3 (RM)
    cargoServicioPublicoCLPKWh: 0.855,
    cargoComprasPotenciaCLPKWh: 1.778,
    cargoEnergiaCLPKWh: 2.931,
    cargoPotenciaBaseCLPKWh: 150.873,
    precioKWhTotalCLP: 172.40,
    vigenciaDesde: '2026-05-01',
    fuente: 'https://www.cge.cl/wp-content/uploads/2026/04/Tarifas_de_Suministro_Electrico_vigentes_a_partir_del_1_de_mayo_2026.pdf',
    notas: 'Sector tarifario STxD-3 cubre Calera de Tango, Peñaflor, San Bernardo, Buin y otras comunas RM CGE.',
  },
  cge_zona_stxe: {
    cargoFijoCLP: 1048.46,
    cargoTransmisionCLPKWh: 21.435, // STxE-X
    cargoServicioPublicoCLPKWh: 0.855,
    cargoComprasPotenciaCLPKWh: 1.778,
    cargoEnergiaCLPKWh: 2.931,
    cargoPotenciaBaseCLPKWh: 153.183,
    precioKWhTotalCLP: 180.18,
    vigenciaDesde: '2026-05-01',
    fuente: 'https://www.cge.cl/wp-content/uploads/2026/04/Tarifas_de_Suministro_Electrico_vigentes_a_partir_del_1_de_mayo_2026.pdf',
    notas: 'Sector tarifario STxE típico: V Región sur, parte VI y VII Regiones.',
  },
  chilquinta_urbano: {
    cargoFijoCLP: 1225.80,
    cargoTransmisionCLPKWh: null, // PENDIENTE
    cargoServicioPublicoCLPKWh: 0.855,
    cargoComprasPotenciaCLPKWh: null,
    cargoEnergiaCLPKWh: null,
    cargoPotenciaBaseCLPKWh: null,
    precioKWhTotalCLP: null,
    vigenciaDesde: '2026-05-01',
    fuente: 'https://a.storyblok.com/f/82872/x/3d952e70c1/suministro_chilquinta_202605.pdf',
    notas: 'PENDIENTE: parsear PDF Chilquinta para llenar componentes variables.',
  },
  saesa_default: {
    cargoFijoCLP: 1201.26,
    cargoTransmisionCLPKWh: null,
    cargoServicioPublicoCLPKWh: 0.855,
    cargoComprasPotenciaCLPKWh: null,
    cargoEnergiaCLPKWh: null,
    cargoPotenciaBaseCLPKWh: null,
    precioKWhTotalCLP: null,
    vigenciaDesde: '2026-01-01',
    fuente: 'https://www.gruposaesa.cl/saesa/tarifas-vigentes',
    notas: 'PENDIENTE: descargar XLSX 2026.05 desde gruposaesa.cl.',
  },
  frontel_default: {
    cargoFijoCLP: 1268.82,
    cargoTransmisionCLPKWh: null,
    cargoServicioPublicoCLPKWh: 0.855,
    cargoComprasPotenciaCLPKWh: null,
    cargoEnergiaCLPKWh: null,
    cargoPotenciaBaseCLPKWh: null,
    precioKWhTotalCLP: null,
    vigenciaDesde: '2026-02-01',
    fuente: 'https://www.gruposaesa.cl/frontel/tarifas-vigentes',
    notas: 'PENDIENTE: descargar XLSX más reciente.',
  },
};

// ============================================================================
// TARIFAS AGUA POTABLE Y ALCANTARILLADO (Mar 2026)
// ============================================================================

export const TARIFAS_AGUA_2026: Record<string, TarifaAguaPotable> = {
  aguas_andinas_g1: {
    cargoFijoCLP: 914,
    aguaPotableNoPuntaCLPM3: 592.98,
    aguaPotablePuntaCLPM3: 593.03,
    sobreconsumoPuntaCLPM3: 1701.72,
    alcantarilladoCLPM3: 759.39,
    periodoPunta: '12-03', // diciembre a marzo
    vigenciaDesde: '2026-03-01',
    fuente: 'https://www.siss.gob.cl/589/articles-4625_Andinas_G1_Feb2026.pdf',
    notas: 'Cubre Gran Santiago, Pirque, Til Til y sectores específicos La Florida/Puente Alto.',
  },
  aguas_andinas_g2: {
    cargoFijoCLP: null,
    aguaPotableNoPuntaCLPM3: null,
    aguaPotablePuntaCLPM3: null,
    sobreconsumoPuntaCLPM3: null,
    alcantarilladoCLPM3: null,
    periodoPunta: '12-03',
    vigenciaDesde: '2026-03-01',
    fuente: 'https://www.siss.gob.cl/589/articles-4625_Andinas_G2_Feb2026.pdf',
    notas: 'PENDIENTE: parsear PDF Grupo 2 (otras localidades RM).',
  },
  esval: {
    cargoFijoCLP: null,
    aguaPotableNoPuntaCLPM3: null,
    aguaPotablePuntaCLPM3: null,
    sobreconsumoPuntaCLPM3: null,
    alcantarilladoCLPM3: null,
    periodoPunta: '12-03',
    vigenciaDesde: '2025-10-01',
    fuente: 'https://www.siss.gob.cl/589/articles-4503_ESVAL_GPC_Oct2025.pdf',
    notas: 'PENDIENTE: descargar PDF Feb-Mar 2026 desde SISS (V Región).',
  },
  // PENDIENTE: essbio, nuevosur, smapa, aguas_del_valle
};

// ============================================================================
// TARIFAS GAS LICUADO (cilindros, mayo 2026 RM)
// ============================================================================

export const TARIFAS_GAS_CILINDROS_2026: TarifaGasCilindro[] = [
  {
    empresa: 'Lipigas',
    formato: '15kg',
    precioMinCLP: 18900,
    precioMaxCLP: 19990,
    precioPromedioCLP: 19400,
    region: 'RM',
    vigenciaDesde: '2026-05-01',
    fuente: 'https://www.sec.cl/precios-de-combustibles/',
  },
  {
    empresa: 'Abastible',
    formato: '15kg',
    precioMinCLP: 19990,
    precioMaxCLP: 20900,
    precioPromedioCLP: 20400,
    region: 'RM',
    vigenciaDesde: '2026-05-01',
    fuente: 'https://www.sec.cl/precios-de-combustibles/',
  },
  {
    empresa: 'Gasco GLP',
    formato: '15kg',
    precioMinCLP: 17900,
    precioMaxCLP: 18900,
    precioPromedioCLP: 18400,
    region: 'RM',
    vigenciaDesde: '2026-05-01',
    fuente: 'https://www.sec.cl/precios-de-combustibles/',
  },
  // PENDIENTE: variantes 5kg, 11kg, 45kg + regiones distintas a RM
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Devuelve una referencia BT-1 histórica, sin comprobar vigencia ni aplicabilidad.
 * Si no encuentra match, devuelve null.
 */
export function getTarifaElectrica(claveZona: string): TarifaElectricaBT1 | null {
  return TARIFAS_BT1_2026[claveZona] ?? null;
}

/**
 * Devuelve cargo fijo BT-1 por distribuidora.
 */
export function getCargoFijoBT1(distribuidora: string): number | null {
  const key = distribuidora.toLowerCase().replace(/\s+/g, '_');
  return CARGO_FIJO_BT1_2026[key] ?? null;
}

/**
 * Simulación con el catálogo histórico de electricidad BT-1, sin validar aplicabilidad.
 * Retorna desglose por componente y total.
 */
export interface DesgloseBoletaElectrica {
  cargoFijo: number;
  cargoTransmision: number;
  cargoServicioPublico: number;
  cargoComprasPotencia: number;
  cargoEnergia: number;
  cargoPotenciaBase: number;
  total: number;
  precioPromedioKWh: number;
}

export function calcularBoletaEsperadaElectricidad(
  claveZona: string,
  kWhConsumidos: number,
): DesgloseBoletaElectrica | null {
  const t = getTarifaElectrica(claveZona);
  if (!t || !Number.isFinite(kWhConsumidos) || kWhConsumidos < 0) return null;
  // No convertir referencias ausentes a cero.
  if (
    t.cargoFijoCLP == null ||
    t.cargoServicioPublicoCLPKWh == null ||
    t.cargoTransmisionCLPKWh == null ||
    t.cargoComprasPotenciaCLPKWh == null ||
    t.cargoEnergiaCLPKWh == null ||
    t.cargoPotenciaBaseCLPKWh == null
  ) {
    return null;
  }
  if (![t.cargoFijoCLP, t.cargoTransmisionCLPKWh, t.cargoServicioPublicoCLPKWh,
    t.cargoComprasPotenciaCLPKWh, t.cargoEnergiaCLPKWh, t.cargoPotenciaBaseCLPKWh]
    .every((value) => Number.isFinite(value) && value >= 0)) return null;
  const cargoFijo = t.cargoFijoCLP;
  const cargoTransmision = t.cargoTransmisionCLPKWh * kWhConsumidos;
  const cargoServicioPublico = t.cargoServicioPublicoCLPKWh * kWhConsumidos;
  const cargoComprasPotencia = t.cargoComprasPotenciaCLPKWh * kWhConsumidos;
  const cargoEnergia = t.cargoEnergiaCLPKWh * kWhConsumidos;
  const cargoPotenciaBase = t.cargoPotenciaBaseCLPKWh * kWhConsumidos;
  const total =
    cargoFijo +
    cargoTransmision +
    cargoServicioPublico +
    cargoComprasPotencia +
    cargoEnergia +
    cargoPotenciaBase;
  return {
    cargoFijo: Math.round(cargoFijo),
    cargoTransmision: Math.round(cargoTransmision),
    cargoServicioPublico: Math.round(cargoServicioPublico),
    cargoComprasPotencia: Math.round(cargoComprasPotencia),
    cargoEnergia: Math.round(cargoEnergia),
    cargoPotenciaBase: Math.round(cargoPotenciaBase),
    total: Math.round(total),
    precioPromedioKWh: kWhConsumidos > 0 ? Math.round(total / kWhConsumidos) : 0,
  };
}

/**
 * Simulación con el catálogo histórico de agua, sin validar aplicabilidad.
 */
export interface DesgloseBoletaAgua {
  cargoFijo: number;
  agua: number;
  alcantarillado: number;
  sobreconsumo: number;
  total: number;
  precioPromedioM3: number;
}

export function calcularBoletaEsperadaAgua(
  claveSanitaria: string,
  m3Consumidos: number,
  m3LimitePunta: number = 0,
  esPeriodoPunta: boolean = false,
): DesgloseBoletaAgua | null {
  const t = TARIFAS_AGUA_2026[claveSanitaria];
  if (!t || t.cargoFijoCLP == null || t.alcantarilladoCLPM3 == null ||
      t.sobreconsumoPuntaCLPM3 == null ||
      !Number.isFinite(m3Consumidos) || m3Consumidos < 0 ||
      !Number.isFinite(m3LimitePunta) || m3LimitePunta < 0) return null;

  const cargoFijo = t.cargoFijoCLP;
  const precioAgua = esPeriodoPunta ? t.aguaPotablePuntaCLPM3 : t.aguaPotableNoPuntaCLPM3;
  if (precioAgua == null || ![cargoFijo, precioAgua, t.alcantarilladoCLPM3,
    t.sobreconsumoPuntaCLPM3].every((value) => Number.isFinite(value) && value >= 0)) return null;
  // Sin límite conocido no inferir sobreconsumo ni cobrar dos veces el volumen.
  const aplicaLimite = esPeriodoPunta && m3LimitePunta > 0;
  const m3Normal = aplicaLimite ? Math.min(m3Consumidos, m3LimitePunta) : m3Consumidos;
  const m3Sobre = aplicaLimite ? Math.max(0, m3Consumidos - m3LimitePunta) : 0;

  const agua = precioAgua * m3Normal;
  const sobreconsumo = t.sobreconsumoPuntaCLPM3 * m3Sobre;
  const alcantarillado = t.alcantarilladoCLPM3 * m3Consumidos;
  const total = cargoFijo + agua + alcantarillado + sobreconsumo;

  return {
    cargoFijo: Math.round(cargoFijo),
    agua: Math.round(agua),
    alcantarillado: Math.round(alcantarillado),
    sobreconsumo: Math.round(sobreconsumo),
    total: Math.round(total),
    precioPromedioM3: m3Consumidos > 0 ? Math.round(total / m3Consumidos) : 0,
  };
}

/**
 * Promedia las entradas históricas del catálogo; no es una cotización actual.
 */
export function getPrecioCilindroGas(
  formato: TarifaGasCilindro['formato'],
  region: string = 'RM',
): { promedioCLP: number; rangoMin: number; rangoMax: number } | null {
  const matches = TARIFAS_GAS_CILINDROS_2026.filter(
    (t) => t.formato === formato && t.region.toUpperCase() === region.toUpperCase(),
  );
  if (matches.length === 0) return null;
  const promedio = matches.reduce((s, t) => s + t.precioPromedioCLP, 0) / matches.length;
  const rangoMin = Math.min(...matches.map((t) => t.precioMinCLP));
  const rangoMax = Math.max(...matches.map((t) => t.precioMaxCLP));
  return {
    promedioCLP: Math.round(promedio),
    rangoMin,
    rangoMax,
  };
}

/**
 * Compara un cobro real contra el rango esperado.
 * Comparación aritmética: el llamador debe acreditar la aplicabilidad de la referencia.
 */
export interface ResultadoValidacion {
  estaDentroDelRango: boolean;
  desviacionPct: number; // % de desviación del valor real vs esperado
  alerta: 'ok' | 'sospechoso' | 'diferencia_alta' | 'diferencia_a_favor' | 'sin_referencia';
  mensaje: string;
}

export function validarCobro(
  valorReal: number,
  valorEsperado: number,
  toleranciaPct: number = 5,
): ResultadoValidacion {
  if (!Number.isFinite(valorReal) || !Number.isFinite(valorEsperado) ||
      !Number.isFinite(toleranciaPct) || toleranciaPct < 0 || valorEsperado <= 0) {
    return {
      estaDentroDelRango: false,
      desviacionPct: 0,
      alerta: 'sin_referencia',
      mensaje: 'No hay valor esperado o datos válidos para comparar este cobro.',
    };
  }
  const desviacionPct = ((valorReal - valorEsperado) / valorEsperado) * 100;
  const absDesviacion = Math.abs(desviacionPct);
  if (absDesviacion <= toleranciaPct) {
    return {
      estaDentroDelRango: true,
      desviacionPct,
      alerta: 'ok',
      mensaje: `El cobro está dentro del rango esperado (±${toleranciaPct}%).`,
    };
  }
  if (desviacionPct < 0) {
    return {
      estaDentroDelRango: false,
      desviacionPct,
      alerta: 'diferencia_a_favor',
      mensaje: `El cobro está bajo la referencia en ${absDesviacion.toFixed(1)}%. No indica un sobrecobro.`,
    };
  }
  if (absDesviacion <= 20) {
    return {
      estaDentroDelRango: false,
      desviacionPct,
      alerta: 'sospechoso',
      mensaje: `El cobro está ${desviacionPct > 0 ? 'sobre' : 'bajo'} lo esperado en ${absDesviacion.toFixed(1)}%. Revisar boleta.`,
    };
  }
  return {
    estaDentroDelRango: false,
    desviacionPct,
    alerta: 'diferencia_alta',
    mensaje: `El cobro está ${desviacionPct > 0 ? 'sobre' : 'bajo'} lo esperado en ${absDesviacion.toFixed(1)}%. Confirma período, zona, impuestos y tarifa antes de concluir que existe un error.`,
  };
}

// ============================================================================
// METADATA
// ============================================================================

export const TARIFAS_METADATA = {
  ultimaActualizacion: '2026-05-06',
  revisionDeAlcance: '2026-09-25',
  estado: 'historico_no_verificado',
  uso: 'simulacion',
  vigenciaHasta: null,
  version: '0.2.0',
  fuentesConsultadas: [
    'https://www.cge.cl/informacion-comercial/tarifas-y-procesos-tarifarios/tarifa-de-suministro/',
    'https://www.enel.cl/es/personas/informacion-util/tarifas-y-regulacion.html',
    'https://www.chilquinta.cl/informacion-de-interes/tarifas-vigentes',
    'https://www.gruposaesa.cl/saesa/tarifas-vigentes',
    'https://www.gruposaesa.cl/frontel/tarifas-vigentes',
    'https://www.siss.gob.cl/',
    'https://www.aguasandinas.cl/web/aguasandinas/tarifas',
    'https://www.metrogas.cl/tarifas',
    'https://www.sec.cl/precios-de-combustibles/',
  ],
  pendientes: [
    'Archivar y cotejar fuentes oficiales por componente (importes no revalidados)',
    'Acreditar vigencia completa, zona/red/grupo, opción, temporada e impuestos antes de comparar',
    'Parsear todas las comunas RM de Enel (33 comunas × 6 áreas × 4 redes)',
    'Parsear Chilquinta completo por comuna',
    'Descargar XLSX más reciente de SAESA y Frontel',
    'Completar tarifas Esval, ESSBio, Nuevosur, SMAPA, Aguas del Valle',
    'Scrape tabla residencial Metrogas (BCR-01)',
    'Mapeo comuna → distribuidora eléctrica (clave para parser de boletas)',
    'Mapeo comuna → sanitaria',
    'Tabla histórica para validar tendencia de subidas',
  ],
} as const;
