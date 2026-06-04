/**
 * Datos verificados de internet fijo hogar en Chile 2026.
 *
 * Fuente principal: Subtel, Informe del Sector Telecomunicaciones
 * Cierre 2025 (publicado marzo 2026), Informe Preliminar Q1 2026
 * (publicado mayo 2026), sitios oficiales de proveedores.
 *
 * Fecha de consolidación: 2026-06-04.
 * Próxima revisión: 2026-09 (al publicarse el siguiente informe Subtel).
 *
 * IMPORTANTE: los precios capturados corresponden a promociones
 * vigentes entre mayo y junio de 2026. Revisar antes de publicar
 * cualquier comunicación en otra fecha; las promos cambian
 * semanalmente. Donde no se pudo verificar el precio sin promo en
 * sitio oficial, el campo es `null` y queda `[SIN VERIFICAR]`
 * documentado en `sinVerificar`.
 *
 * Las cifras se usan en la guía /guias/fibra-vs-cable-internet-chile
 * y en /comparador-internet-hogar.
 */

// =============================================================================
// DATOS TÉCNICOS: FTTH vs HFC
// =============================================================================

export const FIBRA_VS_CABLE_TECNICO = {
  ftth: {
    // GPON (ITU-T G.984): 2.5 Gbps bajada / 1.25 Gbps subida por puerto OLT
    // XGS-PON (ITU-T G.9807.1): 10 Gbps simétricos por puerto
    // En Chile, planes residenciales hoy van de 300 Mbps a 2 Gbps,
    // con planes premium hasta 10 Gbps (Mundo Pacífico).
    velocidadBajadaTipica: { min: 300, max: 2000, unidad: 'Mbps' },
    velocidadSubida: 'simétrica',
    ratioSubidaBajada: '1:1',
    // Latencia 1-5 ms a primer salto; 5-15 ms reales a CDN.
    latenciaMs: { min: 1, max: 10 },
    estabilidad: 'muy alta',
    sensibilidadCompartida: false,
    sensibleClima: false,
    sensibleCorteElectrico: 'requiere UPS en ONT para mantener servicio',
    estandarTecnico: 'ITU-T G.984 (GPON) / ITU-T G.9807.1 (XGS-PON)',
    fuentes: [
      'https://www.itu.int/rec/T-REC-G.984',
      'https://www.itu.int/rec/T-REC-G.9807.1',
      'https://www.subtel.gob.cl/wp-content/uploads/2026/03/Informe_del_Sector_Telecomunicaciones_Dic25.pdf',
    ],
    fechaCaptura: '2026-06-04',
  },
  hfc: {
    // DOCSIS 3.1: hasta 10 Gbps bajada teórica / 1-2 Gbps subida teórica.
    // En Chile, planes HFC reales: 100-1000 Mbps bajada, subida
    // típicamente asimétrica (5-10% de la bajada).
    velocidadBajadaTipica: { min: 100, max: 1000, unidad: 'Mbps' },
    velocidadSubida: 'asimétrica',
    ratioSubidaBajada: '5-10%',
    latenciaMs: { min: 10, max: 30 },
    estabilidad: 'alta',
    sensibilidadCompartida: true,
    sensibleClima: 'parcial',
    sensibleCorteElectrico:
      'amplificadores en red requieren energía; caídas en cortes prolongados',
    estandarTecnico: 'CableLabs DOCSIS 3.0 / 3.1',
    fuentes: [
      'https://www.cablelabs.com/specifications',
      'https://www.subtel.gob.cl/wp-content/uploads/2026/03/Informe_del_Sector_Telecomunicaciones_Dic25.pdf',
    ],
    fechaCaptura: '2026-06-04',
    nota: 'HFC está en retirada acelerada en Chile: cayó 48.4% interanual al cierre 2025. ClaroVTR migra activamente sus clientes HFC a FTTH simétrica.',
  },
} as const

// =============================================================================
// PROVEEDORES Y PLANES
// =============================================================================

export type ProveedorInternet = {
  id: 'movistar' | 'entel' | 'vtr' | 'mundo' | 'gtd'
  nombre: string
  tecnologia: 'FTTH' | 'FTTH + HFC (migrando)'
  cobertura: string
  sitioOficialPlanes: string
  ventajaClave: string
  planes: ReadonlyArray<{
    velocidadMbps: number
    velocidadSubidaMbps: number | null
    precioMensualClp: number | null
    precioConPromoClp: number | null
    duracionPromoMeses: number | null
    condiciones: string
    sinVerificar?: string
  }>
  fechaCaptura: string
  notas: string
}

export const PROVEEDORES_INTERNET_HOGAR: ReadonlyArray<ProveedorInternet> = [
  {
    id: 'movistar',
    nombre: 'Movistar',
    tecnologia: 'FTTH',
    cobertura: 'Nacional urbano (líder en cobertura FTTH residencial)',
    sitioOficialPlanes: 'https://ww2.movistar.cl/hogar/internet-fibra-optica/',
    ventajaClave: 'Mayor cobertura nacional',
    planes: [
      {
        velocidadMbps: 600,
        velocidadSubidaMbps: 600,
        precioMensualClp: 18990,
        precioConPromoClp: 13990,
        duracionPromoMeses: 6,
        condiciones:
          'Contratación online, promoción vigente mayo-junio 2026 (21% descuento)',
      },
      {
        velocidadMbps: 800,
        velocidadSubidaMbps: 800,
        precioMensualClp: null,
        precioConPromoClp: 18990,
        duracionPromoMeses: 12,
        condiciones: 'Contratación online',
        sinVerificar: 'Precio sin promoción no publicado en sitio oficial',
      },
      {
        velocidadMbps: 940,
        velocidadSubidaMbps: 940,
        precioMensualClp: 36990,
        precioConPromoClp: 28990,
        duracionPromoMeses: 12,
        condiciones: '29% descuento por 12 meses, contratación online',
      },
      {
        velocidadMbps: 2000,
        velocidadSubidaMbps: 2000,
        precioMensualClp: null,
        precioConPromoClp: null,
        duracionPromoMeses: null,
        condiciones: 'Plan tope, sujeto a factibilidad',
        sinVerificar: 'Todos los precios',
      },
    ],
    fechaCaptura: '2026-06-04',
    notas:
      'Operador histórico, mayor cobertura FTTH nacional. Recuperó liderazgo en internet fijo durante 2025 con 27.0% market share Q1 2026.',
  },
  {
    id: 'entel',
    nombre: 'Entel',
    tecnologia: 'FTTH',
    cobertura:
      'Nacional urbano en expansión, +12.3% suscriptores fijos en 12 meses',
    sitioOficialPlanes: 'https://www.entel.cl/hogar/internet',
    ventajaClave: 'Empaquetado con plan móvil',
    planes: [
      {
        velocidadMbps: 600,
        velocidadSubidaMbps: 600,
        precioMensualClp: 22990,
        precioConPromoClp: 13990,
        duracionPromoMeses: null,
        condiciones:
          'Contratación online, WiFi 6 incluido, promociones hasta 31-mayo / 7-junio 2026',
        sinVerificar: 'Duración exacta del precio promocional',
      },
      {
        velocidadMbps: 800,
        velocidadSubidaMbps: 800,
        precioMensualClp: null,
        precioConPromoClp: null,
        duracionPromoMeses: null,
        condiciones: 'WiFi 6 más extensor según evaluación técnica',
        sinVerificar: 'Precios exactos',
      },
      {
        velocidadMbps: 940,
        velocidadSubidaMbps: 940,
        precioMensualClp: null,
        precioConPromoClp: null,
        duracionPromoMeses: null,
        condiciones: 'WiFi 7 más extensor según evaluación técnica',
        sinVerificar: 'Precios exactos',
      },
    ],
    fechaCaptura: '2026-06-04',
    notas:
      'Reputación móvil traccionando hogar. WiFi 6 estándar; WiFi 7 en planes premium.',
  },
  {
    id: 'vtr',
    nombre: 'VTR (Grupo ClaroVTR)',
    tecnologia: 'FTTH + HFC (migrando)',
    cobertura:
      'Santiago y ciudades principales (Concepción, Valparaíso, Antofagasta, Temuco); fuerte en zonas con red HFC histórica',
    sitioOficialPlanes: 'https://vtr.com/productos/hogar-packs/internet-hogar/',
    ventajaClave: 'Sin permanencia, cancelable en cualquier momento',
    planes: [
      {
        velocidadMbps: 600,
        velocidadSubidaMbps: 600,
        precioMensualClp: 33990,
        precioConPromoClp: 26990,
        duracionPromoMeses: 12,
        condiciones: 'Sin permanencia, instalación gratis online, router WiFi 6',
      },
      {
        velocidadMbps: 600,
        velocidadSubidaMbps: 600,
        precioMensualClp: null,
        precioConPromoClp: 28990,
        duracionPromoMeses: null,
        condiciones: 'Doble Pack (Internet + TV HD)',
        sinVerificar: 'Precio sin promoción',
      },
    ],
    fechaCaptura: '2026-06-04',
    notas:
      'ClaroVTR superó a Movistar al cierre 2025 con 26.3% market share Q1 2026. Migración activa de clientes HFC a FTTH simétrica.',
  },
  {
    id: 'mundo',
    nombre: 'Mundo Pacífico',
    tecnologia: 'FTTH',
    cobertura:
      'Centro y sur de Chile, incluyendo zonas rurales donde otros no llegan',
    sitioOficialPlanes: 'https://mundointernet.cl/p/td/mundo-internet-planes.html',
    ventajaClave: 'Único operador con plan masivo de 10 Gbps en Chile',
    planes: [
      {
        velocidadMbps: 800,
        velocidadSubidaMbps: 800,
        precioMensualClp: 21990,
        precioConPromoClp: 15990,
        duracionPromoMeses: 12,
        condiciones:
          'Instalación gratis, sin multa por terminación (costo proporcional de instalación si se cancela antes de 12 meses)',
      },
      {
        velocidadMbps: 10000,
        velocidadSubidaMbps: 10000,
        precioMensualClp: null,
        precioConPromoClp: null,
        duracionPromoMeses: null,
        condiciones:
          'Plan tope, 10 Gbps simétricos (único operador con este plan masivo en 2026)',
        sinVerificar: 'Precio',
      },
    ],
    fechaCaptura: '2026-06-04',
    notas:
      'Tercer player nacional con 21.2% market share Q1 2026, +8.6% suscriptores en 12 meses. Llega a zonas rurales que Movistar y Entel no cubren.',
  },
  {
    id: 'gtd',
    nombre: 'GTD',
    tecnologia: 'FTTH',
    cobertura:
      'Santiago, Valparaíso, Biobío, La Araucanía, Los Lagos; varía edificio por edificio',
    sitioOficialPlanes: 'https://www.gtd.cl/hogar/productos-hogar-internet-fibra',
    ventajaClave: 'Foco regional en calidad y postventa',
    planes: [
      {
        velocidadMbps: 600,
        velocidadSubidaMbps: 600,
        precioMensualClp: null,
        precioConPromoClp: 17990,
        duracionPromoMeses: null,
        condiciones:
          'Instalación $29.990; incluye ONT con WiFi (hasta 64 dispositivos)',
        sinVerificar: 'Precio sin promoción (sube 30-45% al terminar promo)',
      },
      {
        velocidadMbps: 2000,
        velocidadSubidaMbps: 2000,
        precioMensualClp: null,
        precioConPromoClp: null,
        duracionPromoMeses: null,
        condiciones: 'Plan Pro, incluye router eero 7 (hasta 120 dispositivos)',
        sinVerificar: 'Precios específicos',
      },
    ],
    fechaCaptura: '2026-06-04',
    notas:
      'Operador regional. Cobertura limitada vs Movistar/Entel pero buena penetración en zonas específicas del sur. Precios suben 30-45% al terminar promo.',
  },
]

// =============================================================================
// PENETRACIÓN DE FIBRA EN CHILE (Subtel)
// =============================================================================

export const PENETRACION_FIBRA_CHILE = {
  porcentajeConexionesFibra: 84.0,
  porcentajeConexionesHFC: 12.4,
  porcentajeOtrasInalambricas: 3.3,
  porcentajeHogaresConInternetFijo: 68.8,
  variacionInteranualFibra: 19.6,
  variacionInteranualHFC: -48.4,
  totalConexionesHFC: 581_000,
  traficoFijoPorConexionGB: 675.6,
  fuente: 'Subtel, Informe del Sector Telecomunicaciones Cierre 2025',
  fechaInforme: '2025-12',
  fechaPublicacion: '2026-03',
  urlInforme:
    'https://www.subtel.gob.cl/wp-content/uploads/2026/03/Informe_del_Sector_Telecomunicaciones_Dic25.pdf',
} as const

// =============================================================================
// MARKET SHARE (Q1 2026)
// =============================================================================

export const MARKET_SHARE_INTERNET_FIJO_Q1_2026 = {
  movistar: 27.0,
  claroVtr: 26.3,
  mundoPacifico: 21.2,
  entel: 10.5,
  otros: 15.0,
  fuente: 'Subtel Informe T1 2025, vía La Tercera mayo 2026',
  url: 'https://www.latercera.com/pulso/noticia/informe-subtel-al-primer-trimestre-los-dos-principales-actores-de-internet-fijo-pierden-terreno-a-manos-de-mundo-y-entel/',
  fechaCaptura: '2026-06-04',
} as const

// =============================================================================
// RANKING REGIONAL DE VELOCIDAD (Subtel + OTI, octubre 2025)
// =============================================================================

export const RANKING_REGIONAL_VELOCIDAD = {
  metodologia:
    '767.924 mediciones recolectadas por sondas del Organismo Técnico Independiente (OTI). Las mediciones son válidas para exigir compensaciones por incumplimiento de velocidades contratadas.',
  topVelocidadBajadaMbps: [
    { region: 'Los Ríos', mbps: 789.6 },
    { region: 'Ñuble', mbps: 779.0 },
    { region: 'Coquimbo', mbps: 763.1 },
  ],
  topVelocidadSubidaMbps: [
    { region: 'Aysén', mbps: 862.8 },
    { region: 'Los Ríos', mbps: 716.7 },
    { region: 'Ñuble', mbps: 703.5 },
  ],
  fuente: 'Subtel + OTI, Ranking Regional Banda Ancha Fija Octubre 2025',
  url: 'https://www.subtel.gob.cl/los-rios-nuble-y-coquimbo-lideran-ranking-de-velocidad-promedio-de-internet-fijo-en-octubre-de-acuerdo-a-ranking-de-subtel-y-oti/',
  fechaCaptura: '2026-06-04',
} as const
