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
