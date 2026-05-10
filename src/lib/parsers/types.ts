export type EmpresaElectrica =
  | 'CGE'
  | 'Enel'
  | 'SAESA'
  | 'Frontel'
  | 'Chilquinta'

export type EmpresaSanitaria =
  | 'Aguas Andinas'
  | 'Esval'
  | 'ESSBio'
  | 'Nuevosur'
  | 'SMAPA'
  | 'Aguas del Valle'

export type EmpresaGas = 'Metrogas' | 'Lipigas' | 'Abastible' | 'Gasco GLP'

export type Empresa = EmpresaElectrica | EmpresaSanitaria | EmpresaGas

export type Servicio = 'electricidad' | 'agua' | 'gas'

export type UnidadConsumo = 'kWh' | 'm3' | 'kg' | 'unidades'

/**
 * Discrimina si la boleta corresponde a un consumo medido por período
 * (electricidad BT-1, agua potable, gas natural por red) o a una venta
 * directa de productos (cilindros de gas licuado).
 *
 * Default `'consumo'` para mantener backward compat con parsers viejos.
 */
export type TipoVenta = 'consumo' | 'producto'

export interface Cargo {
  concepto: string
  monto: number
  detalle?: string
  sospechoso?: boolean
  razonSospecha?: string
}

export interface ParsedBoleta {
  empresa: Empresa
  servicio: Servicio
  /** Por defecto 'consumo'. Para boletas de cilindro / venta directa, usar 'producto'. */
  tipoVenta?: TipoVenta
  periodo: { desde: Date; hasta: Date }
  cliente: { nombre?: string; direccion?: string; numeroCliente?: string }
  consumo: { unidad: UnidadConsumo; valor: number; tarifa?: string }
  cargos: Cargo[]
  totales: { subtotal: number; iva: number; total: number }
  fechaEmision?: Date
  fechaVencimiento?: Date
  raw: string
}

export type EmpresaSlug = 'cge' | 'enel' | 'saesa' | 'frontel' | 'chilquinta'

export const EMPRESA_SLUGS: Record<EmpresaElectrica, EmpresaSlug> = {
  CGE: 'cge',
  Enel: 'enel',
  SAESA: 'saesa',
  Frontel: 'frontel',
  Chilquinta: 'chilquinta',
}

/** Reverse map slug → empresa (para manual override desde URL chip). */
export const SLUG_TO_EMPRESA_ELECTRICA: Record<EmpresaSlug, EmpresaElectrica> = {
  cge: 'CGE',
  enel: 'Enel',
  saesa: 'SAESA',
  frontel: 'Frontel',
  chilquinta: 'Chilquinta',
}

export type AguaSlug =
  | 'aguas-andinas'
  | 'esval'
  | 'essbio'
  | 'nuevosur'
  | 'smapa'
  | 'aguas-del-valle'

export const AGUA_SLUGS: Record<EmpresaSanitaria, AguaSlug> = {
  'Aguas Andinas': 'aguas-andinas',
  Esval: 'esval',
  ESSBio: 'essbio',
  Nuevosur: 'nuevosur',
  SMAPA: 'smapa',
  'Aguas del Valle': 'aguas-del-valle',
}

/** Reverse map para manual override desde chip. */
export const SLUG_TO_EMPRESA_SANITARIA: Record<AguaSlug, EmpresaSanitaria> = {
  'aguas-andinas': 'Aguas Andinas',
  esval: 'Esval',
  essbio: 'ESSBio',
  nuevosur: 'Nuevosur',
  smapa: 'SMAPA',
  'aguas-del-valle': 'Aguas del Valle',
}

export type GasSlug = 'metrogas' | 'lipigas' | 'abastible' | 'gasco-glp'

export const GAS_SLUGS: Record<EmpresaGas, GasSlug> = {
  Metrogas: 'metrogas',
  Lipigas: 'lipigas',
  Abastible: 'abastible',
  'Gasco GLP': 'gasco-glp',
}

/** Reverse map para manual override desde chip. */
export const SLUG_TO_EMPRESA_GAS: Record<GasSlug, EmpresaGas> = {
  metrogas: 'Metrogas',
  lipigas: 'Lipigas',
  abastible: 'Abastible',
  'gasco-glp': 'Gasco GLP',
}

export interface Fingerprint {
  keywords: string[]
  format: string
}

export interface ParserModule {
  empresa: string
  servicio: Servicio
  detect(text: string): boolean
  parse(text: string): ParsedBoleta
  fingerprint: Fingerprint
}
