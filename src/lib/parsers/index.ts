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

export {
  AGUA_SLUGS,
  EMPRESA_SLUGS,
  GAS_SLUGS,
  SLUG_TO_EMPRESA_ELECTRICA,
  SLUG_TO_EMPRESA_SANITARIA,
  SLUG_TO_EMPRESA_GAS,
} from './types'

export { ParserError, type ParserErrorCode } from './errors'

export {
  detectDistribuidora,
  detectGas,
  detectSanitaria,
  extractTextFromBoleta,
  extractTextFromImages,
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
  clasificarTarifa,
  enelParser,
  frontelParser,
  isElectricidadParserImplemented,
  parseCGE,
  parseElectricidad,
  saesaParser,
} from './electricidad'

export type { ParserElectricidad, TipoTarifa } from './electricidad'

// Análisis legal ortogonal: aplica sobre cualquier ParsedBoleta y
// detecta alertas con fundamento en normativa chilena (DS 327, DS
// 1199, DS 67, leyes 21.667, 21.012, 19.496, etc.).
export {
  analizarLegalmente,
  type AnalisisLegal,
  type SeveridadAnalisis,
} from './_analisis-legales'

export {
  AGUA_PARSERS,
  aguasDelValleParser,
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
  gasSurParser,
  gasvalpoParser,
  isGasParserImplemented,
  lipigasParser,
  metrogasParser,
  parseGas,
} from './gas'

export type { ParserGas } from './gas'
