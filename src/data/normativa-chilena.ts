/**
 * Referencias para orientar la revisión de una boleta, no dictámenes legales.
 * Los identificadores históricos se conservan por compatibilidad; sufijos como
 * "4m" o "15d" NO definen plazos ni reglas ejecutables.
 */
export interface ReferenciaLegal {
  id: string
  norma: string
  resumen: string
  url: string
  servicio: 'electricidad' | 'agua' | 'gas' | 'todos'
  tipo: 'norma' | 'contexto' | 'canal'
}

export const REVISION_REFERENCIAS = {
  version: '2026-09-26.1',
  fecha: '2026-09-26',
  alcance:
    'Orientación documental; no acredita aplicabilidad de una norma a una boleta concreta.',
} as const

const SEC = 'https://www.sec.cl/area-ciudadana/reclamos-y-la-sec/'
const SISS =
  'https://www.chileatiende.gob.cl/instituciones/superintendencia-de-servicios-sanitarios'
const GAS = 'https://www.sec.cl/gas/'
const SERNAC = 'https://www.sernac.cl/portal/617/w3-article-9178.html'
const DS327 = 'https://www.bcn.cl/leychile/navegar?idNorma=124102'

function ref(
  id: string,
  servicio: ReferenciaLegal['servicio'],
  norma: string,
  resumen: string,
  url: string,
  tipo: ReferenciaLegal['tipo'] = 'canal',
): ReferenciaLegal {
  return { id, servicio, norma, resumen, url, tipo }
}

export const NORMATIVA_ELECTRICIDAD = {
  'electricidad-refacturacion-4m': ref(
    'electricidad-refacturacion-4m',
    'electricidad',
    'SEC: reliquidaciones tarifarias del período 2020–2024',
    'La SEC describe ajustes tarifarios que pueden generar cargos o abonos de períodos anteriores. Ese mecanismo no permite tratar toda reliquidación como consumo omitido ni aplicar un límite universal de cuatro meses.',
    'https://www.sec.cl/sec-instruye-a-empresas-electricas-aplazar-cobro-de-reliquidaciones-tarifarias-hasta-julio-de-2026/',
    'contexto',
  ),
  'electricidad-lectura-estimada-2m': ref(
    'electricidad-lectura-estimada-2m',
    'electricidad',
    'Decreto 327, artículo 129: facturación provisoria',
    'El artículo regula la falta de lectura por causas no imputables al concesionario: contempla hasta dos períodos consecutivos y la regularización posterior. Una sola boleta no acredita la causa ni la secuencia de lecturas.',
    DS327,
    'norma',
  ),
  'electricidad-aviso-corte-15d': ref(
    'electricidad-aviso-corte-15d',
    'electricidad',
    'Decreto 327: suspensión del suministro y atención de reclamos',
    'Deben revisarse la deuda, el aviso y las condiciones aplicables a la suspensión. El texto extraído no acredita la notificación efectiva ni permite declarar irregular un corte.',
    DS327,
    'norma',
  ),
  'electricidad-potencia-solo-bt2': ref(
    'electricidad-potencia-solo-bt2',
    'electricidad',
    'SEC: antecedentes de facturación de distribuidoras',
    'La revisión exige identificar la opción tarifaria, unidad, cantidad y precio de cada componente. Una etiqueta de potencia no basta para concluir que hubo un cambio de contrato.',
    'https://www.sec.cl/clientes-dx/',
    'contexto',
  ),
  'electricidad-multa-reactivo-industrial': ref(
    'electricidad-multa-reactivo-industrial',
    'electricidad',
    'SEC: revisión de facturación',
    'Pide la base de cálculo y la disposición tarifaria invocada para el recargo. El lector no valida mediciones de energía reactiva ni condiciones contractuales.',
    SEC,
  ),
  'electricidad-reposicion-post-corte': ref(
    'electricidad-reposicion-post-corte',
    'electricidad',
    'SEC: consulta y reclamo por facturación',
    'Solicita el registro de la intervención y el precio aplicado. No encontrar un corte en el texto extraído no demuestra que no haya ocurrido.',
    SEC,
  ),
  'electricidad-compensacion-corte': ref(
    'electricidad-compensacion-corte',
    'electricidad',
    'SEC: atención por interrupciones del suministro',
    'Para revisar una compensación se requieren los antecedentes del evento y de su tratamiento por la empresa o autoridad. No se usa un umbral universal de horas ni una fórmula de cargo fijo.',
    'https://www.sec.cl/atencion-ciudadana/',
  ),
  'electricidad-subsidio-21667': ref(
    'electricidad-subsidio-21667',
    'electricidad',
    'Subsidio Eléctrico: resultados de la quinta convocatoria 2026',
    'Contrasta el resultado oficial, el número de cliente y el período asignado. Una publicidad sobre el subsidio no acredita que el hogar sea beneficiario.',
    'https://energia.gob.cl/noticias/nacional/quinto-proceso-de-entrega-del-subsidio-electrico-llega-cifra-mas-alta-de-beneficiarios-desde-su-creacion',
    'contexto',
  ),
  'electricidad-recargo-invierno-temporada': ref(
    'electricidad-recargo-invierno-temporada',
    'electricidad',
    'SEC: antecedentes de la opción tarifaria y su vigencia',
    'La emisión de una boleta no identifica por sí sola el período del consumo ni la vigencia de un recargo. Deben cotejarse tarifa, fechas y cálculo; no se presume que el cobro sea válido durante ciertos meses.',
    'https://www.sec.cl/clientes-dx/',
    'contexto',
  ),
  'electricidad-cargo-unico-bt1': ref(
    'electricidad-cargo-unico-bt1',
    'electricidad',
    'SEC: desglose de facturación',
    'Solicita la denominación completa, unidad y partida tarifaria de un cargo ambiguo. El nombre abreviado no determina por sí solo su procedencia.',
    SEC,
  ),
} as const

export const NORMATIVA_AGUA = {
  'agua-refacturacion-4m': ref(
    'agua-refacturacion-4m',
    'agua',
    'SISS: atención por facturación sanitaria',
    'Para revisar un ajuste solicita su causa, períodos, lecturas y pagos anteriores. Este enlace es un canal de orientación; no acredita un plazo universal para toda refacturación.',
    SISS,
  ),
  'agua-periodo-punta-verano': ref(
    'agua-periodo-punta-verano',
    'agua',
    'SISS: consulta sobre la tarifa aplicable',
    'Identifica sanitaria, localidad, grupo tarifario, período de consumo y límite de sobreconsumo. No se determina la temporada aplicable usando solamente la fecha de emisión.',
    SISS,
  ),
  'agua-lectura-estimada-2m': ref(
    'agua-lectura-estimada-2m',
    'agua',
    'SISS: revisión de lecturas y facturación',
    'Pide las lecturas y el método de estimación de la sanitaria. No se trasladan automáticamente las reglas eléctricas al agua potable.',
    SISS,
  ),
  'agua-subsidio-sap': ref(
    'agua-subsidio-sap',
    'agua',
    'ChileAtiende: Subsidio al Pago del Consumo de Agua Potable',
    'El subsidio se solicita en la municipalidad. Verifica allí asignación, vigencia y alcance antes de comparar el descuento con la boleta; mencionar el beneficio no acredita adjudicación.',
    'https://www.chileatiende.gob.cl/fichas/51314/1/pdf',
    'contexto',
  ),
  'agua-reposicion-post-corte': ref(
    'agua-reposicion-post-corte',
    'agua',
    'SISS: consulta sobre corte y reposición',
    'Comprueba la intervención efectuada y su precio. La ausencia de una mención al corte en la boleta no demuestra que el cargo carezca de causa.',
    SISS,
  ),
  'agua-aviso-corte-15d': ref(
    'agua-aviso-corte-15d',
    'agua',
    'SISS: atención por suspensión de servicio',
    'Reúne el aviso, vencimientos y comunicaciones. El lector no comprueba la notificación ni aplica plazos o protecciones de otro servicio.',
    SISS,
  ),
  'agua-alcantarillado-proporcional': ref(
    'agua-alcantarillado-proporcional',
    'agua',
    'SISS: revisión del detalle de agua y alcantarillado',
    'Contrasta cantidades, unidades y tarifas de cada servicio. No se usa un porcentaje fijo entre importes ni se presume que la extracción incluye todas las líneas.',
    SISS,
  ),
} as const

export const NORMATIVA_GAS = {
  'gas-refacturacion-4m': ref(
    'gas-refacturacion-4m',
    'gas',
    'SEC: atención sobre suministro de gas',
    'Solicita motivo, período y cálculo del ajuste. La palabra reliquidación no identifica su régimen ni permite aplicar automáticamente un límite de antigüedad.',
    GAS,
  ),
  'gas-lectura-estimada-2m': ref(
    'gas-lectura-estimada-2m',
    'gas',
    'SEC: revisión de facturación de gas',
    'Reúne lecturas, estimaciones y pagos del suministro. No se extiende al gas la regla eléctrica de facturación provisoria.',
    GAS,
  ),
  'gas-aviso-corte-10d': ref(
    'gas-aviso-corte-10d',
    'gas',
    'SEC: atención por suministro de gas',
    'Distingue gas natural, gas licuado por red y venta de cilindros. Revisa el aviso y el régimen aplicable; esta orientación no computa un plazo legal.',
    GAS,
  ),
  'gas-reposicion-post-corte': ref(
    'gas-reposicion-post-corte',
    'gas',
    'SEC: consulta sobre reposición de gas',
    'Pide el registro de la intervención y las condiciones de reposición de tu suministro. El texto de la boleta no acredita todo el historial del servicio.',
    GAS,
  ),
  'gas-recargo-delivery-publicado': ref(
    'gas-recargo-delivery-publicado',
    'gas',
    'SERNAC: reclamo con antecedentes de la compra',
    'Contrasta el cargo de despacho con la oferta, el pedido y el total aceptado. Una línea separada no demuestra por sí sola que el importe no haya sido informado.',
    SERNAC,
  ),
} as const

export const NORMATIVA_COMUNES = {
  'comun-interes-mora-max-cmf': ref(
    'comun-interes-mora-max-cmf',
    'todos',
    'CMF: metodología de tasas de interés corriente y máxima convencional',
    'La referencia depende de las características de la operación y la fecha aplicable. Es necesario identificar el régimen, base y periodicidad antes de comparar; no existe aquí un umbral fijo de 2,5% mensual.',
    'https://www.cmfchile.cl/portal/estadisticas/626/w4-article-102391.html',
    'contexto',
  ),
  'comun-derecho-desglose': ref(
    'comun-derecho-desglose',
    'todos',
    'SERNAC: antecedentes para presentar un reclamo',
    'Conserva el documento y solicita el desglose de los conceptos que no puedas identificar. Este enlace explica un trámite; no establece un plazo universal de cinco días para toda empresa.',
    SERNAC,
  ),
  'comun-reclamo-5-dias': ref(
    'comun-reclamo-5-dias',
    'todos',
    'SERNAC: gestión de reclamos',
    'Guarda documentos, comunicaciones y folio. El procedimiento y sus plazos dependen de la entidad y canal elegidos; no se confunden con los plazos de una acción judicial.',
    SERNAC,
  ),
  'comun-reconexion-oportuna': ref(
    'comun-reconexion-oportuna',
    'todos',
    'Orientación para documentar un reclamo de consumo',
    'Guarda fecha y hora del pago, aviso y solicitud de reposición. Confirma las condiciones con la empresa y el regulador correspondiente; no se promete un plazo único para luz, agua y gas.',
    SERNAC,
  ),
  'comun-electrodependientes-no-corte': ref(
    'comun-electrodependientes-no-corte',
    'electricidad',
    'SEC: registro y protección de pacientes electrodependientes',
    'La SEC distingue la prohibición de suspensión por deuda para pacientes inscritos de la atención prioritaria y respaldo frente a interrupciones. No equivale a garantizar que nunca habrá cortes.',
    'https://www.sec.cl/ministerio-de-energia-y-sec-realizan-llamado-a-inscribirse-y-actualizar-el-registro-de-pacientes-electrodependientes/',
    'contexto',
  ),
} as const

export const TODA_NORMATIVA = {
  ...NORMATIVA_ELECTRICIDAD,
  ...NORMATIVA_AGUA,
  ...NORMATIVA_GAS,
  ...NORMATIVA_COMUNES,
} as const
export type ReferenciaLegalId = keyof typeof TODA_NORMATIVA
