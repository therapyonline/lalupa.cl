/**
 * Boleta CGE sintética basada en /research/02-boletas-reales/FINGERPRINTS.md.
 *
 * NO es una boleta real. Cuando llegue una boleta real de CGE, agregar
 * `cge-real-YYYY-MM.ts` y actualizar el `-normal.ts` para que apunte ahí.
 */

export const CGE_SYNTHETIC_NORMAL = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl

N° Cliente: 12345678-9
Tarifa: BT1
Período facturado: 15/04/2026 al 15/05/2026
Fecha de emisión: 16/05/2026
Fecha de vencimiento: 30/05/2026

Consumo: 280 kWh

DETALLE DE CARGOS:
Cargo fijo BT1 ............... $ 1.048
Cargo por energía ............ $ 45.234
Cargo por uso del sistema de transmisión ... $ 4.470
Cargo por servicio público ... $ 240
Cargo por compras de potencia ... $ 498
Cargo por potencia base ...... $ 42.244

Subtotal ..................... $ 93.734
IVA 19% ...................... $ 17.809
Total a pagar ................ $ 111.543
`
