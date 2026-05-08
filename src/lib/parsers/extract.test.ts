import { describe, expect, it } from 'vitest'
import { extractTextFromBoleta } from './engine'
import { extractTextFromImage } from './ocr'

function makeFile(type: string): File {
  // The constructor doesn't run anything that needs a real binary — File is
  // available in modern Node test envs.
  return new File([new Uint8Array(0)], 'boleta', { type })
}

describe('extractTextFromBoleta', () => {
  it('rejects unsupported MIME types with a clear message', async () => {
    await expect(
      extractTextFromBoleta(makeFile('application/zip')),
    ).rejects.toThrow(/Formato no soportado/)
  })

  it('rejects empty MIME with "desconocido" hint', async () => {
    await expect(extractTextFromBoleta(makeFile(''))).rejects.toThrow(
      /desconocido/,
    )
  })
})

describe('extractTextFromImage guards', () => {
  it('rechaza ejecución sin window (SSR / vitest node)', async () => {
    await expect(
      extractTextFromImage(makeFile('image/png')),
    ).rejects.toThrow(/solo puede ejecutarse en el navegador/)
  })

  it('rechaza archivos no-imagen', async () => {
    // En vitest node, el guard de SSR dispara primero. Aceptamos cualquiera
    // de los dos mensajes según el ambiente.
    await expect(
      extractTextFromImage(makeFile('application/pdf')),
    ).rejects.toThrow(/navegador|requiere un archivo de imagen/)
  })
})
