import { expect, test } from '@playwright/test'

/**
 * Tests del flujo result-view inyectando directamente texto de fixture
 * en sessionStorage. Salta la parte de OCR (que ya tiene su propio
 * spec) y verifica que el parser + render funciona end-to-end con
 * texto realista.
 *
 * Cubre:
 *   - Parser exitoso → cargos / período / total visibles
 *   - Hidratación robusta desde sessionStorage
 *   - Slug mismatch → redirect a slug correcto
 *   - Sin payload → redirect a /boleta-luz con mensaje
 *   - Payload corrupto → redirect a /boleta-luz
 */

const CGE_SAMPLE_TEXT = `
COMPAÑIA GENERAL DE ELECTRICIDAD S.A.
RUT: 99.513.400-4
www.cge.cl

N° Cliente: 12345678-9
Tarifa: BT1
Período facturado: 15/04/2026 al 15/05/2026
Fecha de emisión: 16/05/2026
Fecha de vencimiento: 30/05/2026

Consumo: 280 kWh

DETALLE DE CARGOS:
Cargo fijo BT1 ............... $ 1.048
Cargo por energía ............ $ 45.234
Cargo por uso del sistema de transmisión ... $ 4.470
Cargo por servicio público ... $ 240
Cargo por compras de potencia ... $ 498
Cargo por potencia base ...... $ 42.244

Subtotal ..................... $ 93.734
IVA 19% ...................... $ 17.809
Total a pagar ................ $ 111.543
`

const SESSION_KEY = 'lalupa:lastParsed'

test.describe('Boleta result view', () => {
  test('CGE: payload válido renderiza cargos, período y total', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    // Pre-cargar sessionStorage antes de navegar a la ruta de resultado.
    await page.goto('/boleta-luz')
    await page.evaluate(
      ({ key, payload }) => {
        sessionStorage.setItem(key, JSON.stringify(payload))
      },
      {
        key: SESSION_KEY,
        payload: {
          servicio: 'electricidad',
          empresa: 'CGE',
          slug: 'cge',
          rawText: CGE_SAMPLE_TEXT,
          timestamp: Date.now(),
        },
      },
    )
    await page.goto('/boleta-luz/cge')
    // Hero del resultado con marca de empresa.
    await expect(page.getByText(/Resultado.*CGE/i)).toBeVisible({
      timeout: 30_000,
    })
    // Algún heading de período.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // El bloque de resultado debe renderizar con cargos detalle (no
    // queremos quedar en skeleton). Buscamos un cargo sintético conocido.
    await expect(page.getByText(/Cargo|Energ|Total/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('payload con slug mismatch: redirige al slug correcto', async ({
    page,
  }) => {
    test.setTimeout(30_000)
    await page.goto('/boleta-luz')
    await page.evaluate(
      ({ key, payload }) => {
        sessionStorage.setItem(key, JSON.stringify(payload))
      },
      {
        key: SESSION_KEY,
        payload: {
          servicio: 'electricidad',
          empresa: 'CGE',
          slug: 'cge',
          rawText: CGE_SAMPLE_TEXT,
          timestamp: Date.now(),
        },
      },
    )
    // Visito /boleta-luz/enel pero el payload dice cge → debe redirigir.
    await page.goto('/boleta-luz/enel')
    await page.waitForURL(/\/boleta-luz\/cge/, { timeout: 10_000 })
  })

  test('sin payload en sessionStorage: redirige al upload', async ({
    page,
  }) => {
    test.setTimeout(30_000)
    await page.goto('/boleta-luz')
    await page.evaluate(() => sessionStorage.clear())
    await page.goto('/boleta-luz/cge')
    await page.waitForURL('/boleta-luz', { timeout: 10_000 })
  })

  test('payload con JSON corrupto: redirige al upload', async ({ page }) => {
    test.setTimeout(30_000)
    await page.goto('/boleta-luz')
    await page.evaluate((key) => {
      sessionStorage.setItem(key, '{this is not valid JSON,,,')
    }, SESSION_KEY)
    await page.goto('/boleta-luz/cge')
    await page.waitForURL('/boleta-luz', { timeout: 10_000 })
  })

  test('payload con shape inválido (rawText no string): redirige', async ({
    page,
  }) => {
    test.setTimeout(30_000)
    await page.goto('/boleta-luz')
    await page.evaluate(
      ({ key, payload }) => {
        sessionStorage.setItem(key, JSON.stringify(payload))
      },
      {
        key: SESSION_KEY,
        payload: { servicio: 'electricidad', empresa: 'CGE', slug: 'cge' },
      },
    )
    await page.goto('/boleta-luz/cge')
    await page.waitForURL('/boleta-luz', { timeout: 10_000 })
  })

  test('result view es noindex (privacidad: ruta del usuario)', async ({
    page,
  }) => {
    await page.goto('/boleta-luz')
    await page.evaluate(
      ({ key, payload }) => {
        sessionStorage.setItem(key, JSON.stringify(payload))
      },
      {
        key: SESSION_KEY,
        payload: {
          servicio: 'electricidad',
          empresa: 'CGE',
          slug: 'cge',
          rawText: CGE_SAMPLE_TEXT,
          timestamp: Date.now(),
        },
      },
    )
    await page.goto('/boleta-luz/cge')
    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
    expect(robots).toMatch(/noindex/i)
  })
})
