/**
 * Normativa chilena aplicable a servicios básicos (electricidad, agua,
 * gas). Los plazos y límites citados acá son la base legal de los
 * análisis de boletas en `src/lib/parsers/_analisis-legales.ts`.
 *
 * Cada constante incluye:
 *   - El texto legal específico que la fundamenta.
 *   - URL pública oficial donde el usuario puede verificar.
 *   - Una explicación legible para el usuario final.
 *
 * Última revisión normativa: 2026-06-04. Si una ley se reforma, los
 * análisis derivados pueden quedar desactualizados; revisar
 * trimestralmente con sec.cl, siss.gob.cl y bcn.cl/leychile.
 */

export interface ReferenciaLegal {
  /** Identificador corto para citar en sospechas. */
  id: string
  /** Nombre completo y artículo aplicable. */
  norma: string
  /** Resumen legible para el usuario. */
  resumen: string
  /** URL oficial. Si no hay URL específica del artículo, link al cuerpo legal. */
  url: string
  /** Servicio al que aplica. */
  servicio: 'electricidad' | 'agua' | 'gas' | 'todos'
}

// =============================================================================
// ELECTRICIDAD: Ley General de Servicios Eléctricos y reglamentos
// =============================================================================

/**
 * DFL 4/2006 (Ley General de Servicios Eléctricos) y su reglamento
 * Decreto Supremo 327/1997. Marco general del sector eléctrico chileno.
 *
 * Reformas relevantes:
 *   - Ley 21.667 (2024): subsidio eléctrico a hogares vulnerables.
 *   - Ley 21.185 (2019): FET (Fondo de Estabilización de Tarifas).
 *   - Ley 21.194 (2019): mejoras en calidad de servicio y compensaciones.
 */

export const NORMATIVA_ELECTRICIDAD = {
  'electricidad-refacturacion-4m': {
    id: 'electricidad-refacturacion-4m',
    norma: 'DS 327/1997 Reglamento, Art. 290; modificado por Ley 20.928',
    resumen:
      'Una distribuidora no puede refacturar consumos con más de 4 meses de antigüedad. Si tu boleta tiene un ajuste o reliquidación retroactivo más allá de ese plazo, puedes negarte a pagar la parte fuera de plazo.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=258171',
    servicio: 'electricidad' as const,
  },
  'electricidad-lectura-estimada-2m': {
    id: 'electricidad-lectura-estimada-2m',
    norma: 'DS 327/1997 Reglamento, Art. 251 y siguientes',
    resumen:
      'La distribuidora está obligada a hacer lectura física del medidor al menos cada 2 meses. Si tu boleta marca "lectura estimada" 3 meses consecutivos o más, tienes derecho a exigir relectura sin costo.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=258171',
    servicio: 'electricidad' as const,
  },
  'electricidad-aviso-corte-15d': {
    id: 'electricidad-aviso-corte-15d',
    norma: 'DFL 4/2006 Art. 141; DS 327/1997 Art. 280',
    resumen:
      'Antes de cortar el suministro por mora, la distribuidora debe enviarte aviso por escrito (boleta o carta) con al menos 15 días de antelación. Cortes sin aviso previo válido son ilegales y aplican multa SEC.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=258171',
    servicio: 'electricidad' as const,
  },
  'electricidad-potencia-solo-bt2': {
    id: 'electricidad-potencia-solo-bt2',
    norma: 'Pliego Tarifario SEC, tarifas BT-1 vs BT-2/BT-3',
    resumen:
      'La tarifa BT-1 residencial NO tiene cargo por potencia contratada. Si tu boleta es BT-1 y aparece "Cargo por demanda máxima" o "Cargo por potencia contratada" como ítem separado, es un error de facturación o estás siendo facturado como BT-2 sin haberlo solicitado.',
    url: 'https://www.sec.cl/sitio-web/wp-content/uploads/2023/09/ANEXO_MODELO_TARIFASDX-FACTURACIONDX_V6a_ResEx19180.pdf',
    servicio: 'electricidad' as const,
  },
  'electricidad-multa-reactivo-industrial': {
    id: 'electricidad-multa-reactivo-industrial',
    norma: 'NTSyCS (Norma Técnica de Seguridad y Calidad de Servicio) Art. 4-7',
    resumen:
      'La multa por consumo reactivo aplica cuando el factor de potencia cae bajo 0,93. Sólo aplica a clientes industriales y comerciales con BT-3, BT-4 o AT. En BT-1 residencial NO debería aparecer; si la ves, es un error.',
    url: 'https://www.cne.cl/normativas/electrica/normas-tecnicas/',
    servicio: 'electricidad' as const,
  },
  'electricidad-reposicion-post-corte': {
    id: 'electricidad-reposicion-post-corte',
    norma: 'DS 327/1997 Reglamento, Art. 282',
    resumen:
      'El cargo por reposición de servicio solo procede si hubo un corte previo documentado. Si tu boleta tiene "Cargo por reposición" pero no aparece registro del corte (ni en esta boleta ni en la anterior), tienes derecho a pedir retiro del cargo.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=258171',
    servicio: 'electricidad' as const,
  },
  'electricidad-compensacion-corte': {
    id: 'electricidad-compensacion-corte',
    norma: 'Ley 21.194 Art. 16 bis; NTSyCS',
    resumen:
      'Tienes derecho a compensación automática en tu boleta por interrupciones de suministro superiores al estándar (típicamente 22 horas continuas para clientes residenciales). El monto se calcula según horas sin servicio × cargo fijo prorrateado.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=1135713',
    servicio: 'electricidad' as const,
  },
  'electricidad-subsidio-21667': {
    id: 'electricidad-subsidio-21667',
    norma: 'Ley 21.667 Art. 1-3; Decreto Exento N° 136/2024',
    resumen:
      'Si calificaste y fuiste seleccionado para el Subsidio Eléctrico Ley 21.667, la distribuidora está obligada a aplicar el descuento automáticamente como línea con monto negativo en tu boleta. El monto va entre $11.700 y $32.224 mensuales según tramo RSH y composición familiar. Si no aparece, contacta a la SEC.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=1198976',
    servicio: 'electricidad' as const,
  },
  'electricidad-cargo-unico-bt1': {
    id: 'electricidad-cargo-unico-bt1',
    norma: 'Pliego Tarifario SEC, componentes regulares BT-1',
    resumen:
      'El "Cargo único" no es un componente estándar del pliego tarifario BT-1 residencial. Tienes derecho a exigir desglose del concepto: el cargo único legítimo es el de transmisión, que debe aparecer como "Cargo por uso del sistema de transmisión".',
    url: 'https://www.sec.cl/sitio-web/wp-content/uploads/2023/09/ANEXO_MODELO_TARIFASDX-FACTURACIONDX_V6a_ResEx19180.pdf',
    servicio: 'electricidad' as const,
  },
} as const

// =============================================================================
// AGUA: Ley de Servicios Sanitarios y reglamentos SISS
// =============================================================================

/**
 * DFL 382/1989 (Ley General de Servicios Sanitarios) y su reglamento
 * DS 1199/2004 y DS 70/2009. Subsidio SAP regulado por Ley 18.778.
 */

export const NORMATIVA_AGUA = {
  'agua-refacturacion-4m': {
    id: 'agua-refacturacion-4m',
    norma: 'DS 1199/2004 Reglamento Servicios Sanitarios, Art. 100',
    resumen:
      'Las sanitarias no pueden cobrar consumos retroactivos con más de 4 meses de antigüedad. Si tu boleta tiene un ajuste o reliquidación retroactiva más allá de ese plazo, puedes negarte a pagar la parte fuera de plazo.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=229406',
    servicio: 'agua' as const,
  },
  'agua-periodo-punta-verano': {
    id: 'agua-periodo-punta-verano',
    norma: 'DS 70/2009; Tarifas SISS por sanitaria',
    resumen:
      'El sobreconsumo punta y la tarifa diferencial de período punta solo aplican entre el 1 de diciembre y el 31 de marzo (verano). Si aparece un cargo de "Sobreconsumo punta" o "Período punta" en una boleta emitida fuera de esos meses, es un error de facturación.',
    url: 'https://www.siss.gob.cl/',
    servicio: 'agua' as const,
  },
  'agua-lectura-estimada-2m': {
    id: 'agua-lectura-estimada-2m',
    norma: 'DS 1199/2004 Reglamento Servicios Sanitarios, Art. 80',
    resumen:
      'La sanitaria debe leer tu medidor al menos cada 2 meses. Si aparece "lectura estimada" 3 meses consecutivos o más, tienes derecho a exigir relectura sin costo y a impugnar cualquier sobreconsumo facturado en ese período.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=229406',
    servicio: 'agua' as const,
  },
  'agua-subsidio-sap': {
    id: 'agua-subsidio-sap',
    norma: 'Ley 18.778 Subsidio al Pago del Consumo de Agua Potable',
    resumen:
      'El Subsidio al Pago del Consumo de Agua Potable (SAP) descuenta entre 25% y 85% del consumo facturado hasta los primeros 15 m³ (hasta 20 m³ para el tramo más vulnerable, sin alza de agosto-noviembre). Si calificas socialmente y la sanitaria no lo está aplicando, contacta a tu municipio.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=29881',
    servicio: 'agua' as const,
  },
  'agua-reposicion-post-corte': {
    id: 'agua-reposicion-post-corte',
    norma: 'DS 1199/2004 Reglamento Servicios Sanitarios, Art. 117',
    resumen:
      'El cargo por reposición de servicio sanitario solo procede si hubo corte previo documentado. Sin registro del corte, el cargo es indebido.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=229406',
    servicio: 'agua' as const,
  },
  'agua-aviso-corte-15d': {
    id: 'agua-aviso-corte-15d',
    norma: 'DFL 382/1989 Art. 35; DS 1199/2004 Art. 116',
    resumen:
      'La sanitaria debe enviarte aviso por escrito con al menos 15 días de antelación antes de cortar el suministro por mora. Cortes sin aviso previo válido son ilegales y aplican sanción SISS.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=29903',
    servicio: 'agua' as const,
  },
  'agua-alcantarillado-proporcional': {
    id: 'agua-alcantarillado-proporcional',
    norma: 'DS 70/2009 Art. 5-7; Tarifas SISS',
    resumen:
      'El cargo por servicio de alcantarillado se calcula como un porcentaje del consumo de agua potable (típicamente entre 70% y 90% según la sanitaria). Si la sanitaria te cobra alcantarillado sin que figure consumo de agua potable, o el ratio es muy distinto al normal, es un error.',
    url: 'https://www.siss.gob.cl/',
    servicio: 'agua' as const,
  },
} as const

// =============================================================================
// GAS: Ley de Servicios de Gas y reglamentos SEC
// =============================================================================

/**
 * DFL 323/1931 (Ley de Servicios de Gas) y su reglamento DS 67/2004.
 * Aplica a gas natural por red (Metrogas, Gasvalpo, Gas Sur).
 *
 * Gas licuado (cilindros) NO está regulado por la SEC en precio
 * (precio libre); pero la calidad y seguridad sí caen bajo SEC.
 */

export const NORMATIVA_GAS = {
  'gas-refacturacion-4m': {
    id: 'gas-refacturacion-4m',
    norma: 'DS 67/2004 Reglamento Servicios de Gas, Art. 47',
    resumen:
      'La empresa de gas natural por red no puede refacturar consumos con más de 4 meses de antigüedad. Si tu boleta tiene un ajuste retroactivo o reliquidación más allá de ese plazo, puedes negarte a pagar la parte fuera de plazo.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=226458',
    servicio: 'gas' as const,
  },
  'gas-lectura-estimada-2m': {
    id: 'gas-lectura-estimada-2m',
    norma: 'DS 67/2004 Reglamento Servicios de Gas, Art. 38',
    resumen:
      'La empresa de gas natural debe leer tu medidor al menos cada 2 meses. Si aparece "lectura estimada" 3 meses consecutivos o más, tienes derecho a exigir relectura sin costo.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=226458',
    servicio: 'gas' as const,
  },
  'gas-aviso-corte-10d': {
    id: 'gas-aviso-corte-10d',
    norma: 'DFL 323/1931 Art. 30; DS 67/2004 Art. 56',
    resumen:
      'Antes de cortar el suministro de gas natural por mora, la empresa debe enviarte aviso por escrito con al menos 10 días de antelación. Cortes sin aviso previo válido aplican sanción SEC.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=29991',
    servicio: 'gas' as const,
  },
  'gas-reposicion-post-corte': {
    id: 'gas-reposicion-post-corte',
    norma: 'DS 67/2004 Reglamento Servicios de Gas, Art. 58',
    resumen:
      'El cargo por reposición del servicio de gas natural solo procede si hubo corte previo documentado. Sin registro del corte (en esta o la boleta anterior), el cargo es indebido.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=226458',
    servicio: 'gas' as const,
  },
  'gas-peso-cilindro-exacto': {
    id: 'gas-peso-cilindro-exacto',
    norma: 'Ley 19.496 Art. 13 Derechos del Consumidor; DS 67/2004',
    resumen:
      'Los cilindros de gas licuado (5kg, 11kg, 15kg, 45kg) deben respetar el peso neto declarado. Lipigas, Abastible y Gasco están obligadas a entregar el peso exacto. Si el cilindro pesa menos de lo declarado (con balanza casera de cocina, descontando tara que aparece marcada en el cilindro), puedes reclamar.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=61438',
    servicio: 'gas' as const,
  },
  'gas-recargo-delivery-publicado': {
    id: 'gas-recargo-delivery-publicado',
    norma: 'Ley 19.496 Art. 28 Derechos del Consumidor (publicidad y precio)',
    resumen:
      'Las empresas de cilindro pueden cobrar recargo por delivery, pero el precio total (cilindro + delivery) debe estar publicado claramente antes de la compra. Recargos sorpresa no informados al momento de la orden son indebidos.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=61438',
    servicio: 'gas' as const,
  },
} as const

// =============================================================================
// COMUNES (todos los servicios)
// =============================================================================

export const NORMATIVA_COMUNES = {
  'comun-interes-mora-max-cmf': {
    id: 'comun-interes-mora-max-cmf',
    norma: 'Ley 18.010 Art. 6; Tasa Máxima Convencional publicada por CMF',
    resumen:
      'El interés por mora cobrado en tu boleta no puede exceder la Tasa Máxima Convencional publicada mensualmente por la CMF. Para deudas de servicios básicos (operaciones no reajustables, montos bajos), la TMC ronda el 30-40% anual. Si te cobran más, es usura y puedes reclamar a SERNAC y CMF.',
    url: 'https://www.cmfchile.cl/portal/estadisticas/606/w3-propertyvalue-19154.html',
    servicio: 'todos' as const,
  },
  'comun-derecho-desglose': {
    id: 'comun-derecho-desglose',
    norma: 'Ley 19.496 Art. 13 y 17; Reglamentos sectoriales',
    resumen:
      'Tienes derecho a recibir el detalle desglosado de cada cargo que aparece en tu boleta. Si la empresa cobra "Otros cargos" o conceptos genéricos sin explicación, puedes exigir desglose por escrito en un plazo de 5 días hábiles.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=61438',
    servicio: 'todos' as const,
  },
  'comun-reclamo-5-dias': {
    id: 'comun-reclamo-5-dias',
    norma: 'Ley 19.496 Art. 12 y 50 G; Reglamentos sectoriales',
    resumen:
      'Si reclamas formalmente a la empresa por un cobro, tienen 5 días hábiles para responder en casos simples (15 días para casos con monto en disputa). Pide siempre un número de ticket o folio del reclamo: lo necesitarás como antecedente si escalas a SEC, SISS o SERNAC.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=61438',
    servicio: 'todos' as const,
  },
  'comun-electrodependientes-no-corte': {
    id: 'comun-electrodependientes-no-corte',
    norma: 'Ley 21.012 Resguardo de personas electrodependientes',
    resumen:
      'Si en tu hogar hay una persona electrodependiente (oxígeno, diálisis, refrigeración de medicamentos) inscrita en el Registro de Electrodependientes con tu distribuidora, ESTA NO PUEDE CORTARTE el suministro eléctrico bajo ninguna circunstancia, ni siquiera por mora. Solo puede negociar plan de pago.',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=1104604',
    servicio: 'electricidad' as const,
  },
} as const

// Conjunto unificado para iteración.
export const TODA_NORMATIVA = {
  ...NORMATIVA_ELECTRICIDAD,
  ...NORMATIVA_AGUA,
  ...NORMATIVA_GAS,
  ...NORMATIVA_COMUNES,
} as const

export type ReferenciaLegalId = keyof typeof TODA_NORMATIVA
