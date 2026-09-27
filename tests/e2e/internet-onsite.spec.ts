import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

const route = '/comparador-internet-hogar'

test('sitemap registra la revisión real del comparador y de sus guías', async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const path of [
    route,
    '/guias/fibra-vs-cable-internet-chile',
    '/guias/reclamar-subtel-internet-paso-a-paso',
  ]) {
    const entry = sitemap
      .split('<url>')
      .find((e) => e.includes(`https://lalupa.cl${path}</loc>`))
    expect(entry).toContain('2026-09-26')
  }
})

test('presupuesto inválido, cero y restablecimiento de filtros', async ({
  page,
}) => {
  await page.goto(route)
  const presupuesto = page.getByLabel('Presupuesto promedio mensual (CLP)')
  await presupuesto.fill('-1')
  await expect(presupuesto).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('status')).toHaveText(
    'Corrige el presupuesto para comparar.',
  )
  await presupuesto.fill('15000.5')
  await expect(presupuesto).toHaveAttribute('aria-invalid', 'true')
  await presupuesto.fill('0')
  await expect(page.getByRole('status')).toHaveText(
    '0 planes coinciden con tus filtros.',
  )
  await expect(
    page.getByRole('heading', { name: 'No hay planes en esta selección' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
  await expect(presupuesto).toHaveValue('')
  await expect(presupuesto).not.toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Bajada mínima anunciada').selectOption('1000')
  await expect(page.getByRole('status')).toHaveText(
    '0 planes coinciden con tus filtros.',
  )
})

test('cambiar horizonte actualiza proyección y separar TV excluye packs', async ({
  page,
}) => {
  await page.goto(route)
  await page.getByLabel('Empresa', { exact: true }).selectOption('Movistar')
  // Tras el cierre editorial, el contrato esperado es retirar los importes.
  const card = page.getByRole('article', { name: 'Fibra Giga', exact: true })
  if ((await card.count()) === 0) {
    await expect(
      page.getByText(/precios requieren una nueva revisión/),
    ).toBeVisible()
    return
  }
  await expect(card).toContainText('$ 551.760')
  await expect(card).toContainText('$ 22.990 promedio mensual')
  await page.getByLabel('Período a comparar').selectOption('12')
  await expect(card).toContainText('$ 227.880')
  await expect(card).toContainText('$ 18.990 promedio mensual')
  await card.getByText('Ver cálculo y alcance', { exact: true }).click()
  await expect(card.getByText(/No incluye reajustes futuros/)).toBeVisible()
  await page.getByRole('radio', { name: 'Sin pack de TV', exact: true }).check()
  await expect(
    page.getByRole('article', { name: 'Fibra 600 + TV + HBO', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('radio', { name: 'Con televisión', exact: true }).check()
  await expect(card).toHaveCount(0)
  await expect(
    page.getByRole('article', { name: 'Fibra 600 + TV + HBO', exact: true }),
  ).toBeVisible()
})

test('instalación desconocida no se trata como gratis ni entra en filtro de presupuesto', async ({
  page,
}) => {
  await page.goto(route)
  await page.getByLabel('Empresa', { exact: true }).selectOption('Mundo')
  const card = page.getByRole('article', {
    name: 'Plan 1 Mundo 800',
    exact: true,
  })
  if ((await card.count()) === 0) {
    await expect(
      page.getByText(/precios requieren una nueva revisión/),
    ).toBeVisible()
    return
  }
  await expect(card).toContainText('Por confirmar')
  await expect(card).toContainText('Faltan datos para un total completo.')
  await card.getByText('Ver cálculo y alcance', { exact: true }).click()
  await expect(card).toContainText('Mensualidades: $ 365.760')
  await page.getByLabel('Presupuesto promedio mensual (CLP)').fill('100000')
  await expect(card).toHaveCount(0)
})

test('los precios vencidos desaparecen también en una pestaña abierta', async ({
  page,
}) => {
  await page.goto(route)
  await page.clock.setFixedTime(new Date('2099-01-01T12:00:00Z'))
  // El evento de volver a la pestaña refresca la fecha sin una nueva visita.
  await page.evaluate(() =>
    document.dispatchEvent(new Event('visibilitychange')),
  )
  await expect(
    page.getByRole('list', { name: 'Planes comparados' }).getByRole('article'),
  ).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveText(
    '0 planes coinciden con tus filtros.',
  )
  await expect(
    page.locator(
      '#proveedores a[href="https://www.tumundo.cl/hogar/1-mundo/"]',
    ),
  ).toBeVisible()
})

test('contenido, precios disponibles y FAQ se entregan sin JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  })
  const page = await context.newPage()
  await page.goto(route)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Compara internet hogar con los costos a la vista',
  )
  await expect(
    page.getByRole('heading', { name: 'Cómo comparar el costo de un plan' }),
  ).toBeVisible()
  await expect(page.locator('#proveedores a')).toHaveCount(7)
  await page
    .locator('summary')
    .filter({ hasText: '¿Qué incluye la proyección a 12 o 24 meses?' })
    .click()
  await expect(
    page.getByText(/Suma los precios mensuales de cada tramo/),
  ).toBeVisible()
  for (const slug of [
    'fibra-vs-cable-internet-chile',
    'reclamar-subtel-internet-paso-a-paso',
  ]) {
    await page.goto(`/guias/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('article')).toBeVisible()
  }
  for (const path of ['/guias', '/guias/categoria/internet']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await context.close()
})

for (const width of [390, 1280]) {
  test(`comparador a ${width}px: sin desbordamiento y WCAG AA incluido contraste`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(route)
    await page
      .getByRole('radio', { name: 'Sin pack de TV', exact: true })
      .check()
    await page.getByLabel('Ordenar por').selectOption('promedio')
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(audit.violations).toEqual([])
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({
      path: `test-results/internet-${width}.png`,
      fullPage: true,
    })
    await page.screenshot({
      path: `test-results/internet-${width}-viewport.png`,
    })
    const firstCard = page
      .getByRole('list', { name: 'Planes comparados' })
      .getByRole('article')
      .first()
    if (await firstCard.count())
      await firstCard.screenshot({
        path: `test-results/internet-${width}-card.png`,
      })
  })
}

for (const slug of [
  '',
  'fibra-vs-cable-internet-chile',
  'reclamar-subtel-internet-paso-a-paso',
]) {
  test(`${slug || 'comparador'}: FAQ visible y schema coinciden`, async ({
    page,
  }) => {
    await page.goto(slug ? `/guias/${slug}` : route)
    const schemas = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) =>
        els.flatMap((el) => JSON.parse(el.textContent ?? '{}')),
      )
    const faq = schemas.find((s) => s['@type'] === 'FAQPage')
    expect(faq.mainEntity).toHaveLength(slug ? 3 : 4)
    for (const q of faq.mainEntity) {
      await page.locator('summary').filter({ hasText: q.name }).click()
      await expect(
        page.getByText(q.acceptedAnswer.text, { exact: true }),
      ).toBeVisible()
    }
    if (slug) {
      await expect(
        page.locator('meta[property="article:modified_time"]'),
      ).toHaveAttribute('content', '2026-09-26')
      await expect(page.locator('article')).not.toContainText(
        /70% del nominal|UF 100 a UF|siempre|asume que es HFC|15 días corridos/,
      )
    }
  })
}
