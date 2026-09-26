import { test, expect } from '@playwright/test'
import { CGE_SYNTHETIC_NORMAL } from '../../src/lib/parsers/__fixtures__/cge-synthetic'
import { AGUASANDINAS_REAL_2026_03 } from '../../src/lib/parsers/__fixtures__/aguasandinas-real-2026-03'

for (const entry of [
  {
    route: 'boleta-luz',
    servicio: 'electricidad',
    empresa: 'CGE',
    slug: 'cge',
    rawText: `${CGE_SYNTHETIC_NORMAL}\nInterés por mora 4% mensual sobre saldos vencidos\nReliquidación tarifaria período 2020-2024\nLectura estimada del período`,
  },
  {
    route: 'boleta-agua',
    servicio: 'agua',
    empresa: 'Aguas Andinas',
    slug: 'aguas-andinas',
    rawText: `${AGUASANDINAS_REAL_2026_03}\nLectura estimada\nReliquidación de períodos anteriores\nPublicidad: Subsidio al Pago del Consumo de Agua Potable`,
  },
]) {
  test(`${entry.servicio}: señales documentales sin dictamen legal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${entry.route}`)
    await page.evaluate(
      (payload) =>
        sessionStorage.setItem(
          'lalupa:lastParsed',
          JSON.stringify({ ...payload, timestamp: Date.now() }),
        ),
      entry,
    )
    await page.goto(`/${entry.route}/${entry.slug}`)
    const region = page.getByRole('region', {
      name: 'Puntos de revisión de tu boleta',
    })
    await expect(region).toBeVisible()
    await expect(region).toContainText('No confirman un cobro indebido')
    await expect(region).not.toContainText(
      /Alerta legal|puedes negarte a pagar|constituiría usura|tienen 5 días|típicamente más de 22/,
    )
    await expect(region).toContainText('El texto menciona una lectura estimada')
    if (entry.servicio === 'electricidad') {
      await expect(
        page.getByText(/No hay cargos marcados en el desglose/),
      ).toBeVisible()
      await expect(region).toContainText('tasa de 4% mensual')
      await expect(region).toContainText('No comprobamos su aplicación')
      const norma = region
        .locator('summary')
        .filter({ hasText: 'Norma de referencia' })
      await norma.click()
      await expect(
        region.locator(
          'a[href="https://www.bcn.cl/leychile/navegar?idNorma=124102"]',
        ),
      ).toBeVisible()
    } else {
      await expect(region).not.toContainText('Decreto 327')
      const canal = region
        .locator('summary')
        .filter({ hasText: 'Canal de orientación' })
        .first()
      await canal.click()
      await expect(
        region.getByRole('link', { name: 'Ver fuente oficial' }).first(),
      ).toBeVisible()
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({
      path: `test-results/revision-${entry.servicio}-mobile.png`,
      fullPage: true,
    })
  })
}

const guides = [
  'te-cortaron-servicio-sin-aviso-que-hacer',
  'reclamar-cobro-indebido-paso-a-paso',
  'derechos-consumidor-chile-servicios-basicos',
  'subsidio-agua-potable-sap-chile',
]
for (const slug of guides) {
  test(`${slug}: contenido completo y FAQ visibles coherentes con el esquema`, async ({
    page,
  }) => {
    await page.goto(`/guias/${slug}`)
    await expect(page.locator('article')).not.toContainText(
      /placeholder|multa a tu favor|renueva automáticamente|primer paso obligatorio/i,
    )
    const schemas = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) =>
        els.flatMap((el) => JSON.parse(el.textContent ?? '{}')),
      )
    const faq = schemas.find((schema) => schema['@type'] === 'FAQPage')
    expect(faq.mainEntity).toHaveLength(2)
    for (const question of faq.mainEntity) {
      await page.locator('summary').filter({ hasText: question.name }).click()
      await expect(
        page.getByText(question.acceptedAnswer.text, { exact: true }),
      ).toBeVisible()
    }
  })
}
