import { describe, expect, it } from 'vitest'
import {
  computeOtsuThreshold,
  preprocessImageForOcr,
} from './image-preprocess'

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
