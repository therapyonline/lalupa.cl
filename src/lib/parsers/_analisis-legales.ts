/**
 * Análisis legales aplicados sobre una `ParsedBoleta` ya extraída.
 *
 * Cada análisis verifica un derecho del consumidor o una restricción
 * legal de la empresa proveedora, basado en normativa chilena real
 * (`src/data/normativa-chilena.ts`). Los hallazgos se devuelven como
 * objetos `AnalisisLegal` con cita textual de la norma y URL oficial,
 * para que el usuario pueda verificar y citar en su reclamo.
 *
 * Esto NO reemplaza la detección de cargos sospechosos por monto
 * (que vive en cada parser específico vía `detectarSospecha`); es
 * una capa adicional ortogonal: el primer parser pregunta "este cargo
 * es plausible numéricamente"; este módulo pregunta "este cargo es
 * legal".
 */

import { TODA_NORMATIVA, type ReferenciaLegalId } from '@/data/normativa-chilena'
import { clasificarTarifa } from './electricidad/_clasificar-tarifa'
import type { ParsedBoleta } from './types'

/**
 * Severidad del hallazgo desde el punto de vista del usuario:
 *   - 'alerta_legal': la empresa probablemente está incumpliendo
 *     normativa; el usuario tiene base para reclamo formal.
 *   - 'derecho_disponible': el usuario tiene un derecho que puede
 *     ejercer (relectura, desglose, subsidio); no es ilegalidad pero
 *     sí oportunidad concreta.
 *   - 'informativo': dato relevante para contexto (ej. recordatorio
 *     de plazos de reclamo).
 */
export type SeveridadAnalisis =
  | 'alerta_legal'
  | 'derecho_disponible'
  | 'informativo'

export interface AnalisisLegal {
  id: string
  severidad: SeveridadAnalisis
  titulo: string
  /** Descripción ya personalizada con el dato de esta boleta. */
  descripcion: string
  /** Acción concreta que puede tomar el usuario. */
  accionSugerida: string
  /** Cita de la norma aplicable. */
  fundamentoLegal: {
    norma: string
    resumen: string
    url: string
  }
}

function buildAnalisis(
  id: string,
  severidad: SeveridadAnalisis,
  titulo: string,
  descripcion: string,
  accionSugerida: string,
  referenciaId: ReferenciaLegalId,
): AnalisisLegal {
  const ref = TODA_NORMATIVA[referenciaId]
  return {
    id,
    severidad,
    titulo,
    descripcion,
    accionSugerida,
    fundamentoLegal: {
      norma: ref.norma,
      resumen: ref.resumen,
      url: ref.url,
    },
  }
}

// =============================================================================
// ANÁLISIS POR PATRÓN EN EL TEXTO O CARGOS
// =============================================================================

const RETROACTIVO_REGEX =
  /reliquidaci[óo]n|refacturaci[óo]n|ajuste\s+(?:cargo\s+)?(?:por\s+)?no\s+registro|cuota\s+\d+\s+de\s+\d+\s+cuota\s+reliquidaci/i

const LECTURA_ESTIMADA_REGEX =
  /lectura\s+estimada|consumo\s+estimado|estimaci[óo]n\s+de\s+consumo/i

const CORTE_PREVIO_REGEX =
  /corte\s+(?:de\s+)?(?:suministro|servicio)|suspensi[óo]n\s+del?\s+servicio|desconexi[óo]n\s+(?:por\s+)?(?:no\s+pago|mora)/i

const ELECTRODEPENDIENTE_REGEX =
  /electrodependient[ae]|persona\s+(?:con\s+)?dependencia\s+el[ée]ctrica/i

/**
 * Detecta cargos retroactivos (reliquidaciones, ajustes por no lectura
 * acumulada) y avisa al usuario sobre el límite legal de 4 meses.
 */
function analizarRefacturacion(boleta: ParsedBoleta): AnalisisLegal | null {
  if (!RETROACTIVO_REGEX.test(boleta.raw)) return null
  const referenciaId =
    boleta.servicio === 'electricidad'
      ? 'electricidad-refacturacion-4m'
      : boleta.servicio === 'agua'
        ? 'agua-refacturacion-4m'
        : 'gas-refacturacion-4m'
  return buildAnalisis(
    `refacturacion-${boleta.servicio}`,
    'derecho_disponible',
    'Tu boleta tiene un ajuste retroactivo',
    'Detectamos al menos un cargo etiquetado como reliquidación, refacturación o ajuste por no registro. La empresa solo puede cobrar consumos no facturados con antigüedad máxima de 4 meses. Si el ajuste corresponde a meses más antiguos, puedes negarte a pagar la parte fuera de plazo.',
    'Pide a la empresa el detalle del período al que corresponde el ajuste (mes exacto). Si supera 4 meses hacia atrás desde la fecha de emisión de esta boleta, reclama por escrito y escala a la SEC, SISS o SERNAC según corresponda.',
    referenciaId,
  )
}

/**
 * Detecta cargo por reposición de servicio sin que la boleta mencione
 * corte previo. La normativa exige corte documentado para que el cargo
 * sea legítimo.
 */
function analizarReposicionSinCorte(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  const tieneReposicion = boleta.cargos.some((c) =>
    /reposici[óo]n/i.test(c.concepto),
  )
  if (!tieneReposicion) return null
  if (CORTE_PREVIO_REGEX.test(boleta.raw)) return null
  const referenciaId =
    boleta.servicio === 'electricidad'
      ? 'electricidad-reposicion-post-corte'
      : boleta.servicio === 'agua'
        ? 'agua-reposicion-post-corte'
        : 'gas-reposicion-post-corte'
  return buildAnalisis(
    `reposicion-sin-corte-${boleta.servicio}`,
    'alerta_legal',
    'Te cobran reposición pero no hay corte registrado',
    'Tu boleta incluye un cargo por reposición de servicio, pero no aparece mención de un corte previo (ni en esta boleta ni en el detalle del período). El reglamento solo permite cobrar reposición si efectivamente hubo corte documentado.',
    'Reclama el retiro del cargo por escrito a la empresa. Pide el registro del corte: fecha, hora, motivo y aviso previo. Si no pueden documentarlo, el cargo es indebido y deben devolverlo.',
    referenciaId,
  )
}

/**
 * Detecta menciones de lectura estimada. Avisa que el cliente tiene
 * derecho a exigir relectura sin costo si se repite consecutivamente.
 */
function analizarLecturaEstimada(boleta: ParsedBoleta): AnalisisLegal | null {
  if (!LECTURA_ESTIMADA_REGEX.test(boleta.raw)) return null
  const referenciaId =
    boleta.servicio === 'electricidad'
      ? 'electricidad-lectura-estimada-2m'
      : boleta.servicio === 'agua'
        ? 'agua-lectura-estimada-2m'
        : 'gas-lectura-estimada-2m'
  return buildAnalisis(
    `lectura-estimada-${boleta.servicio}`,
    'derecho_disponible',
    'Tu medidor no fue leído físicamente este período',
    'Esta boleta usa lectura estimada en lugar de medición real. La empresa puede hacerlo ocasionalmente, pero está obligada a leer físicamente al menos cada 2 meses. Si el "estimado" se repite 3 meses consecutivos o más, tienes derecho a exigir relectura sin costo y a impugnar cualquier sobreconsumo facturado en ese período.',
    'Revisa tu boleta anterior. Si también dice "estimada", llama a la empresa y pide relectura inmediata sin costo. Si te cobran por el trámite o demoran más de 5 días hábiles en hacerla, reclama formalmente.',
    referenciaId,
  )
}

/**
 * Detecta cargo por potencia en una boleta marcada como BT-1
 * residencial. Solo BT-2 y superiores tienen ese cargo.
 */
function analizarCargoPotenciaEnBT1(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  const tarifa = clasificarTarifa(boleta.consumo.tarifa)
  if (tarifa.tipo !== 'BT-1') return null

  // Buscar cargos por demanda o potencia contratada (no por "potencia
  // base" que sí aparece en BT-1 como componente regulado).
  const tieneCargoPotenciaSospechoso = boleta.cargos.some(
    (c) =>
      /(?:demanda\s+m[áa]xima|potencia\s+contratada|cargo\s+por\s+potencia\s+contratada)/i.test(
        c.concepto,
      ) && c.monto > 0,
  )
  if (!tieneCargoPotenciaSospechoso) return null

  return buildAnalisis(
    'cargo-potencia-bt1',
    'alerta_legal',
    'Te cobran potencia contratada en tarifa BT-1',
    'Tu tarifa es BT-1 (residencial sin potencia contratada) pero aparece un cargo por demanda máxima o potencia contratada como ítem separado. La tarifa BT-1 no incluye este componente; o es un error de facturación, o la distribuidora te está facturando como BT-2 sin haberlo solicitado.',
    'Pide a la empresa que aclare por escrito tu tarifa contratada actual. Si efectivamente eres BT-1 y el cargo aparece, pide retiro inmediato y refacturación del período. Si te cambiaron a BT-2 sin tu consentimiento, exige reversión retroactiva.',
    'electricidad-potencia-solo-bt2',
  )
}

/**
 * Detecta multa por consumo reactivo en boleta residencial BT-1.
 */
function analizarMultaReactivoEnBT1(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  const tarifa = clasificarTarifa(boleta.consumo.tarifa)
  if (tarifa.tipo !== 'BT-1') return null

  const tieneMultaReactivo = boleta.cargos.some(
    (c) =>
      /multa\s+por\s+consumo\s+reactivo|recargo\s+factor\s+potencia/i.test(
        c.concepto,
      ) && c.monto > 0,
  )
  if (!tieneMultaReactivo) return null

  return buildAnalisis(
    'multa-reactivo-bt1',
    'alerta_legal',
    'Te cobran multa por consumo reactivo en BT-1 residencial',
    'La multa por consumo reactivo (factor de potencia bajo 0,93) solo aplica a clientes BT-3, BT-4 y AT (industriales y comerciales medianos). En tarifa BT-1 residencial este cargo no debería aparecer.',
    'Pide retiro del cargo y refacturación. Es probable que sea un error de la distribuidora o que estés facturado en una tarifa incorrecta.',
    'electricidad-multa-reactivo-industrial',
  )
}

/**
 * Sanitarias: detecta cargo de sobreconsumo punta o tarifa diferencial
 * de período punta fuera del rango 1-dic a 31-mar.
 */
function analizarPeriodoPuntaFueraDeVerano(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'agua') return null
  const fechaEmision = boleta.fechaEmision
  if (!fechaEmision || isNaN(fechaEmision.getTime())) return null

  const mes = fechaEmision.getMonth() // 0-11
  // Período punta legal: diciembre (11), enero (0), febrero (1), marzo (2).
  const esPeriodoPunta = mes === 11 || mes <= 2
  if (esPeriodoPunta) return null

  const tieneSobreconsumoPunta = boleta.cargos.some((c) =>
    /sobreconsumo|tarifa\s+punta|consumo\s+punta/i.test(c.concepto),
  )
  if (!tieneSobreconsumoPunta) return null

  return buildAnalisis(
    'agua-sobreconsumo-fuera-verano',
    'alerta_legal',
    'Te cobran sobreconsumo punta fuera del período legal',
    'Tu boleta tiene un cargo de sobreconsumo o tarifa punta, pero el período de emisión está fuera del rango diciembre-marzo en que aplica este recargo. Es un error de facturación.',
    'Pide a la sanitaria el detalle del cargo y la fecha del consumo medido. Si efectivamente fue medido fuera del período punta, exige retiro y refacturación.',
    'agua-periodo-punta-verano',
  )
}

/**
 * Cargo único en BT-1 sin desglose: marca derecho a pedir aclaración.
 */
function analizarCargoUnicoBT1(boleta: ParsedBoleta): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  const tarifa = clasificarTarifa(boleta.consumo.tarifa)
  if (tarifa.tipo !== 'BT-1') return null

  const tieneCargoUnico = boleta.cargos.some(
    (c) =>
      /(?<!sistema\s+)Cargo\s+[Úú]nico(?!\s+Sistema)/i.test(c.concepto) &&
      c.monto > 0,
  )
  if (!tieneCargoUnico) return null

  return buildAnalisis(
    'cargo-unico-bt1',
    'derecho_disponible',
    '"Cargo único" sin desglose en tu boleta',
    'Aparece un "Cargo único" como ítem separado en tu boleta BT-1. Este concepto no es estándar del pliego tarifario residencial; el cargo único legítimo es el de transmisión, que debe figurar como "Cargo por uso del sistema de transmisión". Tienes derecho a pedir desglose.',
    'Pide por escrito el detalle del concepto del "Cargo único": a qué partida del pliego tarifario corresponde. Si la empresa no puede justificarlo en 5 días hábiles, tienes derecho a impugnarlo.',
    'electricidad-cargo-unico-bt1',
  )
}

/**
 * Subsidio Ley 21.667 que no aparece como cargo negativo cuando el
 * texto de la boleta menciona el subsidio o la postulación.
 */
function analizarSubsidio21667Ausente(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  const mencionaSubsidio = /Ley\s+(?:N?[°º]?\s*)?21\.?667|Subsidio\s+El[ée]ctrico/i.test(
    boleta.raw,
  )
  if (!mencionaSubsidio) return null

  const tieneSubsidioComoDescuento = boleta.cargos.some(
    (c) =>
      /Subsidio\s+El[ée]ctrico|Ley\s+21\.?667/i.test(c.concepto) &&
      c.monto < 0,
  )
  if (tieneSubsidioComoDescuento) return null

  return buildAnalisis(
    'subsidio-21667-ausente',
    'derecho_disponible',
    'La boleta menciona el Subsidio Ley 21.667 pero no aparece como descuento',
    'En el texto de tu boleta aparece referencia al Subsidio Eléctrico Ley 21.667, pero no detectamos la línea con monto negativo que corresponde al descuento aplicado. Si postulaste y fuiste seleccionado, la distribuidora está obligada a aplicar el descuento automáticamente.',
    'Verifica tu estado de postulación en subsidioelectrico.cl con ClaveÚnica. Si efectivamente fuiste seleccionado, contacta a tu distribuidora para que aplique el descuento retroactivo y reporta el incumplimiento a la SEC.',
    'electricidad-subsidio-21667',
  )
}

/**
 * Electrodependientes: si la boleta menciona la palabra clave, recuerda
 * derecho a no corte.
 */
function analizarElectrodependientes(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  if (!ELECTRODEPENDIENTE_REGEX.test(boleta.raw)) return null
  return buildAnalisis(
    'electrodependiente-no-corte',
    'informativo',
    'Tu boleta menciona electrodependencia',
    'Si en tu hogar hay una persona electrodependiente (oxígeno, diálisis, refrigeración de medicamentos) inscrita en el Registro de Electrodependientes con tu distribuidora, esta NO PUEDE cortarte el suministro bajo ninguna circunstancia, ni siquiera por mora. Solo pueden negociar plan de pago.',
    'Verifica que la persona electrodependiente esté inscrita formalmente en el registro de tu distribuidora (CGE, Enel, SAESA, Frontel, Chilquinta) con certificado médico actualizado. Si recibes amenaza de corte, denuncia inmediatamente en SEC.',
    'comun-electrodependientes-no-corte',
  )
}

/**
 * Agua: el texto menciona el subsidio de agua potable (SAP / Ley 18.778)
 * pero no aparece como descuento (cargo con monto negativo). Análogo al
 * check de subsidio eléctrico, para agua.
 */
function analizarSubsidioSapAusente(boleta: ParsedBoleta): AnalisisLegal | null {
  if (boleta.servicio !== 'agua') return null
  const mencionaSubsidio =
    /Subsidio(?:\s+(?:al\s+)?(?:Pago|Consumo))?(?:\s+Agua)?|\bSAP\b|Ley\s+18\.?778/i.test(
      boleta.raw,
    )
  if (!mencionaSubsidio) return null

  const tieneSubsidioComoDescuento = boleta.cargos.some(
    (c) => /Subsidio/i.test(c.concepto) && c.monto < 0,
  )
  if (tieneSubsidioComoDescuento) return null

  return buildAnalisis(
    'agua-subsidio-sap-ausente',
    'derecho_disponible',
    'La boleta menciona el subsidio de agua potable pero no aparece como descuento',
    'En el texto de tu boleta aparece referencia al Subsidio al Pago del Consumo de Agua Potable (SAP), pero no detectamos la línea con monto negativo que corresponde al descuento aplicado. Si calificas y fuiste seleccionado, la sanitaria debe reflejarlo en la cuenta hasta los primeros 15 m³ (20 m³ para el tramo más vulnerable).',
    'El subsidio SAP se gestiona en tu municipalidad, no en la sanitaria. Verifica tu estado de postulación en el municipio. Si efectivamente fuiste seleccionado y el descuento no aparece, exígelo a la sanitaria y reporta a la SISS.',
    'agua-subsidio-sap',
  )
}

/**
 * Gas cilindro (tipoVenta producto): formato de cilindro no estándar.
 * El peso debe ser uno de los formatos legales (5, 11, 15, 45 kg) y el
 * cilindro debe entregar el peso neto declarado.
 */
function analizarPrecioCilindroGLP(boleta: ParsedBoleta): AnalisisLegal | null {
  if (
    boleta.tipoVenta !== 'producto' ||
    boleta.servicio !== 'gas' ||
    boleta.consumo.unidad !== 'kg'
  ) {
    return null
  }
  const FORMATOS_LEGALES = [5, 11, 15, 45]
  const kg = boleta.consumo.valor
  if (kg <= 0 || FORMATOS_LEGALES.includes(Math.round(kg))) return null

  return buildAnalisis(
    'gas-cilindro-formato-no-estandar',
    'derecho_disponible',
    'El cilindro facturado no tiene un formato estándar',
    `El cilindro facturado declara ${kg} kg, que no coincide con los formatos estándar de gas licuado en Chile (5, 11, 15 o 45 kg). Verifica que el peso neto entregado corresponda al que pagaste.`,
    'Pesa el cilindro con una balanza casera descontando la tara (el peso del cilindro vacío viene marcado en la parte superior). Si el gas neto pesa menos que el formato declarado, estás pagando por gas que no recibiste y puedes reclamar a la empresa y a la SEC.',
    'gas-peso-cilindro-exacto',
  )
}

/**
 * Gas cilindro: recargo de delivery cobrado como línea aparte. El
 * precio total (producto + delivery) debe estar publicado antes de la
 * compra (Ley 19.496 art. 28 y 30).
 */
function analizarRecargoDeliveryGLP(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'gas' || boleta.tipoVenta !== 'producto') return null
  const recargo = boleta.cargos.find(
    (c) =>
      /recargo\s+(?:de\s+)?(?:delivery|despacho|reparto)/i.test(c.concepto) &&
      c.monto > 0,
  )
  if (!recargo) return null

  return buildAnalisis(
    'gas-recargo-delivery-no-publicado',
    'derecho_disponible',
    'Te cobran un recargo de delivery como línea aparte',
    `Tu boleta de cilindro incluye un recargo de ${formatCLP(recargo.monto)} por delivery o despacho como línea separada. El precio total que pagas (cilindro más delivery) debe estar informado antes de que confirmes la compra.`,
    'Si este recargo no estaba publicado en el sitio web o el punto de venta al momento de hacer el pedido, es un cobro indebido por falta de información del precio. Pide el detalle y, si corresponde, reclama a SERNAC.',
    'gas-recargo-delivery-publicado',
  )
}

/** Helper local para formatear CLP en descripciones. */
function formatCLP(n: number): string {
  return `$ ${Math.round(n).toLocaleString('es-CL')}`
}

/**
 * Gas por red: la boleta menciona un posible corte por mora. Recuerda
 * el plazo legal de aviso previo de 10 días (distinto del de 15 días
 * de electricidad y agua).
 */
function analizarAvisoCorteGas(boleta: ParsedBoleta): AnalisisLegal | null {
  if (boleta.servicio !== 'gas' || boleta.tipoVenta === 'producto') return null
  const mencionaCorte =
    /aviso\s+de\s+corte|suspensi[óo]n\s+(?:del?\s+)?(?:suministro|servicio)|corte\s+por\s+(?:no\s+pago|mora)|fecha\s+de\s+corte/i.test(
      boleta.raw,
    )
  if (!mencionaCorte) return null

  return buildAnalisis(
    'gas-aviso-corte-10dias',
    'informativo',
    'Tu boleta menciona un posible corte de gas',
    'Antes de cortar el suministro de gas natural por red por mora, la empresa debe avisarte por escrito con al menos 10 días de anticipación (en gas el plazo es 10 días, no 15 como en luz y agua). El corte no puede ejecutarse en fines de semana ni feriados.',
    'Si recibiste aviso con menos de 10 días, o si te cortaron sin aviso escrito válido, el corte es irregular. Documenta las fechas y reclama a la SEC.',
    'gas-aviso-corte-10d',
  )
}

const TASA_MENSUAL_REGEX =
  /(?:inter[ée]s|tasa)[^%\n]{0,40}?(\d{1,2}(?:[.,]\d{1,2})?)\s*%\s*(?:mensual|al\s+mes|\/\s*mes|mes)/i

const MORA_CARGO_REGEX = /recargo\s+por\s+mora|inter[ée]s\s+(?:por\s+)?mora/i

/**
 * Interés moratorio que excede la Tasa Máxima Convencional. Si la boleta
 * declara una tasa mensual explícita sobre ~2,5% (≈34,5% anual), supera
 * el techo TMC para operaciones de monto bajo y es usura.
 */
function analizarInteresMoraSobreTMC(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  const m = boleta.raw.match(TASA_MENSUAL_REGEX)
  if (m) {
    const tasa = parseFloat(m[1].replace(',', '.'))
    if (Number.isFinite(tasa) && tasa > 2.5) {
      return buildAnalisis(
        'interes-mora-sobre-tmc',
        'alerta_legal',
        `Te cobran un interés por mora de ${tasa}% mensual`,
        `Tu boleta declara una tasa de interés por mora de ${tasa}% mensual, equivalente a más de 34% anual. Eso probablemente supera la Tasa Máxima Convencional que publica mensualmente la CMF para operaciones de monto bajo, lo que constituiría usura.`,
        'Compara la tasa con la Tasa Máxima Convencional vigente en cmfchile.cl. Si tu boleta la supera, el cobro del interés es nulo en su exceso. Reclama a SERNAC y a la CMF.',
        'comun-interes-mora-max-cmf',
      )
    }
    return null
  }
  // Fallback: hay cargo de mora pero sin tasa explícita. Solo informamos
  // el derecho (no podemos afirmar el incumplimiento sin la tasa).
  const tieneMora = boleta.cargos.some((c) => MORA_CARGO_REGEX.test(c.concepto))
  if (!tieneMora) return null
  return buildAnalisis(
    'interes-mora-verificar-tmc',
    'derecho_disponible',
    'Tu boleta tiene un recargo por mora',
    'Detectamos un recargo o interés por mora. El interés moratorio en boletas de servicios básicos no puede superar la Tasa Máxima Convencional que publica la CMF cada mes. Tienes derecho a pedir el detalle de cómo se calculó.',
    'Pide a la empresa la tasa mensual aplicada y compárala con la Tasa Máxima Convencional vigente en cmfchile.cl. Si la supera, reclama el exceso.',
    'comun-interes-mora-max-cmf',
  )
}

const INTERRUPCION_PROLONGADA_REGEX =
  /interrupci[óo]n\s+(?:de\s+)?(?:suministro|servicio)|horas?\s+sin\s+(?:suministro|luz|servicio)|d[íi]as?\s+sin\s+suministro|evento\s+de\s+(?:falla|interrupci[óo]n)/i

const COMPENSACION_REGEX = /compensaci[óo]n|descuento\s+por\s+(?:corte|interrupci)/i

/**
 * Electricidad: la boleta menciona interrupción prolongada pero no
 * aparece compensación automática (Ley 21.194). No podemos probar el
 * incumplimiento solo desde la boleta, así que es derecho_disponible.
 */
function analizarCompensacionCorteNoAplicada(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  if (!INTERRUPCION_PROLONGADA_REGEX.test(boleta.raw)) return null
  const tieneCompensacion =
    boleta.cargos.some((c) => COMPENSACION_REGEX.test(c.concepto) && c.monto < 0) ||
    COMPENSACION_REGEX.test(boleta.raw)
  if (tieneCompensacion) return null

  return buildAnalisis(
    'compensacion-corte-no-aplicada',
    'derecho_disponible',
    'Tu boleta menciona una interrupción pero no vemos compensación',
    'La boleta hace referencia a una interrupción del suministro, pero no detectamos una línea de compensación con monto negativo. Si la interrupción superó el estándar de calidad (típicamente más de 22 horas continuas para clientes residenciales), tienes derecho a compensación automática que la distribuidora debe abonar en tu boleta.',
    'Revisa cuántas horas estuviste sin luz. Si superó el estándar y no aparece compensación en esta boleta ni en la siguiente, reclama a la SEC: la compensación es automática y la empresa está obligada a aplicarla.',
    'electricidad-compensacion-corte',
  )
}

const RECARGO_INVIERNO_REGEX =
  /recargo\s+por\s+consumo\s+invierno|recargo\s+(?:de\s+|por\s+)?invierno/i

/**
 * Electricidad: recargo de invierno aplicado fuera del período legal
 * abril-septiembre. Solo zonas sur (SAESA/Frontel) lo usan.
 */
function analizarRecargoInviernoFueraTemporada(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad') return null
  const fechaEmision = boleta.fechaEmision
  if (!fechaEmision || isNaN(fechaEmision.getTime())) return null
  const mes = fechaEmision.getMonth() // 0-11
  // Período invernal legal: abril (3) a septiembre (8).
  const esInvierno = mes >= 3 && mes <= 8
  if (esInvierno) return null

  const tieneRecargoInvierno = boleta.cargos.some(
    (c) => RECARGO_INVIERNO_REGEX.test(c.concepto) && c.monto > 0,
  )
  if (!tieneRecargoInvierno) return null

  return buildAnalisis(
    'recargo-invierno-fuera-temporada',
    'alerta_legal',
    'Te cobran recargo de invierno fuera de temporada',
    'Tu boleta incluye un recargo de consumo de invierno, pero la fecha de emisión está fuera del período abril-septiembre en que este recargo aplica. Es un error de facturación.',
    'Pide a la distribuidora el detalle del cargo y el período del consumo medido. Si fue medido fuera del período invernal, exige retiro del recargo y refacturación.',
    'electricidad-recargo-invierno-temporada',
  )
}

/**
 * Agua: cobran alcantarillado pero no facturan agua potable. El cargo
 * de recolección es proporcional al consumo de agua potable, así que
 * alcantarillado sin agua potable carece de base.
 */
function analizarRatioAlcantarillado(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  if (boleta.servicio !== 'agua') return null
  const sumarPositivos = (re: RegExp) =>
    boleta.cargos
      .filter((c) => re.test(c.concepto) && c.monto > 0)
      .reduce((s, c) => s + c.monto, 0)
  const alc = sumarPositivos(/alcantarillado|recolecci[óo]n/i)
  const ap = sumarPositivos(/consumo\s+agua\s+potable|consumo\s+agua/i)

  // Solo el caso sólido: alcantarillado cobrado sin agua potable
  // facturada, habiendo consumo medido.
  if (alc > 0 && ap === 0 && boleta.consumo.valor > 0) {
    return buildAnalisis(
      'agua-alcantarillado-sin-agua-potable',
      'alerta_legal',
      'Te cobran alcantarillado sin agua potable facturada',
      'Tu boleta tiene un cargo de alcantarillado (recolección) pero no aparece el cargo de consumo de agua potable, a pesar de que sí hay consumo medido. El cargo de alcantarillado se calcula proporcional al agua potable consumida, así que un alcantarillado sin agua potable facturada no tiene base.',
      'Pide a la sanitaria el desglose completo: cuánto cobran por agua potable y cuánto por alcantarillado. Si efectivamente falta la base de agua potable, el cargo de alcantarillado es indebido.',
      'agua-alcantarillado-proporcional',
    )
  }
  return null
}

/**
 * Electricidad y agua: la boleta menciona un posible corte por mora.
 * Recuerda el plazo legal de aviso previo de 15 días (en gas son 10,
 * cubierto por analizarAvisoCorteGas).
 */
function analizarAvisoCorteLuzAgua(boleta: ParsedBoleta): AnalisisLegal | null {
  if (boleta.servicio !== 'electricidad' && boleta.servicio !== 'agua') {
    return null
  }
  const mencionaCorte =
    /aviso\s+de\s+corte|suspensi[óo]n\s+(?:del?\s+)?(?:suministro|servicio)|corte\s+por\s+(?:no\s+pago|mora)|fecha\s+de\s+corte/i.test(
      boleta.raw,
    )
  if (!mencionaCorte) return null
  const referenciaId =
    boleta.servicio === 'electricidad'
      ? 'electricidad-aviso-corte-15d'
      : 'agua-aviso-corte-15d'
  return buildAnalisis(
    `aviso-corte-15dias-${boleta.servicio}`,
    'informativo',
    'Tu boleta menciona un posible corte',
    'Antes de cortar el suministro por mora, la empresa debe avisarte por escrito (boleta o carta) con al menos 15 días de anticipación, indicando el monto adeudado y la fecha de corte. El corte no procede en fines de semana ni feriados, ni si en tu hogar hay una persona electrodependiente inscrita.',
    'Si recibiste aviso con menos de 15 días, o si te cortaron sin aviso escrito válido, el corte es irregular: la reposición debe ser rápida y sin cobrarte. Documenta las fechas y reclama a la SEC o SISS según corresponda.',
    referenciaId,
  )
}

const OTROS_CARGOS_REGEX = /^(?:otros\s+cargos?|otros|varios)$/i

/**
 * Cobro genérico "Otros cargos" / "Otros" sin desglose. El consumidor
 * tiene derecho a recibir el detalle de cada cargo.
 */
function analizarOtrosCargosSinDesglose(
  boleta: ParsedBoleta,
): AnalisisLegal | null {
  const generico = boleta.cargos.find(
    (c) => OTROS_CARGOS_REGEX.test(c.concepto.trim()) && c.monto > 0,
  )
  if (!generico) return null
  return buildAnalisis(
    'otros-cargos-sin-desglose',
    'derecho_disponible',
    'Tu boleta tiene un cargo genérico sin desglose',
    `Aparece un cargo etiquetado como "${generico.concepto.trim()}" por ${formatCLP(generico.monto)} sin detalle de a qué corresponde. Tienes derecho a recibir el desglose de cada concepto que te cobran.`,
    'Pide por escrito a la empresa el detalle de ese cargo: qué partidas incluye y bajo qué fundamento. Tienen 5 días hábiles para responder. Si no lo justifican, puedes impugnarlo.',
    'comun-derecho-desglose',
  )
}

// =============================================================================
// ENTRY POINT
// =============================================================================

/**
 * Ejecuta todos los análisis legales aplicables a una boleta parseada.
 * Devuelve una lista de hallazgos ordenados por severidad (alerta legal
 * primero, luego derechos disponibles, luego informativos).
 *
 * Es idempotente y puro: no muta la boleta. El UI decide cómo mostrar
 * los hallazgos.
 */
export function analizarLegalmente(boleta: ParsedBoleta): AnalisisLegal[] {
  const checks = [
    analizarRefacturacion,
    analizarReposicionSinCorte,
    analizarLecturaEstimada,
    analizarCargoPotenciaEnBT1,
    analizarMultaReactivoEnBT1,
    analizarPeriodoPuntaFueraDeVerano,
    analizarCargoUnicoBT1,
    analizarSubsidio21667Ausente,
    analizarElectrodependientes,
    // Checks agregados en la ronda 2 del audit (verificados
    // adversarialmente, fundamento en normativa-chilena.ts).
    analizarSubsidioSapAusente,
    analizarPrecioCilindroGLP,
    analizarRecargoDeliveryGLP,
    analizarAvisoCorteGas,
    analizarInteresMoraSobreTMC,
    analizarCompensacionCorteNoAplicada,
    analizarRecargoInviernoFueraTemporada,
    analizarRatioAlcantarillado,
    analizarAvisoCorteLuzAgua,
    analizarOtrosCargosSinDesglose,
  ]
  const SEVERIDAD_ORDEN: Record<SeveridadAnalisis, number> = {
    alerta_legal: 0,
    derecho_disponible: 1,
    informativo: 2,
  }
  return checks
    .map((fn) => fn(boleta))
    .filter((r): r is AnalisisLegal => r !== null)
    .sort((a, b) => SEVERIDAD_ORDEN[a.severidad] - SEVERIDAD_ORDEN[b.severidad])
}
