import { ParserError } from '../errors'
import { getParser, registerParser } from '../registry'
import type { EmpresaGas, ParsedBoleta } from '../types'
import { abastibleParser } from './abastible'
import { gascoParser } from './gasco'
import { lipigasParser } from './lipigas'
import { metrogasParser } from './metrogas'

// Side-effect: registra los 4 módulos al cargar este archivo.
registerParser(metrogasParser)
registerParser(lipigasParser)
registerParser(abastibleParser)
registerParser(gascoParser)

const IMPLEMENTED = new Set<EmpresaGas>([
  'Metrogas',
  'Lipigas',
  'Abastible',
  'Gasco GLP',
])

export type ParserGas = (text: string) => ParsedBoleta

/**
 * Wrapper backward-compat: delega al registry.
 */
export function parseGas(empresa: EmpresaGas, text: string): ParsedBoleta {
  const parser = getParser(empresa, 'gas')
  if (!parser) {
    throw new ParserError(
      'NOT_IMPLEMENTED',
      `Parser de ${empresa} no encontrado en el registry.`,
    )
  }
  return parser.parse(text)
}

export const GAS_PARSERS: Record<EmpresaGas, ParserGas> = {
  Metrogas: metrogasParser.parse,
  Lipigas: lipigasParser.parse,
  Abastible: abastibleParser.parse,
  'Gasco GLP': gascoParser.parse,
}

export function isGasParserImplemented(empresa: EmpresaGas): boolean {
  return IMPLEMENTED.has(empresa)
}

export { abastibleParser, gascoParser, lipigasParser, metrogasParser }
