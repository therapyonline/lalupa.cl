export type {
  AguaSlug,
  Cargo,
  Empresa,
  EmpresaElectrica,
  EmpresaGas,
  EmpresaSanitaria,
  EmpresaSlug,
  Fingerprint,
  GasSlug,
  ParsedBoleta,
  ParserModule,
  Servicio,
  TipoVenta,
  UnidadConsumo,
} from './types'

export { AGUA_SLUGS, EMPRESA_SLUGS, GAS_SLUGS } from './types'

export { ParserError, type ParserErrorCode } from './errors'

export {
  detectDistribuidora,
  detectGas,
  detectSanitaria,
  extractTextFromBoleta,
  extractTextFromPDF,
} from './engine'

export {
  disposeOcrWorker,
  extractTextFromImage,
  type OcrProgress,
} from './ocr'

export {
  clearParsers,
  detectParser,
  getParser,
  listParsers,
  registerParser,
} from './registry'

export {
  ELECTRICIDAD_PARSERS,
  cgeParser,
  chilquintaParser,
  enelParser,
  frontelParser,
  isElectricidadParserImplemented,
  parseCGE,
  parseElectricidad,
  saesaParser,
} from './electricidad'

export type { ParserElectricidad } from './electricidad'

export {
  AGUA_PARSERS,
  aguasandinasParser,
  essbioParser,
  esvalParser,
  isAguaParserImplemented,
  nuevosurParser,
  parseAgua,
  smapaParser,
} from './agua'

export type { ParserAgua } from './agua'

export {
  GAS_PARSERS,
  abastibleParser,
  gascoParser,
  isGasParserImplemented,
  lipigasParser,
  metrogasParser,
  parseGas,
} from './gas'

export type { ParserGas } from './gas'
