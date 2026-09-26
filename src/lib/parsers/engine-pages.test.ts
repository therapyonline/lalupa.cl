import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ ocr: vi.fn() }))
vi.mock('./ocr', () => ({ extractTextFromImage: mocks.ocr }))
vi.mock('./pdf', () => ({
  extractPdfWithOcr: vi.fn(),
  extractTextFromPDF: vi.fn(),
}))
import { extractTextFromImages } from './engine'
const photo = () => new File(['image'], 'pagina.jpg', { type: 'image/jpeg' })
beforeEach(() => vi.resetAllMocks())
it('no devuelve solo las páginas exitosas si falla otra foto', async () => {
  mocks.ocr
    .mockResolvedValueOnce('Primera página')
    .mockRejectedValueOnce(new Error('Texto insuficiente'))
  await expect(extractTextFromImages([photo(), photo()])).rejects.toThrow(
    'página 2 de 2. Texto insuficiente',
  )
})
it('ordena páginas e infiere MIME vacío al pasar cada imagen al OCR', async () => {
  mocks.ocr.mockResolvedValueOnce('Primera').mockResolvedValueOnce('Segunda')
  expect(
    await extractTextFromImages([photo(), new File(['jpg'], 'otra.JPG')]),
  ).toBe('Primera\n\nSegunda')
  expect(mocks.ocr.mock.calls[1][0].type).toBe('image/jpeg')
})
it('rechaza listas vacías, excesivas, PDFs mezclados y HEIC antes de OCR', async () => {
  await expect(extractTextFromImages([])).rejects.toThrow('ningún archivo')
  await expect(
    extractTextFromImages(Array.from({ length: 6 }, photo)),
  ).rejects.toThrow('hasta 5')
  await expect(
    extractTextFromImages([
      photo(),
      new File(['pdf'], 'a.pdf', { type: 'application/pdf' }),
    ]),
  ).rejects.toThrow('cada archivo debe ser imagen')
  await expect(
    extractTextFromImages([photo(), new File(['heic'], 'a.heic')]),
  ).rejects.toThrow('Más compatible')
  expect(mocks.ocr).not.toHaveBeenCalled()
})
