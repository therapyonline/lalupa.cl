import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PARSER_ASSETS } from '@/generated/parser-assets'
const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), ocr: vi.fn() }))
vi.mock('pdfjs-dist', () => ({
  getDocument: mocks.getDocument,
  GlobalWorkerOptions: {},
}))
vi.mock('./ocr', () => ({ extractTextFromImage: mocks.ocr }))
import { extractTextFromPDF, extractPdfWithOcr, pdfRasterScale } from './pdf'
import { normalizeBoletaFile, MAX_FILE_BYTES } from './file-input'

const file = new File(['pdf'], 'boleta.pdf', { type: 'application/pdf' })
const nativeText =
  'CGE DISTRIBUCION Boleta de electricidad Cliente 1234567 Consumo 100 kWh Total 45000'
function page(text: string, pageNumber = 1) {
  return {
    pageNumber,
    getTextContent: vi
      .fn()
      .mockResolvedValue({ items: [{ str: text, hasEOL: true }] }),
    getViewport: vi.fn(({ scale }) => ({
      width: 600 * scale,
      height: 800 * scale,
    })),
    render: vi.fn(() => ({ promise: Promise.resolve() })),
    cleanup: vi.fn(),
  }
}
let pages: ReturnType<typeof page>[], destroy: ReturnType<typeof vi.fn>
let canvas: {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
  toBlob: ReturnType<typeof vi.fn>
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('window', {})
  pages = [page(nativeText)]
  destroy = vi.fn().mockResolvedValue(undefined)
  mocks.getDocument.mockImplementation(() => ({
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: async (n: number) => pages[n - 1],
    }),
    destroy,
  }))
  mocks.ocr.mockResolvedValue(
    'Cargos de la segunda página: Seguro 15000 Consumo 100 kWh',
  )
  canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({})),
    toBlob: vi.fn((callback) =>
      callback(new Blob(['png'], { type: 'image/png' })),
    ),
  }
  vi.stubGlobal('document', { createElement: vi.fn(() => canvas) })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('PDF por página', () => {
  it('lee texto nativo sin OCR y configura todos los recursos locales', async () => {
    expect(await extractTextFromPDF(file)).toContain('Total 45000')
    expect(mocks.ocr).not.toHaveBeenCalled()
    expect(mocks.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        cMapUrl: `${PARSER_ASSETS.pdfBase}/cmaps/`,
        wasmUrl: `${PARSER_ASSETS.pdfBase}/wasm/`,
        standardFontDataUrl: `${PARSER_ASSETS.pdfBase}/standard_fonts/`,
      }),
    )
    expect(pages[0].cleanup).toHaveBeenCalledOnce()
    expect(destroy).toHaveBeenCalledOnce()
  })
  it('conserva la página escaneada de un PDF mixto y reporta progreso de ambas', async () => {
    pages.push(page('', 2))
    const progress = vi.fn()
    const result = await extractPdfWithOcr(file, progress)
    expect(result).toContain(nativeText)
    expect(result).toContain('Seguro 15000')
    expect(mocks.ocr).toHaveBeenCalledOnce()
    expect(mocks.ocr.mock.calls[0][0].name).toBe('pagina-2.png')
    expect(progress).toHaveBeenLastCalledWith({
      status: 'Página 2 de 2: Leída',
      progress: 1,
    })
    expect(canvas.width).toBe(0)
    expect(canvas.height).toBe(0)
  })
  it('rechaza un PDF de más de 10 páginas sin truncarlo', async () => {
    pages = Array.from({ length: 11 }, () => page(nativeText))
    await expect(extractPdfWithOcr(file)).rejects.toThrow('tiene 11 páginas')
    expect(destroy).toHaveBeenCalledOnce()
    expect(pages[0].getTextContent).not.toHaveBeenCalled()
  })
  it('no publica una extracción incompleta si falla la segunda página', async () => {
    pages.push(page('', 2))
    mocks.ocr.mockRejectedValueOnce(new Error('No se pudo leer'))
    await expect(extractPdfWithOcr(file)).rejects.toThrow('página 2 de 2')
    expect(pages[1].cleanup).toHaveBeenCalledOnce()
    expect(destroy).toHaveBeenCalledOnce()
  })
  it.each(['PasswordException', 'InvalidPDFException'])(
    'traduce %s y libera el documento',
    async (name) => {
      mocks.getDocument.mockReturnValue({
        promise: Promise.reject(Object.assign(new Error('bad'), { name })),
        destroy,
      })
      await expect(extractTextFromPDF(file)).rejects.toThrow(
        name === 'PasswordException' ? 'contraseña' : 'corrupto',
      )
      expect(destroy).toHaveBeenCalledOnce()
    },
  )
  it('termina documentos que no logran abrir a tiempo', async () => {
    vi.useFakeTimers()
    mocks.getDocument.mockReturnValue({
      promise: new Promise(() => {}),
      destroy,
    })
    const pending = expect(extractTextFromPDF(file)).rejects.toThrow(
      'tardó demasiado',
    )
    await vi.advanceTimersByTimeAsync(30_000)
    await pending
    expect(destroy).toHaveBeenCalledOnce()
  })
  it('explica ausencia de canvas o fallo de conversión y libera memoria', async () => {
    pages = [page('')]
    canvas.getContext.mockReturnValueOnce(null)
    await expect(extractPdfWithOcr(file)).rejects.toThrow('preparar la imagen')
    canvas.toBlob.mockImplementationOnce((callback) => callback(null))
    await expect(extractPdfWithOcr(file)).rejects.toThrow('convertir la página')
    expect(canvas.width).toBe(0)
  })
  it('rechaza ejecución fuera del navegador', async () => {
    vi.stubGlobal('window', undefined)
    await expect(extractPdfWithOcr(file)).rejects.toThrow('navegador')
  })
})

describe('límites de entrada y rasterizado', () => {
  it.each([
    [600, 800],
    [50000, 50000],
    [3000, 1200],
  ])('acota página %s × %s a 4 MP / 2400 px', (width, height) => {
    const scale = pdfRasterScale(width, height)
    expect(width * height * scale * scale).toBeLessThanOrEqual(4_000_001)
    expect(Math.max(width, height) * scale).toBeLessThanOrEqual(2400)
  })
  it.each([
    [0, 400],
    [-3, 400],
    [Infinity, 1],
    [1, 500000],
  ])('rechaza dimensiones ilegibles %s × %s', (width, height) => {
    expect(() => pdfRasterScale(width, height)).toThrow()
  })
  it('infiere MIME por extensión si está vacío y rechaza formatos desconocidos', () => {
    expect(normalizeBoletaFile(new File(['pdf'], 'BOLETA.PDF')).type).toBe(
      'application/pdf',
    )
    expect(normalizeBoletaFile(file)).toBe(file)
    expect(() => normalizeBoletaFile(new File(['abc'], 'otro.exe'))).toThrow(
      'Formato',
    )
    expect(() => normalizeBoletaFile(new File([], 'vacio.pdf'))).toThrow(
      'vacío',
    )
    const huge = new File(['pdf'], 'grande.pdf')
    Object.defineProperty(huge, 'size', { value: MAX_FILE_BYTES + 1 })
    expect(() => normalizeBoletaFile(huge)).toThrow('10 MB')
  })
})
