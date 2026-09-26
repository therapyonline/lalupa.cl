import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

/** Mantiene el orden de PDF.js y los saltos que necesitan los parsers por línea. */
export function joinPdfTextItems(items: Array<TextItem | TextMarkedContent>): string {
  let output = ''
  let previous: TextItem | undefined
  for (const item of items) {
    if (!('str' in item)) continue
    const changedLine = previous &&
      Math.abs(item.transform[5] - previous.transform[5]) > Math.max(2, previous.height / 2)
    if (output && !output.endsWith('\n')) {
      output += changedLine ? '\n' : ' '
    }
    output += item.str
    if (item.hasEOL) output += '\n'
    previous = item
  }
  return output.trim()
}
