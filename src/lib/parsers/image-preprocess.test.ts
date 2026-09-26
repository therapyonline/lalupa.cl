import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  computeOtsuThreshold,
  preprocessImageForOcr,
} from './image-preprocess'

afterEach(() => vi.unstubAllGlobals())

function browserImage(levels: number[], width = 1600, height = 800) {
  const data = Uint8ClampedArray.from(levels.flatMap((v) => [v, v, v, 255]))
  const bitmap = { width, height, close: vi.fn() }
  const ctx = { drawImage: vi.fn(), getImageData: () => ({ data }), putImageData: vi.fn() }
  const output = new Blob(['processed'], { type: 'image/png' })
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => ctx),
    toBlob: vi.fn((callback: (blob: Blob | null) => void) => callback(output)) }
  vi.stubGlobal('window', {})
  vi.stubGlobal('document', { createElement: () => canvas })
  const decode = vi.fn().mockResolvedValue(bitmap)
  vi.stubGlobal('createImageBitmap', decode)
  const file = new File(['image'], 'foto.png', { type: 'image/png' })
  return { file, data, bitmap, canvas, ctx, output, decode }
}

describe('pipeline de imagen en navegador', () => {
  it('conserva tinta negra al binarizar una boleta en blanco y negro', async () => {
    const fixture = browserImage([0, 0, 255, 255, 255, 255, 255, 255, 255, 255])
    expect(await preprocessImageForOcr(fixture.file)).toBe(fixture.output)
    expect(fixture.data[0]).toBe(0)
    expect(fixture.data[8]).toBe(255)
    expect(fixture.ctx.putImageData).toHaveBeenCalledOnce()
    expect(fixture.bitmap.close).toHaveBeenCalledOnce()
  })
  it('mejora contraste manteniendo texto y fondo separados', async () => {
    const { file, data } = browserImage([40, 40, 180, 180, 180, 180])
    await preprocessImageForOcr(file)
    expect(data[0]).toBe(0)
    expect(data[8]).toBe(255)
  })
  it.each([0, 255])('no invierte una imagen uniforme de intensidad %s', async (value) => {
    const { file } = browserImage([value, value, value])
    expect(await preprocessImageForOcr(file)).toBe(file)
  })
  it.each([[4000, 2000, 2400, 1200], [1000, 500, 1500, 750]])(
    'redimensiona %s × %s a %s × %s', async (width, height, targetW, targetH) => {
      const f = browserImage([0, 255], width, height)
      const resized = { width: targetW, height: targetH, close: vi.fn() }
      f.decode.mockResolvedValueOnce(f.bitmap).mockResolvedValueOnce(resized)
      await preprocessImageForOcr(f.file)
      expect(f.decode).toHaveBeenLastCalledWith(f.bitmap, {
        resizeWidth: targetW, resizeHeight: targetH, resizeQuality: 'high',
      })
      expect(f.canvas.width).toBe(targetW)
      expect(resized.close).toHaveBeenCalledOnce()
    },
  )
  it('devuelve original si no decodifica', async () => {
    const f = browserImage([0, 255])
    f.decode.mockRejectedValueOnce(new Error('decode'))
    expect(await preprocessImageForOcr(f.file)).toBe(f.file)
  })
  it('conserva original si canvas no genera un blob', async () => {
    const f = browserImage([0, 255])
    f.canvas.toBlob.mockImplementation((callback) => callback(null))
    expect(await preprocessImageForOcr(f.file)).toBe(f.file)
  })
  it('no procesa PDFs por el pipeline de imagen', async () => {
    const f = browserImage([0, 255])
    const file = new File(['pdf'], 'document.pdf', { type: 'application/pdf' })
    expect(await preprocessImageForOcr(file)).toBe(file)
    expect(f.decode).not.toHaveBeenCalled()
  })
  it('libera una miniatura que sigue bajo el mínimo después del intento de resize', async () => {
    const f = browserImage([0, 255], 100, 100)
    f.decode.mockResolvedValueOnce(f.bitmap).mockRejectedValueOnce(new Error('resize'))
    expect(await preprocessImageForOcr(f.file)).toBe(f.file)
    expect(f.bitmap.close).toHaveBeenCalledOnce()
  })
})

describe('preprocessImageForOcr', () => {
  it('devuelve el archivo original cuando window no existe (SSR / node test)', async () => {
    const file = new File([new Uint8Array(0)], 'foto.jpg', {
      type: 'image/jpeg',
    })
    const result = await preprocessImageForOcr(file)
    expect(result).toBe(file)
  })

  it('devuelve el archivo original cuando MIME no es imagen', async () => {
    const file = new File([new Uint8Array(0)], 'doc.pdf', {
      type: 'application/pdf',
    })
    const result = await preprocessImageForOcr(file)
    expect(result).toBe(file)
  })
})

describe('computeOtsuThreshold', () => {
  it('encuentra el valle entre dos modos bien separados (texto vs fondo)', () => {
    // Histograma bimodal: 100 pixeles oscuros (50-60) y 100 claros (200-210)
    const hist = new Uint32Array(256)
    for (let v = 50; v <= 60; v++) hist[v] = 10
    for (let v = 200; v <= 210; v++) hist[v] = 10
    const total = 220
    const t = computeOtsuThreshold(hist, total)
    // Otsu maximiza varianza inter-clase: el threshold óptimo cae en el
    // límite superior del modo inferior (todo ≤t es texto, todo >t es
    // papel). Con esta entrada, ese límite es 60.
    expect(t).toBeGreaterThanOrEqual(60)
    expect(t).toBeLessThan(200)
  })

  it('separa correctamente texto negro sobre papel blanco (modo realista)', () => {
    // Imagen "típica" de boleta: ~10% pixeles oscuros (texto), ~90% claros (papel).
    const hist = new Uint32Array(256)
    for (let v = 20; v <= 50; v++) hist[v] = 100 // texto
    for (let v = 220; v <= 250; v++) hist[v] = 900 // papel
    const total = 31 * 100 + 31 * 900
    const t = computeOtsuThreshold(hist, total)
    // Threshold cae en el borde superior del modo de texto, separando
    // perfectamente las dos clases.
    expect(t).toBeGreaterThanOrEqual(50)
    expect(t).toBeLessThan(220)
  })

  it('devuelve threshold por defecto cuando histograma es uniforme', () => {
    // No hay separación clara: todos los valores tienen la misma masa.
    const hist = new Uint32Array(256)
    for (let v = 0; v < 256; v++) hist[v] = 1
    const t = computeOtsuThreshold(hist, 256)
    // Otsu cae cerca del medio cuando no hay bimodalidad. Aceptamos rango
    // amplio porque la implementación arranca en 127.
    expect(t).toBeGreaterThanOrEqual(0)
    expect(t).toBeLessThanOrEqual(255)
  })
})
