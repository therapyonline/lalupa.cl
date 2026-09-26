/**
 * Puntos de revisión a partir de datos extraídos. No determina infracciones,
 * elegibilidad, plazos legales ni montos de devoluciones. Una mención textual
 * no prueba un hecho, y una línea ausente puede deberse a extracción parcial.
 */
import {
  REVISION_REFERENCIAS,
  TODA_NORMATIVA,
  type ReferenciaLegal,
  type ReferenciaLegalId,
} from '@/data/normativa-chilena'
import { clasificarTarifa } from './electricidad/_clasificar-tarifa'
import type { Cargo, ParsedBoleta } from './types'

export type SeveridadAnalisis = 'revision' | 'informativo'
export interface AnalisisLegal {
  id: string
  severidad: SeveridadAnalisis
  titulo: string
  descripcion: string
  accionSugerida: string
  /** Nombre histórico: puede ser una norma, contexto o canal de orientación. */
  fundamentoLegal: ReferenciaLegal
  alcance: 'orientativo'
  versionAnalisis: string
}

function buildAnalisis(
  id: string,
  severidad: SeveridadAnalisis,
  titulo: string,
  descripcion: string,
  accionSugerida: string,
  referenciaId: ReferenciaLegalId,
): AnalisisLegal {
  return {
    id,
    severidad,
    titulo,
    descripcion,
    accionSugerida,
    fundamentoLegal: TODA_NORMATIVA[referenciaId],
    alcance: 'orientativo',
    versionAnalisis: REVISION_REFERENCIAS.version,
  }
}

const positivo = (c: Cargo) => Number.isFinite(c.monto) && c.monto > 0
const negativo = (c: Cargo) => Number.isFinite(c.monto) && c.monto < 0
const tieneCargo = (b: ParsedBoleta, re: RegExp) =>
  b.cargos.some((c) => positivo(c) && re.test(c.concepto))
// Los parsers de gas por medidor tienen unidad m3; un formato desconocido no
// debe recibir instrucciones propias de un suministro por red.
const esSuministro = (b: ParsedBoleta) =>
  b.servicio !== 'gas' ||
  (b.tipoVenta !== 'producto' && b.consumo.unidad === 'm3')
const esBT1 = (b: ParsedBoleta) =>
  b.servicio === 'electricidad' &&
  clasificarTarifa(b.consumo.tarifa).tipo === 'BT-1'
const formatoCLP = (n: number) => `$ ${Math.round(n).toLocaleString('es-CL')}`

function referenciaServicio(
  b: ParsedBoleta,
  tema: 'refacturacion-4m' | 'lectura-estimada-2m' | 'reposicion-post-corte',
) {
  return `${b.servicio}-${tema}` as ReferenciaLegalId
}

const RETROACTIVO =
  /reliquidaci[óo]n|refacturaci[óo]n|ajuste\s+(?:cargo\s+)?(?:por\s+)?no\s+registro/i
function analizarRefacturacion(b: ParsedBoleta): AnalisisLegal | null {
  if (!esSuministro(b) || !RETROACTIVO.test(b.raw)) return null
  return buildAnalisis(
    `refacturacion-${b.servicio}`,
    'revision',
    'El texto menciona una reliquidación o ajuste',
    'La mención no identifica por sí sola su causa: puede corresponder a lecturas, precios o abonos. No permite concluir que el importe sea indebido por la antigüedad del período.',
    'Pide motivo, períodos, lecturas o tarifas utilizadas, abonos y cuotas. Contrasta el cálculo con las boletas y pagos anteriores antes de impugnar una diferencia.',
    referenciaServicio(b, 'refacturacion-4m'),
  )
}

function analizarReposicionSinCorte(b: ParsedBoleta): AnalisisLegal | null {
  if (!esSuministro(b) || !tieneCargo(b, /reposici[óo]n/i)) return null
  return buildAnalisis(
    `reposicion-sin-corte-${b.servicio}`,
    'revision',
    'Revisa el cargo por reposición de servicio',
    'Identificamos un importe positivo por reposición. La boleta no acredita por sí sola si hubo corte, trabajo realizado o notificación; una mención al corte tampoco valida el cobro.',
    'Solicita fecha, motivo y registro de la intervención, junto con el precio aplicado. Compara esos antecedentes con el documento original.',
    referenciaServicio(b, 'reposicion-post-corte'),
  )
}

function analizarLecturaEstimada(b: ParsedBoleta): AnalisisLegal | null {
  if (
    !esSuministro(b) ||
    !/lectura\s+estimada|consumo\s+estimado|estimaci[óo]n\s+de\s+consumo|facturaci[óo]n\s+provisoria/i.test(
      b.raw,
    )
  )
    return null
  return buildAnalisis(
    `lectura-estimada-${b.servicio}`,
    'revision',
    'El texto menciona una lectura estimada',
    'Puede referirse al período actual, a un ajuste anterior o a una explicación general. Este documento no basta para contar estimaciones consecutivas ni comprobar la causa de una lectura fallida.',
    'Identifica el tipo de lectura del período y reúne las boletas desde la última lectura real. Pide la causa, el método de cálculo y la conciliación de pagos, según las reglas del servicio correspondiente.',
    referenciaServicio(b, 'lectura-estimada-2m'),
  )
}

function analizarCargoPotenciaEnBT1(b: ParsedBoleta): AnalisisLegal | null {
  if (!esBT1(b) || !tieneCargo(b, /demanda\s+m[áa]xima|potencia\s+contratada/i))
    return null
  return buildAnalisis(
    'cargo-potencia-bt1',
    'revision',
    'Contrasta la potencia facturada con la tarifa leída',
    'Leímos BT-1 y un cargo por demanda máxima o potencia contratada. Es necesario comprobar ambos datos contra el original; el nombre del cargo no demuestra un cambio de contrato.',
    'Pide la opción tarifaria contratada y el desglose de unidad, cantidad, precio y período del componente.',
    'electricidad-potencia-solo-bt2',
  )
}

function analizarMultaReactivoEnBT1(b: ParsedBoleta): AnalisisLegal | null {
  if (
    !esBT1(b) ||
    !tieneCargo(
      b,
      /multa\s+por\s+consumo\s+reactivo|recargo\s+factor\s+potencia/i,
    )
  )
    return null
  return buildAnalisis(
    'multa-reactivo-bt1',
    'revision',
    'Revisa el recargo por energía reactiva',
    'Leímos BT-1 y un recargo asociado a energía reactiva o factor de potencia. La extracción no verifica la medición ni las condiciones que justificarían el cargo.',
    'Contrasta la tarifa con el contrato y solicita mediciones, fórmula y disposición tarifaria aplicada.',
    'electricidad-multa-reactivo-industrial',
  )
}

function analizarPeriodoPunta(b: ParsedBoleta): AnalisisLegal | null {
  if (
    b.servicio !== 'agua' ||
    !tieneCargo(b, /sobreconsumo|tarifa\s+punta|consumo\s+punta/i)
  )
    return null
  return buildAnalisis(
    'agua-periodo-punta-revisar',
    'revision',
    'Revisa el período y límite del sobreconsumo',
    'Identificamos un cargo por sobreconsumo o período punta. La fecha de emisión no determina cuándo se consumió el agua ni qué temporada corresponde a tu tarifa.',
    'Pide localidad, grupo tarifario, fechas de lectura, límite y cálculo. Si el período cruza un cambio, solicita cómo se distribuyeron los consumos.',
    'agua-periodo-punta-verano',
  )
}

function analizarCargoUnicoBT1(b: ParsedBoleta): AnalisisLegal | null {
  if (!esBT1(b) || !tieneCargo(b, /^(?:cargo\s+[úu]nico)$/i)) return null
  return buildAnalisis(
    'cargo-unico-bt1',
    'revision',
    'Revisa el desglose del cargo único',
    'La etiqueta extraída es abreviada y no identifica qué componente se está cobrando.',
    'Solicita denominación completa, unidad y partida tarifaria; revisa si el detalle aparece en otra sección del documento.',
    'electricidad-cargo-unico-bt1',
  )
}

function analizarSubsidio21667Ausente(b: ParsedBoleta): AnalisisLegal | null {
  if (
    b.servicio !== 'electricidad' ||
    !/Ley\s+(?:N?[°º]?\s*)?21\.?667|Subsidio\s+El[ée]ctrico/i.test(b.raw)
  )
    return null
  if (
    b.cargos.some(
      (c) =>
        negativo(c) &&
        /subsidio\s+el[ée]ctrico|Ley\s+21\.?667/i.test(c.concepto),
    )
  )
    return null
  return buildAnalisis(
    'subsidio-21667-ausente',
    'informativo',
    'Revisa la mención al Subsidio Eléctrico en tu boleta',
    'El texto menciona el subsidio, pero no identificamos un descuento entre los cargos extraídos. Puede ser un aviso general o una lectura incompleta: no acredita que seas beneficiario ni un incumplimiento de la empresa.',
    'Consulta el resultado oficial, el número de cliente y el período asignado. Si el descuento informado no coincide con el documento original, pide a tu distribuidora el detalle de su aplicación.',
    'electricidad-subsidio-21667',
  )
}

function analizarElectrodependientes(b: ParsedBoleta): AnalisisLegal | null {
  if (
    b.servicio !== 'electricidad' ||
    !/electrodependient[ae]|persona\s+(?:con\s+)?dependencia\s+el[ée]ctrica/i.test(
      b.raw,
    )
  )
    return null
  return buildAnalisis(
    'electrodependiente-no-corte',
    'informativo',
    'El texto menciona electrodependencia',
    'La protección de pacientes inscritos incluye la prohibición de suspensión por deuda y medidas ante interrupciones. No significa que el suministro no pueda fallar. La mención en la boleta no verifica una inscripción.',
    'Confirma el registro con tu distribuidora y consulta los canales prioritarios y medidas de respaldo indicados por la SEC.',
    'comun-electrodependientes-no-corte',
  )
}

function analizarSubsidioSapAusente(b: ParsedBoleta): AnalisisLegal | null {
  if (
    b.servicio !== 'agua' ||
    !/subsidio[^\n]{0,70}agua\s+potable|\bSAP\b|Ley\s+18\.?778/i.test(b.raw)
  )
    return null
  if (b.cargos.some((c) => negativo(c) && /subsidio|\bSAP\b/i.test(c.concepto)))
    return null
  return buildAnalisis(
    'agua-subsidio-sap-ausente',
    'informativo',
    'Revisa la mención al subsidio de agua',
    'No identificamos un descuento SAP entre los cargos extraídos. El texto puede ser una publicidad y la lectura puede estar incompleta; no demuestra asignación ni incumplimiento.',
    'Consulta en tu municipalidad la asignación, vigencia y alcance del subsidio. Compara esos antecedentes con tu número de servicio y la boleta original.',
    'agua-subsidio-sap',
  )
}

function analizarRecargoDeliveryGLP(b: ParsedBoleta): AnalisisLegal | null {
  if (b.servicio !== 'gas' || b.tipoVenta !== 'producto') return null
  const cargo = b.cargos.find(
    (c) =>
      positivo(c) &&
      /recargo\s+(?:de\s+)?(?:delivery|despacho|reparto)/i.test(c.concepto),
  )
  if (!cargo) return null
  return buildAnalisis(
    'gas-recargo-delivery-revisar',
    'revision',
    'Compara el despacho con el total del pedido',
    `Leímos ${formatoCLP(cargo.monto)} por despacho. Una línea separada no demuestra que el precio no haya sido informado antes de comprar.`,
    'Contrasta oferta, confirmación del pedido, despacho y total pagado. Conserva los comprobantes si encuentras una diferencia.',
    'gas-recargo-delivery-publicado',
  )
}

function analizarAvisoCorte(b: ParsedBoleta): AnalisisLegal | null {
  if (
    !esSuministro(b) ||
    !/aviso\s+de\s+corte|suspensi[óo]n\s+(?:del?\s+)?(?:suministro|servicio)|corte\s+por\s+(?:no\s+pago|mora)|fecha\s+de\s+corte/i.test(
      b.raw,
    )
  )
    return null
  const fuente: ReferenciaLegalId =
    b.servicio === 'electricidad'
      ? 'electricidad-aviso-corte-15d'
      : b.servicio === 'agua'
        ? 'agua-aviso-corte-15d'
        : 'gas-aviso-corte-10d'
  return buildAnalisis(
    `aviso-corte-${b.servicio}`,
    'informativo',
    'El texto menciona un posible corte',
    'La mención puede ser un aviso o una condición general. No acredita la fecha de notificación, que se haya realizado el corte ni las condiciones legales de ese suministro.',
    'Reúne aviso, vencimientos y comunicaciones con la empresa. Consulta el procedimiento del regulador de tu servicio antes de concluir que un corte fue irregular.',
    fuente,
  )
}

const MORA_CARGO =
  /recargo\s+por\s+mora|inter[ée]s(?:es)?\s+(?:por\s+)?mora|inter[ée]s(?:es)?\s+moratorios?/i
const TASA_MENSUAL =
  /(?:inter[ée]s(?:es)?|tasa)[^%\n]{0,50}?(\d+(?:[.,]\d+)?)\s*%\s*(?:mensual|al\s+mes|\/\s*mes|mes)/i
function analizarInteresMora(b: ParsedBoleta): AnalisisLegal | null {
  // Una tasa publicitaria de crédito, sin contexto de mora en esa línea,
  // no se convierte en un interés moratorio aplicado a la boleta.
  const linea = b.raw
    .split(/\r?\n/)
    .find(
      (l) =>
        /\b(?:mora|moratorios?|moratorias?)\b|saldos?\s+(?:vencidos?|impagos?)/i.test(
          l,
        ) && TASA_MENSUAL.test(l),
    )
  const tasa = linea?.match(TASA_MENSUAL)?.[1]
  const tieneMora = b.cargos.some(
    (c) => positivo(c) && MORA_CARGO.test(c.concepto),
  )
  if (!tasa && !tieneMora) return null
  return buildAnalisis(
    'interes-mora-verificar-tmc',
    'revision',
    'Revisa la base y la tasa del interés por mora',
    tasa
      ? `El texto menciona una tasa de ${tasa}% mensual en contexto de mora. No comprobamos su aplicación ni que supere un límite legal.`
      : 'Identificamos un cargo positivo por mora, pero no una tasa mensual vinculada de forma inequívoca. El importe por sí solo no permite evaluar su procedencia.',
    'Solicita capital, días, tasa, periodicidad y fundamento del cobro. Identifica el régimen y la referencia de la fecha aplicable antes de comparar con una tasa publicada por la CMF.',
    'comun-interes-mora-max-cmf',
  )
}

function analizarCompensacionCorte(b: ParsedBoleta): AnalisisLegal | null {
  if (
    b.servicio !== 'electricidad' ||
    !/interrupci[óo]n\s+(?:de\s+)?(?:suministro|servicio)|horas?\s+sin\s+(?:suministro|luz|servicio)|d[íi]as?\s+sin\s+suministro|evento\s+de\s+(?:falla|interrupci[óo]n)/i.test(
      b.raw,
    )
  )
    return null
  if (
    b.cargos.some(
      (c) =>
        negativo(c) &&
        /compensaci[óo]n|descuento\s+por\s+(?:corte|interrupci)/i.test(
          c.concepto,
        ),
    )
  )
    return null
  return buildAnalisis(
    'compensacion-corte-no-aplicada',
    'informativo',
    'Revisa los antecedentes de la interrupción',
    'El texto menciona una interrupción y no identificamos un abono de compensación. No basta para confirmar que corresponda un pago ni que esté pendiente.',
    'Guarda fechas, duración, número de reclamo y respuesta de la empresa. Consulta a la SEC cómo se trató el evento y qué abonos corresponden a tu suministro.',
    'electricidad-compensacion-corte',
  )
}

function analizarRecargoInvierno(b: ParsedBoleta): AnalisisLegal | null {
  if (
    b.servicio !== 'electricidad' ||
    !tieneCargo(
      b,
      /recargo\s+por\s+consumo\s+invierno|recargo\s+(?:de\s+|por\s+)?invierno/i,
    )
  )
    return null
  return buildAnalisis(
    'recargo-invierno-revisar',
    'revision',
    'Verifica la referencia del recargo de invierno',
    'Identificamos un recargo de invierno. El mes de emisión no demuestra su procedencia: faltan la tarifa, su vigencia y el período al que se atribuye el consumo.',
    'Pide el fundamento tarifario vigente para ese período y el cálculo del recargo. No lo des por válido solo porque la boleta se emitió en invierno.',
    'electricidad-recargo-invierno-temporada',
  )
}

function analizarAlcantarillado(b: ParsedBoleta): AnalisisLegal | null {
  if (b.servicio !== 'agua' || !tieneCargo(b, /alcantarillado|recolecci[óo]n/i))
    return null
  if (tieneCargo(b, /consumo\s+(?:de\s+)?agua(?:\s+potable)?|agua\s+potable/i))
    return null
  return buildAnalisis(
    'agua-alcantarillado-sin-agua-potable',
    'revision',
    'Comprueba el detalle de agua y alcantarillado',
    'Leímos un cargo de alcantarillado, pero no identificamos el cargo de agua potable. Puede figurar con otra etiqueta, en otro documento o faltar en la extracción; no demuestra un cobro sin base.',
    'Revisa el documento completo y solicita cantidades, tarifas y detalle de cada servicio. No compares sus importes usando un porcentaje fijo.',
    'agua-alcantarillado-proporcional',
  )
}

function analizarOtrosCargos(b: ParsedBoleta): AnalisisLegal | null {
  const cargo = b.cargos.find(
    (c) =>
      positivo(c) &&
      /^(?:otros\s+cargos?|otros|varios)$/i.test(c.concepto.trim()),
  )
  if (!cargo) return null
  return buildAnalisis(
    'otros-cargos-sin-desglose',
    'revision',
    'Revisa el detalle del cargo genérico',
    `Leímos "${cargo.concepto.trim()}" por ${formatoCLP(cargo.monto)}. Esa etiqueta no identifica las partidas incluidas; el detalle podría estar en otra sección.`,
    'Busca el desglose en el original y solicítalo por escrito si falta. Conserva la respuesta y el folio de atención.',
    'comun-derecho-desglose',
  )
}

function analizarReconexion(b: ParsedBoleta): AnalisisLegal | null {
  if (
    !esSuministro(b) ||
    !/deuda|saldo\s+(?:vencido|anterior|pendiente)|aviso\s+de\s+corte|corte\s+por\s+(?:no\s+pago|mora)|suspensi[óo]n\s+(?:del?\s+)?(?:suministro|servicio)/i.test(
      b.raw,
    )
  )
    return null
  return buildAnalisis(
    'reconexion-oportuna',
    'informativo',
    'Guarda los antecedentes si necesitas reposición',
    'El texto menciona deuda o corte, pero no acredita una suspensión efectiva ni un pago. Las condiciones de reposición deben revisarse para tu servicio.',
    'Si hubo suspensión, guarda fecha y hora del pago y de la solicitud de reposición. Pide a la empresa sus condiciones y registra el folio para consultar al regulador.',
    'comun-reconexion-oportuna',
  )
}

function analizarReclamo(b: ParsedBoleta): AnalisisLegal | null {
  if (!b.cargos.some((c) => c.sospechoso === true)) return null
  return buildAnalisis(
    'plazos-reclamo-sospechosos',
    'informativo',
    'Documenta los cargos que quieras consultar',
    'Hay cargos marcados para revisión. Esas marcas no acreditan un incumplimiento ni fijan un plazo de respuesta universal.',
    'Compara con el original, describe la diferencia y conserva documentos, respuesta y folio. Revisa el procedimiento del canal elegido; puedes preparar un borrador en la herramienta SERNAC.',
    'comun-reclamo-5-dias',
  )
}

/** Función pura: la ausencia de hallazgos tampoco certifica una boleta. */
export function analizarLegalmente(boleta: ParsedBoleta): AnalisisLegal[] {
  const checks = [
    analizarRefacturacion,
    analizarReposicionSinCorte,
    analizarLecturaEstimada,
    analizarCargoPotenciaEnBT1,
    analizarMultaReactivoEnBT1,
    analizarPeriodoPunta,
    analizarCargoUnicoBT1,
    analizarSubsidio21667Ausente,
    analizarElectrodependientes,
    analizarSubsidioSapAusente,
    analizarRecargoDeliveryGLP,
    analizarAvisoCorte,
    analizarInteresMora,
    analizarCompensacionCorte,
    analizarRecargoInvierno,
    analizarAlcantarillado,
    analizarOtrosCargos,
    analizarReconexion,
    analizarReclamo,
  ]
  return checks
    .map((fn) => fn(boleta))
    .filter((r): r is AnalisisLegal => r !== null)
    .sort(
      (a, b) =>
        Number(a.severidad === 'informativo') -
        Number(b.severidad === 'informativo'),
    )
}
