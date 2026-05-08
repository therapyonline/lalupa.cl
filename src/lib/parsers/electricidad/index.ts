import { ParserError } from '../errors'
import { getParser, registerParser } from '../registry'
import type { EmpresaElectrica, ParsedBoleta } from '../types'
import { cgeParser, parseCGE } from './cge'
import { chilquintaParser } from './chilquinta'
import { enelParser } from './enel'
import { frontelParser } from './frontel'
import { saesaParser } from './saesa'

// Side-effect: registra los 5 módulos al cargar este archivo. Cada vez que
// alguien hace `import '@/lib/parsers/electricidad'` el registry queda listo.
registerParser(cgeParser)
registerParser(enelParser)
registerParser(saesaParser)
registerParser(frontelParser)
registerParser(chilquintaParser)

const IMPLEMENTED = new Set<EmpresaElectrica>([
  'CGE',
  'Enel',
  'SAESA',
  'Frontel',
  'Chilquinta',
])

export type ParserElectricidad = (text: string) => ParsedBoleta

/**
 * Wrapper backward-compat: delega al registry.
 */
export function parseElectricidad(
  empresa: EmpresaElectrica,
  text: string,
): ParsedBoleta {
  const parser = getParser(empresa, 'electricidad')
  if (!parser) {
    throw new ParserError(
      'NOT_IMPLEMENTED',
      `Parser de ${empresa} no encontrado en el registry.`,
    )
  }
  return parser.parse(text)
}

/**
 * Wrapper backward-compat: el record sigue exponiendo las 5 funciones.
 */
export const ELECTRICIDAD_PARSERS: Record<
  EmpresaElectrica,
  ParserElectricidad
> = {
  CGE: cgeParser.parse,
  Enel: enelParser.parse,
  SAESA: saesaParser.parse,
  Frontel: frontelParser.parse,
  Chilquinta: chilquintaParser.parse,
}

export function isElectricidadParserImplemented(
  empresa: EmpresaElectrica,
): boolean {
  return IMPLEMENTED.has(empresa)
}

export {
  cgeParser,
  chilquintaParser,
  enelParser,
  frontelParser,
  parseCGE,
  saesaParser,
}
