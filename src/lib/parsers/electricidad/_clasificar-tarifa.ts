/**
 * Clasifica el tipo de tarifa eléctrica desde el código tarifario que
 * aparece en la boleta (campo `tarifa` del consumo). Útil para mostrar
 * contexto al usuario: BT-1 residencial vs BT-2 con potencia contratada
 * (que paga cargos extra que el usuario común no conoce).
 *
 * Fuente: SEC, Resolución Exenta 19180 ANEXO MODELO TARIFAS DX V6a.
 * Códigos canónicos del pliego tarifario chileno:
 *
 *   BT-1, BT-1A, BT-1B   Residencial estándar (sin potencia contratada)
 *   BT-2                 Potencia contratada (hogares grandes, comercio)
 *   BT-3                 Comercio con horario punta/fuera de punta
 *   BT-4, BT-4.1-3       Industrial liviano
 *   BT-5, BT-5A-B        Alumbrado público y servicios especiales
 *   AT-2, AT-3, AT-4     Alta tensión (industrial pesada)
 *   TR variants          Tarifa Regulada (variantes de las anteriores)
 *
 * Notas:
 *   - Algunas distribuidoras usan formatos abreviados sin guión: `BT1`,
 *     `BT2` (CGE en boletas más antiguas). El regex acepta ambos.
 *   - Chilquinta a veces sufija con letra: `BT-1A`, `BT-1B`.
 */

export type TipoTarifa =
  | 'BT-1' // residencial sin potencia, sin horario
  | 'BT-2' // potencia contratada
  | 'BT-3' // comercio con punta/fuera de punta
  | 'BT-industrial' // BT-4 y superiores
  | 'AT' // alta tensión
  | 'desconocida'

export interface TarifaClasificada {
  tipo: TipoTarifa
  esResidencial: boolean
  conPotenciaContratada: boolean
  /**
   * Si el cliente tiene consumo presente en horario punta. CGE marca
   * esto con sufijo "PRESENTE EN PUNTA" o "PARCIALMENTE PRESENTE EN
   * PUNTA" en el código tarifario. Visto en BT-3, AT-3, AT-4 reales.
   */
  presenteEnPunta: boolean
  /** Subtipo legible si aplica (ej. "PARCIAL"). */
  presenteEnPuntaSubtipo?: 'PARCIAL'
  nota: string
}

/**
 * Detecta sufijo "PRESENTE EN PUNTA" / "PARCIALMENTE PRESENTE EN PUNTA"
 * del código tarifario CGE industrial. Retorna info y código base
 * limpio para el resto de la clasificación.
 *
 * Códigos vistos en facturas reales (Hospital Hernán Henríquez Temuco,
 * Hospital Naval Talcahuano):
 *   - `AT 3 PRESENTE EN PUNTA`
 *   - `BT 3 PRESENTE EN PUNTA`
 *   - `BT 3 PARCIALMENTE PRESENTE EN PUNTA`
 *   - `AT 2 PRESENTE EN PUNTA`
 *   - `AT 4.3` (sin PEP)
 *
 * Notar que CGE usa SPACE entre "AT/BT" y el número, no guión.
 */
function extraerPresenteEnPunta(codigo: string): {
  codigoBase: string
  presenteEnPunta: boolean
  presenteEnPuntaSubtipo?: 'PARCIAL'
} {
  const upper = codigo.toUpperCase()
  if (/PARCIALMENTE\s+PRESENTE\s+EN\s+PUNTA/.test(upper)) {
    return {
      codigoBase: upper.replace(/PARCIALMENTE\s+PRESENTE\s+EN\s+PUNTA/, '').trim(),
      presenteEnPunta: true,
      presenteEnPuntaSubtipo: 'PARCIAL',
    }
  }
  if (/PRESENTE\s+EN\s+PUNTA/.test(upper)) {
    return {
      codigoBase: upper.replace(/PRESENTE\s+EN\s+PUNTA/, '').trim(),
      presenteEnPunta: true,
    }
  }
  return { codigoBase: codigo, presenteEnPunta: false }
}

/**
 * Parsea el código tarifario y devuelve el tipo de tarifa + nota
 * legible para el usuario.
 */
export function clasificarTarifa(
  codigo: string | undefined,
): TarifaClasificada {
  if (!codigo) {
    return {
      tipo: 'desconocida',
      esResidencial: false,
      conPotenciaContratada: false,
      presenteEnPunta: false,
      nota: 'No detectamos el código tarifario en tu boleta.',
    }
  }

  // Extrae sufijo PEP antes de normalizar para no perderlo.
  const { codigoBase, presenteEnPunta, presenteEnPuntaSubtipo } =
    extraerPresenteEnPunta(codigo)
  const normalizada = codigoBase.toUpperCase().replace(/\s+/g, '')
  const pepNota = presenteEnPunta
    ? presenteEnPuntaSubtipo === 'PARCIAL'
      ? ' Tu consumo es parcialmente presente en punta (algunos meses tienes consumo en horario punta).'
      : ' Tu consumo es presente en punta: se cobra cargo por potencia en hora de mayor demanda.'
    : ''

  if (/^(TR)?BT-?1[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-1',
      esResidencial: true,
      conPotenciaContratada: false,
      presenteEnPunta,
      presenteEnPuntaSubtipo,
      nota:
        'Tarifa BT-1 residencial estándar. Pagas cargo fijo + cargo por energía consumida.' +
        pepNota,
    }
  }

  if (/^(TR)?BT-?2[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-2',
      esResidencial: true,
      conPotenciaContratada: true,
      presenteEnPunta,
      presenteEnPuntaSubtipo,
      nota:
        'Tarifa BT-2 con potencia contratada. Pagas cargo fijo + energía + un cargo extra por potencia, aunque no la uses. Común en hogares con calefacción eléctrica, sauna o aire acondicionado central.' +
        pepNota,
    }
  }

  if (/^(TR)?BT-?3[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-3',
      esResidencial: false,
      conPotenciaContratada: true,
      presenteEnPunta,
      presenteEnPuntaSubtipo,
      nota:
        'Tarifa BT-3 con horario punta y fuera de punta. Típica de comercio mediano.' +
        pepNota,
    }
  }

  if (/^(TR)?BT-?[4-9](\.\d+)?[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-industrial',
      esResidencial: false,
      conPotenciaContratada: true,
      presenteEnPunta,
      presenteEnPuntaSubtipo,
      nota:
        'Tarifa BT industrial. Boleta con cargos específicos por demanda máxima y servicios.' +
        pepNota,
    }
  }

  if (/^(TR)?AT-?[2-4](\.\d+)?\d*$/.test(normalizada)) {
    return {
      tipo: 'AT',
      esResidencial: false,
      conPotenciaContratada: true,
      presenteEnPunta,
      presenteEnPuntaSubtipo,
      nota:
        'Tarifa de Alta Tensión. Boleta industrial con cargos de potencia leída en hora punta.' +
        pepNota,
    }
  }

  return {
    tipo: 'desconocida',
    esResidencial: false,
    conPotenciaContratada: false,
    presenteEnPunta,
    presenteEnPuntaSubtipo,
    nota: `Código tarifario "${codigo}" no reconocido en el catálogo SEC.`,
  }
}
