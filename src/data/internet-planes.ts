import type { PlanInternet } from '@/lib/internet/comparacion'

/** Observaciones editoriales, no cotizaciones ni catálogo completo del mercado. */
export const INTERNET_REVISION = '2026-09-26'
const wom = 'https://store.wom.cl/hogar/internet-hogar/'
const movistar = 'https://ww2.movistar.cl/hogar/internet-hogar/'
const mundo = 'https://www.tumundo.cl/hogar/1-mundo/'
const gtd =
  'https://www.gtd.cl/hogar/productos-hogar/internet-fibra-optica/internet-hogar-giga'
const base = {
  tecnologia: 'Fibra (FTTH)',
  observadaEl: INTERNET_REVISION,
  revisarEl: '2026-10-26',
  instalacionCLP: 0,
} as const

export const PLANES_INTERNET: readonly PlanInternet[] = [
  {
    ...base,
    id: 'mundo-800',
    empresa: 'Mundo',
    nombre: 'Plan 1 Mundo 800',
    bajadaMbps: 800,
    subidaMbps: 800,
    servicios: ['internet'],
    tramos: [
      { desde: 1, hasta: 3, mensualCLP: 12990 },
      { desde: 4, hasta: 12, mensualCLP: 14990 },
      { desde: 13, hasta: 24, mensualCLP: 15990 },
      { desde: 25, hasta: null, mensualCLP: 21990 },
    ],
    instalacionCLP: null,
    ofertaHasta: '2026-09-30',
    fuente: mundo,
    condiciones:
      'Nuevas contrataciones sujetas a factibilidad y reajuste anual por IPC. La fuente consultada no permite confirmar el cargo de instalación; pide una cotización completa.',
  },
  {
    ...base,
    id: 'wom-600',
    empresa: 'WOM',
    nombre: 'Fibra 600',
    bajadaMbps: 600,
    subidaMbps: 600,
    servicios: ['internet'],
    tramos: [
      { desde: 1, hasta: 12, mensualCLP: 11990 },
      { desde: 13, hasta: null, mensualCLP: 21990 },
    ],
    ofertaHasta: '2026-09-28',
    fuente: wom,
    condiciones:
      'Oferta flash publicada para el 15 al 28 de septiembre. Instalación sin costo; extensor opcional no incluido en la proyección.',
  },
  {
    ...base,
    id: 'wom-800',
    empresa: 'WOM',
    nombre: 'Fibra 800',
    bajadaMbps: 800,
    subidaMbps: 800,
    servicios: ['internet'],
    tramos: [
      { desde: 1, hasta: 12, mensualCLP: 14990 },
      { desde: 13, hasta: null, mensualCLP: 24990 },
    ],
    ofertaHasta: '2026-09-28',
    fuente: wom,
    condiciones:
      'Oferta publicada hasta el 28 de septiembre. Instalación sin costo; extensor opcional no incluido en la proyección.',
  },
  {
    ...base,
    id: 'movistar-800',
    empresa: 'Movistar',
    nombre: 'Fibra 800',
    bajadaMbps: 800,
    subidaMbps: 800,
    servicios: ['internet'],
    tramos: [{ desde: 1, hasta: null, mensualCLP: 19990 }],
    fuente: movistar,
    condiciones:
      'Precio único anunciado. Instalación gratuita contratando por web. No equivale a precio congelado: confirma reajustes y equipos adicionales.',
  },
  {
    ...base,
    id: 'movistar-giga',
    empresa: 'Movistar',
    nombre: 'Fibra Giga',
    bajadaMbps: 940,
    subidaMbps: 940,
    servicios: ['internet'],
    tramos: [
      { desde: 1, hasta: 12, mensualCLP: 18990 },
      { desde: 13, hasta: null, mensualCLP: 26990 },
    ],
    fuente: movistar,
    condiciones:
      'Promoción de 12 meses e instalación gratuita por web. Confirma los equipos incluidos: la página contiene condiciones distintas sobre repetidores.',
  },
  {
    ...base,
    id: 'movistar-duo-600',
    empresa: 'Movistar',
    nombre: 'Fibra 600 + TV + HBO',
    bajadaMbps: 600,
    subidaMbps: 600,
    servicios: ['internet', 'tv'],
    tramos: [
      { desde: 1, hasta: 12, mensualCLP: 28990 },
      { desde: 13, hasta: null, mensualCLP: 36990 },
    ],
    fuente: movistar,
    condiciones:
      'Pack con televisión; instalación gratuita por web. Confirma canales, condiciones del streaming y equipos adicionales antes de contratar.',
  },
  {
    ...base,
    id: 'gtd-940',
    empresa: 'GTD',
    nombre: 'Fibra 940',
    bajadaMbps: 940,
    subidaMbps: null,
    servicios: ['internet'],
    tramos: [
      { desde: 1, hasta: 12, mensualCLP: 20990 },
      { desde: 13, hasta: null, mensualCLP: 31990 },
    ],
    ofertaHasta: '2026-09-30',
    fuente: gtd,
    condiciones:
      'Nuevas contrataciones residenciales del 1 al 30 de septiembre. Instalación $0, IVA incluido y reajuste por IPC. Subida por confirmar.',
  },
]

/** Estos enlaces no acreditan cobertura ni precios en una dirección. */
export const PROVEEDORES_INTERNET = [
  { nombre: 'WOM', url: wom },
  { nombre: 'Movistar', url: movistar },
  { nombre: 'GTD', url: gtd },
  { nombre: 'Entel', url: 'https://www.entel.cl/hogar/internet' },
  {
    nombre: 'Claro',
    url: 'https://www.clarochile.cl/personas/servicios/servicios-hogar/internet/planes-y-precios/',
  },
  {
    nombre: 'VTR',
    url: 'https://vtr.com/productos/hogar-packs/internet-hogar/',
  },
  { nombre: 'Mundo', url: mundo },
] as const

export const INTERNET_FAQS = [
  {
    q: '¿Cuál es el internet hogar más barato para mi casa?',
    a: 'Depende de los planes disponibles en tu dirección y de sus condiciones. Este catálogo es una selección con fecha de revisión. Compara mensualidades, instalación y precio posterior a la promoción; luego confirma la cotización con la empresa.',
  },
  {
    q: '¿Qué incluye la proyección a 12 o 24 meses?',
    a: 'Suma los precios mensuales de cada tramo y la instalación publicada. No anticipa reajustes ni incluye equipos opcionales, consumos extra o cargos por término. Si falta un precio o la instalación, no mostramos un total completo.',
  },
  {
    q: '¿El comparador confirma cobertura por comuna?',
    a: 'No. La disponibilidad se consulta con tu dirección directamente en la empresa. No necesitas dejar tu dirección, RUT ni teléfono en lalupa para comparar.',
  },
  {
    q: '¿Por qué puede desaparecer una oferta?',
    a: 'Dejamos de incluir su precio al vencer la campaña publicada o el plazo de revisión editorial. Eso no significa que la empresa haya dejado de prestar el servicio; consulta sus condiciones actuales en el enlace oficial.',
  },
] as const
