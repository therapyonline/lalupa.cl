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
      'Cargo\\s+por\\s+demanda\\s+m[áa]xima\\s+de\\s+potencia\\s+contratada\\s+o\\s+le[íi]da,?\\s*en\\s+horas\\s+de\\s+punta',
    ),
  },
  {
    concepto: 'Cargo por demanda máxima de potencia leída en horas de punta',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+demanda\\s+m[áa]xima\\s+de\\s+potencia\\s+le[íi]da\\s+en\\s+horas\\s+de\\s+punta',
    ),
  },
  {
    concepto: 'Cargo por demanda máxima suministrada',
    pattern: buildCargoPattern(
      'Cargo\\s+por\\s+demanda\\s+m[áa]xima\\s+suministrada(?!\\s+de)',
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
]
