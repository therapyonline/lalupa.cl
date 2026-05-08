import { describe, expect, it } from 'vitest'
import { preprocessImageForOcr } from './image-preprocess'

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
