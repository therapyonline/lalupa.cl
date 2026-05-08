import { describe, expect, it } from 'vitest'
import { GASCO_NORMAL } from '../__fixtures__/gasco-normal'
import { ParserError } from '../errors'
import { gascoParser, parseGasco } from './gasco'

describe('gascoParser metadata', () => {
  it('declara empresa "Gasco GLP" y servicio "gas"', () => {
    expect(gascoParser.empresa).toBe('Gasco GLP')
    expect(gascoParser.servicio).toBe('gas')
  })

  it('expone fingerprint con RUT GLP', () => {
    expect(gascoParser.fingerprint.keywords).toContain('96.568.740-8')
  })
})

describe('gascoParser.detect', () => {
  it('detecta Gasco GLP', () => {
    expect(gascoParser.detect('Gasco GLP S.A.')).toBe(true)
  })

  it('detecta gasco.cl', () => {
    expect(gascoParser.detect('gasco.cl')).toBe(true)
  })
})

describe('gascoParser.parse', () => {
  it('marca tipoVenta = "producto" (cilindro, no consumo)', () => {
    const r = parseGasco(GASCO_NORMAL)
    expect(r.tipoVenta).toBe('producto')
  })

  it('extrae total $19.990 e IVA $3.192', () => {
    const r = parseGasco(GASCO_NORMAL)
    expect(r.totales.total).toBe(19990)
    expect(r.totales.iva).toBe(3192)
  })

  it('extrae el cargo "Cilindro Gas Licuado"', () => {
    const r = parseGasco(GASCO_NORMAL)
    const conceptos = r.cargos.map((c) => c.concepto)
    expect(conceptos).toContain('Cilindro Gas Licuado')
  })

  it('extrae el peso del cilindro como consumo (15 kg)', () => {
    const r = parseGasco(GASCO_NORMAL)
    expect(r.consumo.unidad).toBe('kg')
    expect(r.consumo.valor).toBe(15)
  })

  it('rechaza vacío con EMPTY_TEXT', () => {
    try {
      parseGasco('')
    } catch (err) {
      expect((err as ParserError).code).toBe('EMPTY_TEXT')
    }
  })
})
