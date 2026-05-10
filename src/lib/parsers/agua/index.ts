import { ParserError } from '../errors'
import { getParser, registerParser } from '../registry'
import type { EmpresaSanitaria, ParsedBoleta } from '../types'
import { aguasandinasParser } from './aguasandinas'
import { aguasDelValleParser } from './aguas-del-valle'
import { essbioParser } from './essbio'
import { esvalParser } from './esval'
import { nuevosurParser } from './nuevosur'
import { smapaParser } from './smapa'

// Side-effect: registra los 6 módulos al cargar este archivo.
registerParser(aguasandinasParser)
registerParser(esvalParser)
registerParser(essbioParser)
registerParser(nuevosurParser)
registerParser(smapaParser)
registerParser(aguasDelValleParser)

const IMPLEMENTED = new Set<EmpresaSanitaria>([
  'Aguas Andinas',
  'Esval',
  'ESSBio',
  'Nuevosur',
  'SMAPA',
  'Aguas del Valle',
])

export type ParserAgua = (text: string) => ParsedBoleta

/**
 * Wrapper backward-compat: delega al registry.
 */
export function parseAgua(
  empresa: EmpresaSanitaria,
  text: string,
): ParsedBoleta {
  const parser = getParser(empresa, 'agua')
  if (!parser) {
    throw new ParserError(
      'NOT_IMPLEMENTED',
      `Parser de ${empresa} no encontrado en el registry.`,
    )
  }
  return parser.parse(text)
}

export const AGUA_PARSERS: Record<EmpresaSanitaria, ParserAgua> = {
  'Aguas Andinas': aguasandinasParser.parse,
  Esval: esvalParser.parse,
  ESSBio: essbioParser.parse,
  Nuevosur: nuevosurParser.parse,
  SMAPA: smapaParser.parse,
  'Aguas del Valle': aguasDelValleParser.parse,
}

export function isAguaParserImplemented(empresa: EmpresaSanitaria): boolean {
  return IMPLEMENTED.has(empresa)
}

export {
  aguasandinasParser,
  aguasDelValleParser,
  essbioParser,
  esvalParser,
  nuevosurParser,
  smapaParser,
}
