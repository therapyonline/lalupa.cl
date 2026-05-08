import { expect, test, type Page } from '@playwright/test'

/**
 * Tests end-to-end del pipeline OCR completo (preprocesado + Tesseract +
 * detect cascade). Cada caso valida una cascada distinta (luz/agua/gas).
 *
 * Flujo: generar PNG con `<canvas>` → setInputFiles → waitForURL.
 *
 * Lento porque Tesseract carga motor + traineddata la primera vez.
 * Skippable con OCR_E2E=0 para CI más liviano.
 */

const SHOULD_RUN = process.env.OCR_E2E !== '0'

interface OcrCase {
  upload: string
  expected: RegExp
  lines: readonly string[]
}

const CASES: ReadonlyArray<{ name: string; spec: OcrCase }> = [
  {
    name: 'CGE (luz)',
    spec: {
      upload: '/boleta-luz',
      expected: /\/boleta-luz\/cge(?:\?|#|$)/,
      lines: [
        'CGE DISTRIBUCION S.A.',
        'RUT: 99.513.400-4',
        'Boleta de electricidad',
        'Cliente: 1234567',
        'Periodo: Mayo 2026',
        'Total a pagar: $ 45.000',
        'cge.cl',
      ],
    },
  },
  {
    name: 'Aguas Andinas (agua)',
    spec: {
      upload: '/boleta-agua',
      expected: /\/boleta-agua\/aguas-andinas(?:\?|#|$)/,
      lines: [
        'AGUAS ANDINAS S.A.',
        'RUT: 61.808.000-5',
        'Boleta de servicio sanitario',
        'Cliente: 9876543',
        'Periodo: Mayo 2026',
        'Consumo: 12 m3',
        'aguasandinas.cl',
      ],
    },
  },
  {
    name: 'Metrogas (gas)',
    spec: {
      upload: '/boleta-gas',
      expected: /\/boleta-gas\/metrogas(?:\?|#|$)/,
      lines: [
        'METROGAS S.A.',
        'RUT: 96.722.460-K',
        'Boleta de gas natural',
        'Cliente: 7654321',
        'Periodo: Mayo 2026',
        'Consumo: 18 m3',
        'metrogas.cl',
      ],
    },
  },
]

async function uploadSyntheticBoleta(page: Page, lines: readonly string[]) {
  const fileBuffer = (await page.evaluate(async (textLines) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 800
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas ctx')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 56px sans-serif'
    let y = 120
    for (const line of textLines) {
      ctx.fillText(line, 80, y)
      y += 100
    }
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    )
    const arr = new Uint8Array(await blob.arrayBuffer())
    return Array.from(arr)
  }, lines)) as number[]

  const input = page.locator('input[type="file"]')
  await input.setInputFiles({
    name: 'boleta-test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(fileBuffer),
  })
}

test.describe('OCR pipeline', () => {
  test.skip(!SHOULD_RUN, 'Skipped , set OCR_E2E to enable')

  for (const { name, spec } of CASES) {
    test(`${name}: imagen sintética → detect → redirect`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.goto(spec.upload)
      await uploadSyntheticBoleta(page, spec.lines)
      await page.waitForURL(spec.expected, { timeout: 90_000 })
      expect(page.url()).toMatch(spec.expected)
    })
  }
})
