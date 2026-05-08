/**
 * Calendario de feriados oficiales y helpers de días hábiles, Chile
 *
 * Fuente: https://www.feriados.cl/ (sitio reconocido de feriados Chile)
 * Marco legal: Ley 2.977, Ley 19.668, Ley 20.148, Ley 21.357 (Pueblos Indígenas)
 *
 * ÚLTIMA ACTUALIZACIÓN: 2026-05-06
 * PRÓXIMA REVISIÓN: 2026-12-15 (para agregar feriados 2027 y ajustes de fin de año)
 *
 * Uso: cálculo de plazos legales (ej: 18 días hábiles SERNAC, 22 jun 2026
 * para "estar al día" del subsidio, etc.).
 */

// ============================================================================
// TIPOS
// ============================================================================

export type TipoFeriado = 'civil' | 'religioso';
export type AlcanceFeriado = 'nacional' | 'regional';

export interface Feriado {
  fecha: string; // ISO YYYY-MM-DD
  nombre: string;
  tipo: TipoFeriado;
  alcance: AlcanceFeriado;
  /** Si es regional, qué región/comunas aplica */
  aplicaA?: string;
  /** Norma legal que lo establece */
  ley?: string;
  /** Si es irrenunciable (comercio cerrado, art. 169 Código del Trabajo) */
  irrenunciable?: boolean;
}

// ============================================================================
// FERIADOS 2026
// ============================================================================

export const FERIADOS_CHILE_2026: Feriado[] = [
  { fecha: '2026-01-01', nombre: 'Año Nuevo', tipo: 'civil', alcance: 'nacional', ley: 'Ley 2.977', irrenunciable: true },
  { fecha: '2026-04-03', nombre: 'Viernes Santo', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 2.977' },
  { fecha: '2026-04-04', nombre: 'Sábado Santo', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 2.977' },
  { fecha: '2026-05-01', nombre: 'Día Nacional del Trabajo', tipo: 'civil', alcance: 'nacional', irrenunciable: true },
  { fecha: '2026-05-21', nombre: 'Día de las Glorias Navales', tipo: 'civil', alcance: 'nacional', ley: 'Ley 2.977' },
  { fecha: '2026-06-07', nombre: 'Asalto y Toma del Morro de Arica', tipo: 'civil', alcance: 'regional', aplicaA: 'Región de Arica y Parinacota', ley: 'Ley 20.663' },
  { fecha: '2026-06-21', nombre: 'Día Nacional de los Pueblos Indígenas', tipo: 'civil', alcance: 'nacional', ley: 'Ley 21.357' },
  { fecha: '2026-06-29', nombre: 'San Pedro y San Pablo', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 2.977 / 18.432 / 19.668' },
  { fecha: '2026-07-16', nombre: 'Día de la Virgen del Carmen', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 20.148' },
  { fecha: '2026-08-15', nombre: 'Asunción de la Virgen', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 2.977' },
  { fecha: '2026-08-20', nombre: 'Nacimiento del Prócer de la Independencia (Bdo. O\'Higgins)', tipo: 'civil', alcance: 'regional', aplicaA: 'Comunas de Chillán y Chillán Viejo', ley: 'Ley 16.535 / 20.768' },
  { fecha: '2026-09-18', nombre: 'Independencia Nacional', tipo: 'civil', alcance: 'nacional', irrenunciable: true },
  { fecha: '2026-09-19', nombre: 'Día de las Glorias del Ejército', tipo: 'civil', alcance: 'nacional', irrenunciable: true },
  { fecha: '2026-10-12', nombre: 'Encuentro de Dos Mundos', tipo: 'civil', alcance: 'nacional', ley: 'Ley 3.810 / 19.668' },
  { fecha: '2026-10-31', nombre: 'Día de las Iglesias Evangélicas y Protestantes', tipo: 'religioso', alcance: 'nacional' },
  { fecha: '2026-11-01', nombre: 'Día de Todos los Santos', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 2.977' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción', tipo: 'religioso', alcance: 'nacional', ley: 'Ley 2.977' },
  { fecha: '2026-12-25', nombre: 'Navidad', tipo: 'religioso', alcance: 'nacional', irrenunciable: true },
];

/**
 * Set de fechas ISO para lookup rápido (solo nacionales).
 * Los feriados regionales no se cuentan como feriado para días hábiles
 * a nivel nacional; se manejan caso por caso.
 */
const SET_FERIADOS_NACIONALES_2026: Set<string> = new Set(
  FERIADOS_CHILE_2026.filter((f) => f.alcance === 'nacional').map((f) => f.fecha),
);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Devuelve true si la fecha dada es feriado nacional o fin de semana.
 * NO considera feriados regionales (Arica, Chillán) por defecto.
 */
export function esFeriadoOFinDeSemana(fecha: Date): boolean {
  const day = fecha.getDay(); // 0 = domingo, 6 = sábado
  if (day === 0 || day === 6) return true;
  const iso = toISO(fecha);
  return SET_FERIADOS_NACIONALES_2026.has(iso);
}

/** Día hábil = lunes a viernes y NO feriado nacional. */
export function esDiaHabil(fecha: Date): boolean {
  return !esFeriadoOFinDeSemana(fecha);
}

/** Devuelve el siguiente día hábil estricto (no incluye `fecha`). */
export function siguienteDiaHabil(fecha: Date): Date {
  const next = addDays(fecha, 1);
  while (!esDiaHabil(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/** Suma `n` días hábiles a partir de `fecha` (excluyendo `fecha`). */
export function sumarDiasHabiles(fecha: Date, n: number): Date {
  if (n <= 0) return new Date(fecha);
  let resultado = new Date(fecha);
  let restantes = n;
  while (restantes > 0) {
    resultado = addDays(resultado, 1);
    if (esDiaHabil(resultado)) restantes--;
  }
  return resultado;
}

/** Cuenta cuántos días hábiles hay entre dos fechas (excluyendo la inicial, incluyendo la final si es hábil). */
export function diasHabilesEntre(desde: Date, hasta: Date): number {
  if (hasta <= desde) return 0;
  let count = 0;
  let cursor = addDays(desde, 1);
  while (cursor <= hasta) {
    if (esDiaHabil(cursor)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}

/** Devuelve el feriado correspondiente a una fecha (o null). */
export function getFeriado(fecha: Date): Feriado | null {
  const iso = toISO(fecha);
  return FERIADOS_CHILE_2026.find((f) => f.fecha === iso) ?? null;
}

// ============================================================================
// UTILIDADES INTERNAS
// ============================================================================

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ============================================================================
// METADATA
// ============================================================================

export const CALENDARIO_METADATA = {
  version: '0.1.0',
  ano: 2026,
  ultimaActualizacion: '2026-05-06',
  proximaRevision: '2026-12-15', // agregar feriados 2027
  totalFeriados2026: FERIADOS_CHILE_2026.length,
  feriadosNacionales: FERIADOS_CHILE_2026.filter((f) => f.alcance === 'nacional').length,
  feriadosRegionales: FERIADOS_CHILE_2026.filter((f) => f.alcance === 'regional').length,
  feriadosIrrenunciables: FERIADOS_CHILE_2026.filter((f) => f.irrenunciable).length,
  fuente: 'https://www.feriados.cl/',
} as const;

// ============================================================================
// TESTS UNITARIOS
// ============================================================================

export const TEST_CASES = {
  /** Caso 1: feriado en miércoles (Inmaculada Concepción 8 dic 2026 = martes) */
  feriadoEnDiaSemana: {
    input: new Date('2026-12-08'),
    expected: { esHabil: false, esFeriado: true, nombre: 'Inmaculada Concepción' },
  },
  /** Caso 2: día hábil normal (un martes cualquiera) */
  diaHabilNormal: {
    input: new Date('2026-05-12'), // martes
    expected: { esHabil: true, esFeriado: false },
  },
  /** Caso 3: sábado */
  sabado: {
    input: new Date('2026-05-09'), // sábado
    expected: { esHabil: false },
  },
  /** Caso 4: feriado en sábado no afecta días hábiles (Sábado Santo 4 abr 2026) */
  feriadoEnSabado: {
    input: new Date('2026-04-04'),
    expected: { esHabil: false }, // ya era no hábil por ser sábado
  },
  /** Caso 5: 18 días hábiles desde 6 mayo 2026 (plazo SERNAC) */
  plazoSernacDesde6Mayo: {
    fechaInicio: new Date('2026-05-06'),
    diasHabiles: 18,
    fechaEsperadaISO: '2026-06-01', // calcular manualmente
  },
  /** Caso 6: 10 días hábiles cruzando feriado del 21 de mayo */
  plazo10DiasHabilesCruzandoFeriado: {
    fechaInicio: new Date('2026-05-15'), // viernes
    diasHabiles: 10,
    fechaEsperadaISO: '2026-05-29', // 18,19,20,22,25,26,27,28,29 (saltando 21=feriado, 23/24=fds)
  },
};
