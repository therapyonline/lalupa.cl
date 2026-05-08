/**
 * Datos legales de empresas de servicios básicos en Chile
 *
 * Fuentes verificadas: CMF Chile (Comisión para el Mercado Financiero),
 * sitios oficiales de cada empresa, Memorias Anuales 2023-2024.
 *
 * ÚLTIMA ACTUALIZACIÓN: 2026-05-08 (RUTs SAESA/Frontel/Esval/Nuevosur/Abastible/Gasco GLP verificados con boletas oficiales)
 * PRÓXIMA REVISIÓN: 2026-11-06 (anual)
 *
 * Uso: pre-rellenar formulario de reclamo SERNAC y wizards de la app.
 *
 * NOTA legal: estos datos son de registros públicos (CMF, Mercado Público,
 * sitios corporativos). Verificar vigencia antes de uso en producción.
 */

// ============================================================================
// TIPOS
// ============================================================================

export type ServicioEmpresa = 'electricidad' | 'agua' | 'gas' | 'internet' | 'telefonia';

export interface EmpresaServicio {
  /** Identificador interno (slug) */
  id: string;
  /** Nombre comercial */
  nombreComercial: string;
  /** Razón social legal */
  razonSocial: string;
  /** RUT formato 12.345.678-K */
  rut: string;
  /** Servicios que ofrece */
  servicios: ServicioEmpresa[];
  /** Dirección legal (para notificaciones) */
  direccion: string;
  /** Email para notificaciones legales (puede ser null si no es público) */
  emailNotificaciones: string | null;
  /** Teléfono atención al cliente */
  telefonoCliente: string;
  /** URL del formulario de reclamo de la propia empresa (si existe) */
  urlReclamosPropio: string | null;
  /** Sitio web oficial */
  sitioWeb: string;
  /** Fuente para verificación */
  fuenteVerificacion: string;
}

// ============================================================================
// DATASET
// ============================================================================

export const EMPRESAS_SERVICIOS: EmpresaServicio[] = [
  // ───────────── ELÉCTRICAS ─────────────
  {
    id: 'enel',
    nombreComercial: 'Enel Distribución Chile',
    razonSocial: 'ENEL DISTRIBUCION CHILE S.A.',
    rut: '96.800.570-7',
    servicios: ['electricidad'],
    direccion: 'Roger de Flor 2725, Of. 1001, Piso 10, Torre 2, Las Condes, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '600 696 0000', // verificar
    urlReclamosPropio: 'https://www.enel.cl/es/clientes/contacto/reclamos.html',
    sitioWeb: 'https://www.enel.cl',
    fuenteVerificacion: 'CMF Chile + boleta oficial',
  },
  {
    id: 'cge',
    nombreComercial: 'CGE',
    razonSocial: 'CGE S.A.',
    rut: '99.513.400-4',
    servicios: ['electricidad'],
    direccion: 'Avda. Presidente Riesco 5561, Piso 13, Las Condes, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '600 777 7777', // verificar
    urlReclamosPropio: 'https://www.cge.cl/contacto/',
    sitioWeb: 'https://www.cge.cl',
    fuenteVerificacion: 'CMF Chile (anteriormente CGE Distribución S.A.)',
  },
  {
    id: 'conafe',
    nombreComercial: 'CONAFE',
    razonSocial: 'COMPAÑÍA NACIONAL DE FUERZA ELÉCTRICA S.A.',
    rut: '91.143.000-2', // PENDIENTE verificar
    servicios: ['electricidad'],
    direccion: 'Verificar — subsidiaria de CGE',
    emailNotificaciones: null,
    telefonoCliente: 'PENDIENTE',
    urlReclamosPropio: null,
    sitioWeb: 'https://www.conafe.cl',
    fuenteVerificacion: 'PENDIENTE — verificar en CMF',
  },
  {
    id: 'chilquinta',
    nombreComercial: 'Chilquinta Energía',
    razonSocial: 'CHILQUINTA DISTRIBUCIÓN S.A.',
    rut: '96.813.520-1',
    servicios: ['electricidad'],
    direccion: 'Avda. Argentina 1, Valparaíso',
    emailNotificaciones: null,
    telefonoCliente: '600 600 9000', // verificar
    urlReclamosPropio: 'https://www.chilquinta.cl/servicio-al-cliente/reclamos',
    sitioWeb: 'https://www.chilquinta.cl',
    fuenteVerificacion: 'CMF Chile',
  },
  {
    id: 'saesa',
    nombreComercial: 'SAESA',
    razonSocial: 'SOCIEDAD AUSTRAL DE ELECTRICIDAD S.A.',
    rut: '96.544.470-3',
    servicios: ['electricidad'],
    direccion: 'Bilbao 441, Osorno',
    emailNotificaciones: null,
    telefonoCliente: '600 401 4000',
    urlReclamosPropio: 'https://web.gruposaesa.cl/web/saesa/contacto',
    sitioWeb: 'https://www.gruposaesa.cl/saesa',
    fuenteVerificacion: 'CMF Chile + boleta oficial Grupo SAESA',
  },
  {
    id: 'frontel',
    nombreComercial: 'Frontel',
    razonSocial: 'EMPRESA ELÉCTRICA DE LA FRONTERA S.A.',
    rut: '76.073.164-1',
    servicios: ['electricidad'],
    direccion: 'Bilbao 441, Osorno',
    emailNotificaciones: null,
    telefonoCliente: '600 401 4001',
    urlReclamosPropio: 'https://web.gruposaesa.cl/web/frontel/contacto',
    sitioWeb: 'https://www.gruposaesa.cl/frontel',
    fuenteVerificacion: 'CMF Chile + boleta oficial (gruposaesa.cl/documents/boleta-frontel.png)',
  },

  // ───────────── SANITARIAS ─────────────
  {
    id: 'aguas-andinas',
    nombreComercial: 'Aguas Andinas',
    razonSocial: 'AGUAS ANDINAS S.A.',
    rut: '61.808.000-5',
    servicios: ['agua'],
    direccion: 'Av. Presidente Balmaceda 1398, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '+56 2 2731 1000',
    urlReclamosPropio: 'https://www.aguasandinas.cl/web/aguasandinas/contactanos',
    sitioWeb: 'https://www.aguasandinas.cl',
    fuenteVerificacion: 'CMF Chile + boleta oficial',
  },
  {
    id: 'esval',
    nombreComercial: 'Esval',
    razonSocial: 'ESVAL S.A.',
    // RUT canónico en boleta oficial (jpg conoce-tu-boleta esval.cl).
    // Variante 76.000.957-1 vista en algunas fuentes; 90.158.000-3 era el RUT histórico.
    rut: '76.000.739-0',
    servicios: ['agua'],
    direccion: 'Cochrane 751, Valparaíso',
    emailNotificaciones: null,
    telefonoCliente: '600 600 6060',
    urlReclamosPropio: 'https://www.esval.cl/atencion-a-clientes/reclamos',
    sitioWeb: 'https://www.esval.cl',
    fuenteVerificacion: 'Boleta oficial Esval (esval.cl/conoce-tu-boleta)',
  },
  {
    id: 'essbio',
    nombreComercial: 'ESSBio',
    razonSocial: 'ESSBIO S.A.',
    rut: '76.833.300-9',
    servicios: ['agua'],
    direccion: 'Diagonal Pedro Aguirre Cerda 1129, Concepción',
    emailNotificaciones: null,
    telefonoCliente: '600 411 1234', // verificar
    urlReclamosPropio: 'https://www.essbio.cl/personas/contacto',
    sitioWeb: 'https://www.essbio.cl',
    fuenteVerificacion: 'CMF Chile',
  },
  {
    id: 'nuevosur',
    nombreComercial: 'Nuevosur',
    razonSocial: 'NUEVOSUR S.A.',
    rut: '96.963.440-6',
    servicios: ['agua'],
    direccion: 'Monte Baeza s/n, Talca',
    emailNotificaciones: null,
    telefonoCliente: '600 41 24001',
    urlReclamosPropio: 'https://www.nuevosur.cl/web/nuevosur/contacto',
    sitioWeb: 'https://www.nuevosur.cl',
    fuenteVerificacion: 'Boleta oficial Nuevosur (DEPEJE Conoce Tu Boleta-NUEVOSUR.pdf)',
  },
  {
    id: 'aguas-del-valle',
    nombreComercial: 'Aguas del Valle',
    razonSocial: 'AGUAS DEL VALLE S.A.',
    rut: 'PENDIENTE',
    servicios: ['agua'],
    direccion: 'PENDIENTE',
    emailNotificaciones: null,
    telefonoCliente: 'PENDIENTE',
    urlReclamosPropio: 'https://www.aguasdelvalle.cl/personas/atencion-cliente',
    sitioWeb: 'https://www.aguasdelvalle.cl',
    fuenteVerificacion: 'PENDIENTE',
  },
  {
    id: 'smapa',
    nombreComercial: 'SMAPA',
    razonSocial: 'SERVICIO MUNICIPAL DE AGUA POTABLE Y ALCANTARILLADO DE MAIPÚ',
    rut: 'No aplica (servicio municipal)',
    servicios: ['agua'],
    direccion: 'Av. Pajaritos 0240, Maipú',
    emailNotificaciones: null,
    telefonoCliente: '+56 2 2531 1500', // verificar
    urlReclamosPropio: 'https://www.smapa.cl/contacto',
    sitioWeb: 'https://www.smapa.cl',
    fuenteVerificacion: 'Único caso municipal grande en RM',
  },

  // ───────────── GAS ─────────────
  {
    id: 'metrogas',
    nombreComercial: 'Metrogas',
    razonSocial: 'METROGAS S.A.',
    rut: '96.722.460-K',
    servicios: ['gas'],
    direccion: 'PENDIENTE',
    emailNotificaciones: null,
    telefonoCliente: '+56 2 2337 8769',
    urlReclamosPropio: 'https://www.metrogas.cl/atencion/reclamos',
    sitioWeb: 'https://www.metrogas.cl',
    fuenteVerificacion: 'CMF Chile',
  },
  {
    id: 'lipigas',
    nombreComercial: 'Lipigas',
    razonSocial: 'EMPRESAS LIPIGAS S.A.',
    rut: '96.928.510-K',
    servicios: ['gas'],
    direccion: 'Apoquindo 5400, Piso 15, Las Condes, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '600 902 0202', // verificar
    urlReclamosPropio: 'https://www.lipigas.cl/contacto',
    sitioWeb: 'https://www.lipigas.cl',
    fuenteVerificacion: 'Memoria Anual Lipigas + CMF',
  },
  {
    id: 'abastible',
    nombreComercial: 'Abastible',
    razonSocial: 'ABASTIBLE S.A.',
    rut: '91.806.000-6',
    servicios: ['gas'],
    direccion: 'PENDIENTE',
    emailNotificaciones: null,
    telefonoCliente: '600 600 7799',
    urlReclamosPropio: 'https://www.abastible.cl/contacto',
    sitioWeb: 'https://www.abastible.cl',
    fuenteVerificacion: 'Boleta oficial Abastible (abastible.cl/medidor/tarifas-y-boletas)',
  },
  {
    id: 'gasco-glp',
    nombreComercial: 'Gasco GLP',
    // GASCO opera 2 razones sociales: Empresas Gasco S.A. (gas natural por
    // red, RUT 90.310.000-1) y Gasco GLP S.A. (cilindros). Acá el GLP.
    razonSocial: 'GASCO GLP S.A.',
    rut: '96.568.740-8',
    servicios: ['gas'],
    direccion: 'Santo Domingo 1061, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '600 600 7799',
    urlReclamosPropio: 'https://www.gasco.cl/contacto',
    sitioWeb: 'https://www.gasco.cl',
    fuenteVerificacion: 'CMF Chile + boleta tipo gasco.cl',
  },

  // ───────────── INTERNET / TELECOMUNICACIONES ─────────────
  {
    id: 'movistar-fija',
    nombreComercial: 'Movistar (Hogar)',
    razonSocial: 'TELEFÓNICA CHILE S.A.',
    rut: '90.635.000-9',
    servicios: ['internet', 'telefonia'],
    direccion: 'Avda. Providencia 111, Providencia, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '800 207 207',
    urlReclamosPropio: 'https://ww2.movistar.cl/atencion-cliente/reclamos',
    sitioWeb: 'https://ww2.movistar.cl',
    fuenteVerificacion: 'CMF Chile (Telefónica Chile S.A.)',
  },
  {
    id: 'movistar-movil',
    nombreComercial: 'Movistar (Móvil)',
    razonSocial: 'TELEFÓNICA MÓVILES CHILE S.A.',
    rut: '87.845.500-2',
    servicios: ['telefonia', 'internet'],
    direccion: 'Avda. Providencia 111, Providencia, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '800 207 207',
    urlReclamosPropio: 'https://ww2.movistar.cl/atencion-cliente/reclamos',
    sitioWeb: 'https://ww2.movistar.cl',
    fuenteVerificacion: 'CMF Chile',
  },
  {
    id: 'entel',
    nombreComercial: 'Entel',
    razonSocial: 'ENTEL CHILE S.A.', // verificar (puede ser ENTEL S.A.)
    rut: 'PENDIENTE',
    servicios: ['internet', 'telefonia'],
    direccion: 'Andrés Bello 2687, Las Condes, Santiago',
    emailNotificaciones: null,
    telefonoCliente: '103',
    urlReclamosPropio: 'https://www.entel.cl/personas/atencion-al-cliente',
    sitioWeb: 'https://www.entel.cl',
    fuenteVerificacion: 'PENDIENTE',
  },
  {
    id: 'vtr',
    nombreComercial: 'VTR',
    razonSocial: 'VTR COMUNICACIONES SpA', // verificar
    rut: 'PENDIENTE',
    servicios: ['internet', 'telefonia'],
    direccion: 'PENDIENTE',
    emailNotificaciones: null,
    telefonoCliente: '600 800 9000',
    urlReclamosPropio: 'https://www.vtr.com/atencion-cliente/reclamos',
    sitioWeb: 'https://www.vtr.com',
    fuenteVerificacion: 'PENDIENTE',
  },
  {
    id: 'wom',
    nombreComercial: 'WOM',
    razonSocial: 'WOM S.A.', // verificar
    rut: 'PENDIENTE',
    servicios: ['internet', 'telefonia'],
    direccion: 'PENDIENTE',
    emailNotificaciones: null,
    telefonoCliente: '600 600 0966',
    urlReclamosPropio: 'https://www.wom.cl/personas/atencion-al-cliente',
    sitioWeb: 'https://www.wom.cl',
    fuenteVerificacion: 'PENDIENTE',
  },
  {
    id: 'claro',
    nombreComercial: 'Claro',
    razonSocial: 'CLARO CHILE S.A.', // verificar
    rut: 'PENDIENTE',
    servicios: ['internet', 'telefonia'],
    direccion: 'PENDIENTE',
    emailNotificaciones: null,
    telefonoCliente: '103 desde móvil Claro / 600 600 1234',
    urlReclamosPropio: 'https://www.clarochile.cl/personas/atencion-al-cliente',
    sitioWeb: 'https://www.clarochile.cl',
    fuenteVerificacion: 'PENDIENTE',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getEmpresa(id: string): EmpresaServicio | null {
  return EMPRESAS_SERVICIOS.find((e) => e.id === id) ?? null;
}

export function getEmpresaPorRut(rut: string): EmpresaServicio | null {
  // Normalizar RUT (quitar puntos y guiones)
  const normalize = (r: string) => r.replace(/[.-]/g, '').toUpperCase();
  const rNorm = normalize(rut);
  return EMPRESAS_SERVICIOS.find((e) => normalize(e.rut) === rNorm) ?? null;
}

export function getEmpresasPorServicio(servicio: ServicioEmpresa): EmpresaServicio[] {
  return EMPRESAS_SERVICIOS.filter((e) => e.servicios.includes(servicio));
}

export function buscarEmpresa(query: string): EmpresaServicio[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return EMPRESAS_SERVICIOS.filter(
    (e) =>
      e.nombreComercial.toLowerCase().includes(q) ||
      e.razonSocial.toLowerCase().includes(q) ||
      e.id.includes(q),
  );
}

// ============================================================================
// METADATA
// ============================================================================

export const EMPRESAS_METADATA = {
  version: '0.1.0',
  ultimaActualizacion: '2026-05-08',
  proximaRevision: '2026-11-06',
  totalEmpresas: EMPRESAS_SERVICIOS.length,
  empresasConRutVerificado: EMPRESAS_SERVICIOS.filter((e) => !e.rut.includes('PENDIENTE')).length,
  empresasPendientes: EMPRESAS_SERVICIOS.filter((e) => e.rut.includes('PENDIENTE')).map((e) => e.id),
  fuentesPrimarias: [
    'https://www.cmfchile.cl/ (Comisión para el Mercado Financiero)',
    'Memorias Anuales 2023-2024 publicadas en cada sitio corporativo',
    'Boletas oficiales descargadas en /research/02-boletas-reales/ejemplos-publicos/',
  ],
} as const;
