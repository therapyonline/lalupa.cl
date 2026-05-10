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

/**
 * Parsea el código tarifario y devuelve el tipo de tarifa + nota
 * legible para el usuario.
 */
export function clasificarTarifa(codigo: string | undefined): {
  tipo: TipoTarifa
  esResidencial: boolean
  conPotenciaContratada: boolean
  nota: string
} {
  if (!codigo) {
    return {
      tipo: 'desconocida',
      esResidencial: false,
      conPotenciaContratada: false,
      nota: 'No detectamos el código tarifario en tu boleta.',
    }
  }

  const normalizada = codigo.toUpperCase().replace(/\s+/g, '')

  if (/^(TR)?BT-?1[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-1',
      esResidencial: true,
      conPotenciaContratada: false,
      nota:
        'Tarifa BT-1 residencial estándar. Pagas cargo fijo + cargo por energía consumida.',
    }
  }

  if (/^(TR)?BT-?2[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-2',
      esResidencial: true,
      conPotenciaContratada: true,
      nota:
        'Tarifa BT-2 con potencia contratada. Pagas cargo fijo + energía + un cargo extra por potencia, aunque no la uses. Común en hogares con calefacción eléctrica, sauna o aire acondicionado central.',
    }
  }

  if (/^(TR)?BT-?3[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-3',
      esResidencial: false,
      conPotenciaContratada: true,
      nota:
        'Tarifa BT-3 con horario punta y fuera de punta. Típica de comercio mediano.',
    }
  }

  if (/^(TR)?BT-?[4-9](\.\d+)?[A-Z]?$/.test(normalizada)) {
    return {
      tipo: 'BT-industrial',
      esResidencial: false,
      conPotenciaContratada: true,
      nota:
        'Tarifa BT industrial. Boleta con cargos específicos por demanda máxima y servicios.',
    }
  }

  if (/^(TR)?AT-?[2-4]\d*$/.test(normalizada)) {
    return {
      tipo: 'AT',
      esResidencial: false,
      conPotenciaContratada: true,
      nota:
        'Tarifa de Alta Tensión. Boleta industrial con cargos de potencia leída en hora punta.',
    }
  }

  return {
    tipo: 'desconocida',
    esResidencial: false,
    conPotenciaContratada: false,
    nota: `Código tarifario "${codigo}" no reconocido en el catálogo SEC.`,
  }
}
