/**
 * Planes de Internet Hogar Chile, Mayo 2026
 *
 * DATOS REFERENCIALES, última actualización 2026-05-06
 * Verificar antes de usar en producción contra páginas oficiales.
 * No hay API pública unificada; el dataset se actualiza manualmente.
 *
 * Fuentes: páginas oficiales de cada empresa + Google snippets a 2026-05-06
 */

// ============================================================================
// TIPOS
// ============================================================================

export type Tecnologia = 'fibra' | 'cable' | 'inalambrica' | '5g';
export type ServicioIncluido = 'internet' | 'tv' | 'telefonia' | 'streaming';

export interface PlanInternet {
  id: string;
  empresa: string;
  plan: string;
  velocidad: { bajada: number; subida: number }; // Mbps
  tecnologia: Tecnologia;
  precio: {
    mes1a12: number;
    mes13plus: number; // post-promoción
  };
  promoDuraMeses: number; // duración de la promo (Movistar = 6, resto típico = 12)
  compromisoMeses: number; // 0 = sin compromiso
  servicios: ServicioIncluido[];
  coberturaRegiones: string[]; // o ['nacional']
  alertas: string[];
  fuente: string;
}

// ============================================================================
// DATASET
// ============================================================================

export const PLANES_INTERNET_2026: PlanInternet[] = [
  // ───────── WOM HOGAR ─────────
  {
    id: 'wom-fibra-600',
    empresa: 'WOM',
    plan: 'Fibra 600',
    velocidad: { bajada: 600, subida: 600 },
    tecnologia: 'fibra',
    precio: { mes1a12: 9990, mes13plus: 21990 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'], // verificar factibilidad
    alertas: ['Precio sube +120% al mes 13.', 'Cobertura limitada en zonas rurales.'],
    fuente: 'https://www.wom.cl/hogar/internet/',
  },
  {
    id: 'wom-fibra-800',
    empresa: 'WOM',
    plan: 'Fibra 800',
    velocidad: { bajada: 800, subida: 800 },
    tecnologia: 'fibra',
    precio: { mes1a12: 13990, mes13plus: 24000 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: ['Precio post-promo estimado.'],
    fuente: 'https://www.wom.cl/hogar/internet/',
  },
  {
    id: 'wom-fibra-940',
    empresa: 'WOM',
    plan: 'Fibra 940',
    velocidad: { bajada: 940, subida: 940 },
    tecnologia: 'fibra',
    precio: { mes1a12: 15990, mes13plus: 26000 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: ['Precio post-promo estimado.'],
    fuente: 'https://www.wom.cl/hogar/internet/',
  },

  // ───────── ENTEL HOGAR ─────────
  {
    id: 'entel-fibra-600',
    empresa: 'Entel',
    plan: 'Fibra 600 con WiFi 6',
    velocidad: { bajada: 600, subida: 600 },
    tecnologia: 'fibra',
    precio: { mes1a12: 13990, mes13plus: 22990 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: ['Incluye Club Entel.'],
    fuente: 'https://www.entel.cl/hogar/',
  },
  {
    id: 'entel-fibra-800',
    empresa: 'Entel',
    plan: 'Fibra 800 con WiFi 6',
    velocidad: { bajada: 800, subida: 800 },
    tecnologia: 'fibra',
    precio: { mes1a12: 18990, mes13plus: 28000 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: ['Precio post-promo estimado.'],
    fuente: 'https://www.entel.cl/hogar/',
  },

  // ───────── MOVISTAR HOGAR ─────────
  {
    id: 'movistar-fibra-600',
    empresa: 'Movistar',
    plan: 'Fibra 600',
    velocidad: { bajada: 600, subida: 600 },
    tecnologia: 'fibra',
    precio: { mes1a12: 14990, mes13plus: 22990 },
    promoDuraMeses: 6, // ⚠️ Movistar tiene la promo más corta
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: [
      'Promoción solo dura 6 meses (la más corta del mercado).',
      'Repetidor WiFi NO incluido, costo adicional $2.990/mes.',
    ],
    fuente: 'https://ww2.movistar.cl/hogar/',
  },
  {
    id: 'movistar-fibra-800',
    empresa: 'Movistar',
    plan: 'Fibra 800',
    velocidad: { bajada: 800, subida: 800 },
    tecnologia: 'fibra',
    precio: { mes1a12: 15990, mes13plus: 27990 },
    promoDuraMeses: 6,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: [
      'Promoción solo 6 meses.',
      'Precio sube +75% al terminar la promoción.',
      'Repetidor WiFi NO incluido.',
    ],
    fuente: 'https://ww2.movistar.cl/hogar/',
  },
  {
    id: 'movistar-fibra-940',
    empresa: 'Movistar',
    plan: 'Fibra 940',
    velocidad: { bajada: 940, subida: 940 },
    tecnologia: 'fibra',
    precio: { mes1a12: 16990, mes13plus: 30000 },
    promoDuraMeses: 6,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: [
      'Promoción solo 6 meses.',
      'Precio post-promo estimado.',
      'Repetidor WiFi NO incluido.',
    ],
    fuente: 'https://ww2.movistar.cl/hogar/',
  },

  // ───────── MUNDO ─────────
  {
    id: 'mundo-fibra-1g',
    empresa: 'Mundo',
    plan: 'Fibra 1 Giga',
    velocidad: { bajada: 1000, subida: 1000 },
    tecnologia: 'fibra',
    precio: { mes1a12: 14990, mes13plus: 21990 },
    promoDuraMeses: 12,
    compromisoMeses: 24, // ⚠️ Mundo tiene 24 meses de compromiso
    servicios: ['internet'],
    coberturaRegiones: ['nacional'], // limitada en algunas zonas
    alertas: [
      '⚠️ Compromiso 24 meses, multa por término anticipado.',
      'Precio escalado: $14.990 (mes 4-12) → $15.990 (mes 13-24) → $21.990 (mes 25+).',
      'Promoción inicial de 3 meses puede tener precio aún menor.',
    ],
    fuente: 'https://www.mundo.cl/personas/',
  },

  // ───────── GTD ─────────
  {
    id: 'gtd-doblepack-600',
    empresa: 'GTD',
    plan: 'Doble Pack Fibra 600 + GTD TV',
    velocidad: { bajada: 600, subida: 600 },
    tecnologia: 'fibra',
    precio: { mes1a12: 20980, mes13plus: 28000 },
    promoDuraMeses: 12,
    compromisoMeses: 12,
    servicios: ['internet', 'tv'],
    coberturaRegiones: ['nacional'],
    alertas: ['Incluye 86 canales TV nacional.', 'Precio post-promo estimado.'],
    fuente: 'https://www.gtd.cl/hogar/',
  },

  // ───────── CLARO ─────────
  {
    id: 'claro-internet-600',
    empresa: 'Claro',
    plan: 'Solo Internet 600',
    velocidad: { bajada: 600, subida: 600 },
    tecnologia: 'fibra',
    precio: { mes1a12: 14990, mes13plus: 22000 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: ['Incluye apps Claro Video.'],
    fuente: 'https://www.clarochile.cl/personas/internet/',
  },
  {
    id: 'claro-doblepack-600',
    empresa: 'Claro',
    plan: 'Doble Pack Internet 600 + TV HD',
    velocidad: { bajada: 600, subida: 600 },
    tecnologia: 'fibra',
    precio: { mes1a12: 26990, mes13plus: 36990 },
    promoDuraMeses: 12,
    compromisoMeses: 0,
    servicios: ['internet', 'tv', 'streaming'],
    coberturaRegiones: ['nacional'],
    alertas: ['Precio sube +37% al terminar la promoción.'],
    fuente: 'https://www.clarochile.cl/personas/',
  },

  // ───────── VTR / DIRECTV ─────────
  // PENDIENTE: precios reales requieren ingresar dirección en vtr.com.
  // Los valores acá son estimaciones conservadoras basadas en rangos
  // públicos. Validar antes de cada release.
  {
    id: 'vtr-internet-600',
    empresa: 'VTR',
    plan: 'Internet 600 (VTR/DirecTV)',
    velocidad: { bajada: 600, subida: 100 },
    tecnologia: 'cable',
    precio: { mes1a12: 19990, mes13plus: 28990 },
    promoDuraMeses: 12,
    compromisoMeses: 18,
    servicios: ['internet'],
    coberturaRegiones: ['nacional'],
    alertas: [
      'Disponibilidad limitada por comuna, verificar factibilidad técnica.',
      'Subida asimétrica (cable, no fibra simétrica).',
      'Datos referenciales (verificar precios actuales en vtr.com).',
    ],
    fuente: 'https://www.vtr.com/personas/internet',
  },
  {
    id: 'vtr-triple-pack',
    empresa: 'VTR',
    plan: 'Triple Pack Internet + TV + Telefonía',
    velocidad: { bajada: 600, subida: 100 },
    tecnologia: 'cable',
    precio: { mes1a12: 29990, mes13plus: 41990 },
    promoDuraMeses: 12,
    compromisoMeses: 18,
    servicios: ['internet', 'tv', 'telefonia'],
    coberturaRegiones: ['nacional'],
    alertas: [
      'Disponibilidad limitada por comuna.',
      'Requiere TV digital adicional para el receptor.',
      'Datos referenciales.',
    ],
    fuente: 'https://www.vtr.com/personas/triple-pack',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export interface CriteriosBusqueda {
  velocidadMin?: number; // Mbps mínimos requeridos
  presupuestoMaxPromo?: number; // CLP máximos precio promo
  presupuestoMaxPostPromo?: number; // CLP máximos precio post-promo
  region?: string; // 'nacional' o nombre de región
  servicios?: ServicioIncluido[]; // requerimientos
  evitarCompromisoLargo?: boolean; // si true, excluir planes con compromiso >12 meses
}

export interface PlanScored extends PlanInternet {
  score: number; // 0-100
  motivosScore: string[];
}

/**
 * Compara y ordena planes según los criterios. Retorna los planes con score
 * (más alto = mejor match).
 */
export function compararPlanes(criterios: CriteriosBusqueda): PlanScored[] {
  return PLANES_INTERNET_2026
    .filter((plan) => {
      // Filtros duros
      if (criterios.velocidadMin && plan.velocidad.bajada < criterios.velocidadMin) return false;
      if (criterios.presupuestoMaxPromo && plan.precio.mes1a12 > criterios.presupuestoMaxPromo) return false;
      if (criterios.presupuestoMaxPostPromo && plan.precio.mes13plus > criterios.presupuestoMaxPostPromo) return false;
      if (criterios.evitarCompromisoLargo && plan.compromisoMeses > 12) return false;
      if (criterios.servicios?.length) {
        for (const s of criterios.servicios) {
          if (!plan.servicios.includes(s)) return false;
        }
      }
      if (criterios.region && criterios.region !== 'nacional') {
        if (!plan.coberturaRegiones.includes('nacional') && !plan.coberturaRegiones.includes(criterios.region)) {
          return false;
        }
      }
      return true;
    })
    .map((plan) => {
      const motivos: string[] = [];
      let score = 0;

      // 30%, precio dentro del presupuesto (más bajo = mejor)
      if (criterios.presupuestoMaxPromo) {
        const ratio = plan.precio.mes1a12 / criterios.presupuestoMaxPromo;
        const subscore = Math.round((1 - Math.min(ratio, 1)) * 30);
        score += subscore;
        if (subscore >= 20) motivos.push(`Precio promo ${plan.precio.mes1a12} CLP, ${Math.round(ratio * 100)}% de tu presupuesto.`);
      } else {
        score += 15; // neutral
      }

      // 30%, velocidad cumple/supera mínimo
      if (criterios.velocidadMin) {
        const exceso = plan.velocidad.bajada / criterios.velocidadMin;
        const subscore = Math.round(Math.min(exceso, 2) * 15); // hasta 30 puntos si dobla la velocidad
        score += subscore;
        if (subscore >= 25) motivos.push(`Velocidad ${plan.velocidad.bajada} Mbps supera tu mínimo de ${criterios.velocidadMin}.`);
      } else {
        score += 15;
      }

      // 20%, pocas alertas (precio estable)
      const subscoreAlertas = Math.max(0, 20 - plan.alertas.length * 5);
      score += subscoreAlertas;
      if (plan.alertas.length === 0) motivos.push('Sin alertas de letra chica.');

      // 20%, match exacto de servicios
      if (criterios.servicios?.length) {
        const cumpleTodos = criterios.servicios.every((s) => plan.servicios.includes(s));
        score += cumpleTodos ? 20 : 0;
        if (cumpleTodos) motivos.push('Incluye todos los servicios solicitados.');
      } else {
        score += 10;
      }

      return { ...plan, score, motivosScore: motivos };
    })
    .sort((a, b) => b.score - a.score);
}

export function calcularCostoTotal12Meses(plan: PlanInternet): number {
  const mesesPromo = Math.min(plan.promoDuraMeses, 12);
  const mesesPostPromo = 12 - mesesPromo;
  return mesesPromo * plan.precio.mes1a12 + mesesPostPromo * plan.precio.mes13plus;
}

export function calcularCostoTotal24Meses(plan: PlanInternet): number {
  const mesesPromo = Math.min(plan.promoDuraMeses, 24);
  const mesesPostPromo = 24 - mesesPromo;
  return mesesPromo * plan.precio.mes1a12 + mesesPostPromo * plan.precio.mes13plus;
}

/**
 * Devuelve el "costo verdadero" promedio mensual normalizado a 24 meses.
 * Útil para comparar planes con promociones de duración distinta.
 */
export function costoVerdaderoPromedioMensual(plan: PlanInternet): number {
  return Math.round(calcularCostoTotal24Meses(plan) / 24);
}

// ============================================================================
// METADATA
// ============================================================================

export const INTERNET_PLANES_METADATA = {
  version: '0.1.0',
  ultimaActualizacion: '2026-05-06',
  proximaRevision: '2026-07-06', // bimestral
  totalPlanes: PLANES_INTERNET_2026.length,
  empresasCubiertas: ['WOM', 'Entel', 'Movistar', 'Mundo', 'GTD', 'Claro'],
  empresasPendientes: ['VTR', 'Pacífico Cable', 'DirecTV'],
  notasActualizacion: [
    'Verificar precios en sitios oficiales antes de cada release.',
    'Promociones cambian en cyber/cyberday. Considerar dataset estacional.',
    'VTR/Pacífico requieren ingresar dirección, complejo de scrapear.',
  ],
} as const;
