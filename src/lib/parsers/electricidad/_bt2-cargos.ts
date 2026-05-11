/**
 * Cargos eléctricos canónicos BT-2 / BT-3 / AT (alta tensión).
 *
 * Fuente: SEC, ANEXO MODELO TARIFAS DX-FACTURACIÓN DX V6a Resolución
 * Exenta 19180. Catálogo oficial de los 19 cargos que pueden aparecer
 * en boletas chilenas según tarifa.
 *
 * Estos cargos NO aparecen en hogares BT-1 residenciales típicos
 * (consumo < 10 kW). Aparecen en:
 *   - BT-2: hogares con potencia contratada (sauna, piscina, aire
 *     acondicionado central, calefacción eléctrica)
 *   - BT-3: comercio mediano
 *   - AT-2/AT-3/AT-4: industrial
 *
 * Las distribuidoras (CGE, Enel, Saesa, Frontel, Chilquinta) usan los
 * mismos labels canónicos en sus boletas porque el formato lo regula
 * la SEC, no cada empresa.
 *
 * Si una boleta BT-2 trae estos cargos y el parser no los detecta, el
 * total estimado queda corto y el usuario ve un análisis incompleto.
 */

import { buildCargoPattern } from '../_helpers'

/**
 * Cargos BT-2/BT-3 canónicos. Cada parser de electricidad importa este
 * array y lo concatena a sus CARGO_PATTERNS específicos. Los conceptos
 * son únicos para evitar duplicación con los patterns BT-1 locales.
 */
export const BT2_CARGO_PATTERNS: ReadonlyArray<{
  concepto: string
  pattern: RegExp
}> = [
  // === DEMANDA MÁXIMA ===
  // Boletas BT-2 cobran por la potencia máxima leída en el período. Hay
  // varias variantes según horario (punta vs fuera de punta) y origen
  // (leída vs contratada). El parser las captura como cargos separados
  // para preservar el detalle.
  {
    concepto: 'Cargo por demanda máxima de potencia suministrada',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+demanda\\s+m[áa]xima\\s+de\\s+potencia\\s+suministrada(?!\\s+o)',
    ),
  },
  {
    concepto: 'Cargo por demanda máxima de potencia contratada o suministrada',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+demanda\\s+m[áa]xima\\s+de\\s+potencia\\s+contratada\\s+o\\s+suministrada',
    ),
  },
  {
    concepto:
      'Cargo por demanda máxima de potencia contratada o leída en horas de punta',
    pattern: buildCargoPattern(
      'Cargo\\s+(?:por\\s+)?[Dd]emanda\\s+[Mm][áa]xima\\s+(?:de\\s+)?[Pp]otencia\\s+[Cc]ontratada\\s+o\\s+[Ll]e[íi]da,?\\s*en\\s+horas\\s+(?:de\\s+)?punta',
    ),
  },
  {
    // Variantes de CGE industrial reales:
    //   "Cargo Demanda Maxima Leida de Potencia en horas punta" (Hospital Naval 2018)
    //   "Cargo por Demanda Máxima de Potencia Leída en horas de punta" (canónico SEC)
    // El orden Leída/Potencia puede invertirse según versión del template.
    // Envolvemos la alternation en `(?: ... )` para que el grupo de
    // captura del número en buildCargoPattern aplique a ambas variantes.
    concepto: 'Cargo por demanda máxima de potencia leída en horas de punta',
    pattern: buildCargoPattern(
      '(?:Cargo\\s+(?:por\\s+)?[Dd]emanda\\s+[Mm][áa]xima\\s+[Ll]e[íi]da\\s+(?:de\\s+)?[Pp]otencia\\s+en\\s+horas\\s+(?:de\\s+)?punta|Cargo\\s+(?:por\\s+)?[Dd]emanda\\s+[Mm][áa]xima\\s+(?:de\\s+)?[Pp]otencia\\s+[Ll]e[íi]da\\s+en\\s+horas\\s+(?:de\\s+)?punta)',
    ),
  },
  {
    concepto: 'Cargo por demanda máxima suministrada',
    pattern: buildCargoPattern(
      'Cargo\\s+(?:por\\s+)?[Dd]emanda\\s+[Mm][áa]xima\\s+suministrada(?!\\s+de)',
    ),
  },

  // === POTENCIA CONTRATADA / INVIERNO ===
  // Cargos estacionales o por compromiso fijo. "Potencia adicional de
  // invierno" aplica en zonas frías (sur de Chile, abril-septiembre) y
  // se cobra sobre el exceso vs la potencia base.
  {
    concepto: 'Cargo por potencia adicional de invierno',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+potencia\\s+adicional\\s+de\\s+invierno',
    ),
  },
  {
    concepto:
      'Cargo por potencia contratada o demanda máxima de potencia leída',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+potencia\\s+contratada\\s+o\\s+demanda\\s+m[áa]xima\\s+de\\s+potencia\\s+le[íi]da',
    ),
  },
  {
    concepto: 'Cargo por potencia de invierno',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+potencia\\s+de\\s+invierno(?!\\s+adicional)',
    ),
  },

  // === FET (Fondo Estabilización Tarifaria) y RECARGOS ===
  // El "FET" es un mecanismo de estabilización post-2019 que aparece en
  // boletas residenciales BT-1 a partir de 2024 como Cargo por Servicio
  // Público. Acá la variante explícita "FET".
  {
    concepto: 'Cargo por servicio público FET',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+servicio\\s+p[úu]blico\\s+FET',
    ),
  },
  // Cliente AT que la distribuidora lee en BT (raro, clientes con
  // empalme atípico). Tarifa específica del modelo SEC.
  {
    concepto: 'Recargo por lectura en Baja Tensión de consumos AT',
    pattern: buildCargoPattern(
      'Recargo\\s+por\\s+lectura\\s+en\\s+Baja\\s+Tensi[óo]n\\s+de\\s+consumos',
    ),
  },

  // === CARGOS POTENCIA PRESENTE EN PUNTA (BT-3 / AT-3 PEP) ===
  // Distinto de "Demanda Máxima Leída en horas de punta" (AT-4): este
  // se cobra como `potencia_kW × tarifa_unitaria` y aplica a clientes
  // BT-3/AT-3 que tienen consumo presente en horario punta. Visto en
  // facturas Hospital Hernán Henríquez (Temuco) marzo y enero 2018.
  {
    concepto: 'Cargo por Potencia Presente en Punta',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+Potencia\\s+Presente\\s+en\\s+Punta(?:\\s*\\([^)]*\\))?',
    ),
  },

  // === MULTAS POR FACTOR DE POTENCIA ===
  // Cuando el factor de potencia cae bajo 0.93 (industrial), la
  // distribuidora cobra multa por reactivos. Porcentaje variable
  // dentro del label (4%, 5%, 16%) pero no es parte de la key.
  {
    concepto: 'Multa por Consumo Reactivo',
    pattern: buildCargoPattern(
      'Multa\\s+por\\s+Consumo\\s+Reactivo(?:\\s*\\([^)]*\\))?',
    ),
  },
  // Variante legacy 2017: mismo concepto con label distinto.
  {
    concepto: 'Recargo Factor Potencia',
    pattern: buildCargoPattern(
      'Recargo\\s+Factor\\s+Potencia(?:\\s*\\([^)]*\\))?',
    ),
  },

  // === MORA Y AJUSTES POR PAGO ===
  // "Pago de la Cuenta Fuera de Plazo" en industriales CGE es distinto
  // de "Recargo por mora" (BT-1). Aplica cuando la boleta anterior se
  // pagó tarde y arrastra recargo a la actual.
  {
    concepto: 'Pago de la Cuenta Fuera de Plazo',
    pattern: buildCargoPattern(
      'Pago\\s+de\\s+la\\s+Cuenta\\s+Fuera\\s+de\\s+Plazo',
    ),
  },

  // Ajuste de redondeo a peso entero. En facturas eléctricas industriales
  // CGE aparece como par "Mes Anterior" + "Mes Actual" similar a las
  // sanitarias SISS-family. Cada uno es cargo independiente.
  {
    concepto: 'Ajuste para Facilitar el Pago en Efectivo, Mes Anterior',
    pattern: buildCargoPattern(
      'Ajuste\\s+para\\s+Facilitar\\s+el\\s+Pago\\s+en\\s+Efectivo,?\\s+Mes\\s+Anterior',
    ),
  },
  {
    concepto: 'Ajuste para Facilitar el Pago en Efectivo, Mes Actual',
    pattern: buildCargoPattern(
      'Ajuste\\s+para\\s+Facilitar\\s+el\\s+Pago\\s+en\\s+Efectivo,?\\s+Mes\\s+Actual',
    ),
  },

  // === ARRIENDOS DE EQUIPOS (industriales) ===
  // Clientes industriales arriendan medidor y a veces equipos extra
  // (transformador, banco condensadores).
  {
    concepto: 'Arriendo de Medidor',
    pattern: buildCargoPattern(
      'Arriendo\\s+(?:de\\s+)?Medidor(?!\\s+por\\s+Reliquidaci[óo]n)',
    ),
  },
  {
    concepto: 'Arriendo Otros Equipos',
    pattern: buildCargoPattern('Arriendo\\s+Otros\\s+Equipos'),
  },

  // === SALDOS ANTERIORES (3 líneas distintas en facturas grandes) ===
  // CGE separa en facturas industriales:
  //   - "Saldo Anterior Vencido" (capital de boletas no pagadas a tiempo)
  //   - "Saldo Anterior Servicio Eléctrico" (capital boleta inmediata)
  //   - "Otro Saldo Anterior" (intereses arrastrados u otros)
  // El parser captura las 3 como cargos independientes para que el
  // total sume correcto y el usuario vea el desglose completo.
  {
    concepto: 'Saldo Anterior Vencido',
    pattern: buildCargoPattern('Saldo\\s+Anterior\\s+Vencido'),
  },
  {
    concepto: 'Saldo Anterior Servicio Eléctrico',
    pattern: buildCargoPattern(
      'Saldo\\s+Anterior\\s+Servicio\\s+El[ée]ctrico',
    ),
  },
  {
    concepto: 'Otro Saldo Anterior',
    pattern: buildCargoPattern('Otro\\s+Saldo\\s+Anterior'),
  },

  // === OTROS CARGOS GENÉRICOS ===
  // CGE usa "Otros Cargos" como línea catch-all. Puede ser positivo
  // o negativo (ajustes misceláneos).
  {
    concepto: 'Otros Cargos',
    pattern: buildCargoPattern('Otros\\s+Cargos(?!\\s+\\w)'),
  },

  // === LABELS LEGACY CGE 2016-2017 ===
  // Antes de 2018 CGE usaba labels más cortos. Mapeamos al concepto
  // canónico moderno para consistencia en el frontend.
  {
    concepto: 'Cargo Único Sistema Troncal',
    pattern: buildCargoPattern('Cargo\\s+[Uú]nico\\s+Sistema\\s+Troncal'),
  },
  {
    // "Demanda Suministrada" legacy 2017 = "Cargo por Demanda Máxima
    // Suministrada" canónico moderno.
    concepto: 'Demanda Suministrada',
    pattern: buildCargoPattern(
      '(?<![A-Za-zÁÉÍÓÚáéíóúñÑ])Demanda\\s+Suministrada(?:\\s*\\([^)]*\\))?',
    ),
  },
  {
    // "Demanda Hp" legacy 2017 = "Cargo por Demanda Máxima Leída en
    // horas de punta" canónico moderno.
    concepto: 'Demanda Hp',
    pattern: buildCargoPattern(
      '(?<![A-Za-zÁÉÍÓÚáéíóúñÑ])Demanda\\s+Hp(?:\\s*\\([^)]*\\))?',
    ),
  },
]
