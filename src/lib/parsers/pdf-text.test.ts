import { describe, expect, it } from 'vitest'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { joinPdfTextItems } from './pdf-text'

function item(str: string, y = 100, hasEOL = false): TextItem {
  return { str, dir: 'ltr', transform: [1, 0, 0, 1, 0, y], height: 10,
    width: 50, fontName: 'test', hasEOL }
}

describe('texto de PDF', () => {
  it('conserva cargos en líneas distintas aunque PDF.js no marque hasEOL', () => {
    expect(joinPdfTextItems([
      item('Cargo fijo'), item('1.048'), item('Energía', 80), item('20.000', 80),
    ])).toBe('Cargo fijo 1.048\nEnergía 20.000')
  })
  it('respeta saltos explícitos y omite marcadores de contenido', () => {
    expect(joinPdfTextItems([
      item('CGE', 100, true), { type: 'beginMarkedContent', id: 'header' },
      item('TOTAL', 100), item('30.000', 99),
    ])).toBe('CGE\nTOTAL 30.000')
  })
  it('devuelve vacío para páginas sin texto', () => {
    expect(joinPdfTextItems([])).toBe('')
  })
})
