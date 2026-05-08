export type ParserErrorCode =
  | 'EMPTY_TEXT'
  | 'WRONG_EMPRESA'
  | 'INVALID_FORMAT'
  | 'NOT_IMPLEMENTED'

export class ParserError extends Error {
  readonly code: ParserErrorCode

  constructor(code: ParserErrorCode, message: string) {
    super(message)
    this.name = 'ParserError'
    this.code = code
    Object.setPrototypeOf(this, ParserError.prototype)
  }
}
