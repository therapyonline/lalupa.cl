import { expect, test, type Page } from '@playwright/test'

/**
 * Tests end-to-end del pipeline OCR completo (preprocesado + Tesseract +
 * detect cascade). Cada caso valida una cascada distinta (luz/agua/gas).
 *
 * Flujo: generar PNG/JPG/WebP con `<canvas>` , setInputFiles , waitForURL.
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

type SyntheticFormat = 'png' | 'jpeg' | 'webp'

async function uploadSyntheticBoleta(
  page: Page,
  lines: readonly string[],
  format: SyntheticFormat = 'png',
) {
  const fileBuffer = (await page.evaluate(
    async ({ textLines, mimeType }) => {
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
      // JPG con calidad 0.85 simula compresión típica de cámara móvil.
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), mimeType, 0.85),
      )
      const arr = new Uint8Array(await blob.arrayBuffer())
      return Array.from(arr)
    },
    {
      textLines: [...lines],
      mimeType: format === 'png' ? 'image/png' : `image/${format}`,
    },
  )) as number[]

  const ext = format === 'jpeg' ? 'jpg' : format
  const input = page.locator('input[type="file"]')
  await input.setInputFiles({
    name: `boleta-test.${ext}`,
    mimeType: format === 'png' ? 'image/png' : `image/${format}`,
    buffer: Buffer.from(fileBuffer),
  })
}

test.describe('OCR pipeline', () => {
  test.skip(!SHOULD_RUN, 'Skipped, set OCR_E2E to enable')

  // Smoke test cada empresa con PNG (fast path).
  for (const { name, spec } of CASES) {
    test(`${name}: PNG sintético , detect , redirect`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.goto(spec.upload)
      await uploadSyntheticBoleta(page, spec.lines, 'png')
      await page.waitForURL(spec.expected, { timeout: 90_000 })
      expect(page.url()).toMatch(spec.expected)
    })
  }

  // Verifica que JPG con compresión (cámara móvil) también funcione.
  test('CGE: JPG con compresión (calidad 0.85) detecta correctamente', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.goto('/boleta-luz')
    await uploadSyntheticBoleta(page, CASES[0].spec.lines, 'jpeg')
    await page.waitForURL(CASES[0].spec.expected, { timeout: 90_000 })
  })

  // WebP (formato cada vez más común en Chrome screenshots).
  test('Aguas Andinas: WebP detecta correctamente', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/boleta-agua')
    await uploadSyntheticBoleta(page, CASES[1].spec.lines, 'webp')
    await page.waitForURL(CASES[1].spec.expected, { timeout: 90_000 })
  })

  // HEIC (iOS): debe mostrar mensaje claro.
  test('HEIC (iPhone): mensaje claro en vez de fallar silencioso', async ({
    page,
  }) => {
    await page.goto('/boleta-luz')
    const input = page.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'IMG_0123.heic',
      mimeType: 'image/heic',
      // Header inválido — solo necesitamos que el path llegue al
      // detector de HEIC, no que sea decodificado.
      buffer: Buffer.from([0, 0, 0, 0]),
    })
    // El error vive en el upload-hub: aparece como Alert.
    // Buscamos el Alert de upload-hub específico (excluye route-announcer
    // de Next que también usa role=alert).
    const alert = page.locator('main [role="alert"]:has([data-slot="alert-title"])')
    await expect(alert).toBeVisible({ timeout: 10_000 })
    await expect(alert).toContainText(/HEIC|JPEG|JPG/i)
  })

  // Imagen vacía / blanco puro: debe rechazar con mensaje útil.
  test('imagen blanca sin texto: error útil para el usuario', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.goto('/boleta-luz')
    const buffer = (await page.evaluate(async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas ctx')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png'),
      )
      const arr = new Uint8Array(await blob.arrayBuffer())
      return Array.from(arr)
    })) as number[]
    const input = page.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'blanco.png',
      mimeType: 'image/png',
      buffer: Buffer.from(buffer),
    })
    // Buscamos el Alert de upload-hub específico (excluye route-announcer
    // de Next que también usa role=alert).
    const alert = page.locator('main [role="alert"]:has([data-slot="alert-title"])')
    await expect(alert).toBeVisible({ timeout: 90_000 })
    // El mensaje puede venir del OCR (no leyó texto) o del detector
    // (no identificó empresa). Ambos son aceptables para este caso.
    await expect(alert).toContainText(/leer|detectar|nít|distribuidora|empresa/i)
  })

  // Archivo inválido (texto plano con extensión .png falsa).
  test('archivo no decodificable: error claro', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/boleta-luz')
    const input = page.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'fake.png',
      mimeType: 'image/png',
      buffer: Buffer.from('this is not actually a PNG file'),
    })
    // Buscamos el Alert de upload-hub específico (excluye route-announcer
    // de Next que también usa role=alert).
    const alert = page.locator(
      'main [role="alert"]:has([data-slot="alert-title"])',
    )
    await expect(alert).toBeVisible({ timeout: 30_000 })
  })

  // Happy path completo OCR: imagen sintética → redirect a result page.
  // El parse con texto sintético mínimo puede caer en "parser-error"
  // (porque la boleta de prueba no tiene cargos reales detectables); lo
  // que importa para este test es que la cascada upload → detect → redirect
  // funciona y la result page renderiza algún estado válido.
  test('happy path completo: CGE PNG llega a result page (parsed o parser-error, no skeleton infinito)', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.goto('/boleta-luz')
    await uploadSyntheticBoleta(page, CASES[0].spec.lines, 'png')
    await page.waitForURL(CASES[0].spec.expected, { timeout: 90_000 })
    // Result view debe mostrar uno de: cargos parseados, error de parser,
    // o estado unsupported. Lo que NO debe pasar es quedarse en skeleton
    // infinitamente (eso indicaría hidratación rota o parser que cuelga).
    await page.waitForFunction(
      () => {
        const visible = document.body.innerText
        return (
          /Resultado/i.test(visible) ||
          /No pudimos analizar/i.test(visible) ||
          /Aún no analizamos/i.test(visible)
        )
      },
      { timeout: 30_000 },
    )
  })

  // Empresa desconocida: detect devuelve null, no redirige y muestra
  // alerta + selector manual.
  test('boleta de empresa desconocida: alerta + selector manual visible', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.goto('/boleta-luz')
    await uploadSyntheticBoleta(
      page,
      [
        'EMPRESA INEXISTENTE S.A.',
        'RUT: 11.111.111-1',
        'Boleta servicio mensual',
        'Cliente Numero 1234',
        'Total a pagar 50000',
      ],
      'png',
    )
    // Queda en /boleta-luz con alerta y selector visible.
    const alert = page.locator(
      'main [role="alert"]:has([data-slot="alert-title"])',
    )
    await expect(alert).toBeVisible({ timeout: 90_000 })
    // El selector de empresas (chips de CGE/Enel/etc) sigue visible.
    await expect(
      page.getByRole('link', { name: /CGE|Enel|SAESA/i }).first(),
    ).toBeVisible()
  })
})
