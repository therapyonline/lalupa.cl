import { expect, test } from '@playwright/test'

const guides = [
  'gas-red-vs-cilindro-cual-conviene', 'como-leer-boleta-cge',
  'por-que-subio-mi-cuenta-de-luz', 'tarifa-bt1-vs-bt2-cual-conviene',
  'cambiar-comercializadora-electrica-chile', 'deuda-electrica-convenios-pago-chile',
  'lectura-estimada-medidor-luz-cuando-es-legal',
]

for (const slug of guides) {
  test(`${slug}: navegación móvil, enlaces y autor editorial`, async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/guias/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await page.getByText('En esta guía', { exact: true }).first().click()
    const toc = page.locator('details nav[aria-label="Tabla de contenidos"]')
    await expect(toc).toBeVisible()
    for (const href of await toc.locator('a').evaluateAll((els) => els.map((el) => el.getAttribute('href')!))) {
      const exists = await page.evaluate((id) => !!document.getElementById(id), href.slice(1))
      expect(exists, href).toBe(true)
    }
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((els) =>
      els.flatMap((el) => JSON.parse(el.textContent ?? '{}')))
    expect(schemas.find((s) => s['@type'] === 'Article').author).toEqual({
      '@type': 'Organization', name: 'Equipo lalupa', url: 'https://lalupa.cl/sobre#criterio-editorial',
    })
    await expect(page.locator('meta[property="article:modified_time"]')).toHaveAttribute('content', '2026-09-25')
    const paths = await page.locator('article a[href^="/"]').evaluateAll((els) =>
      [...new Set(els.map((el) => el.getAttribute('href')!))])
    for (const path of paths) expect((await request.get(path)).ok(), path).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/${slug}-mobile.png`, fullPage: true })
  })
}

test('robots permite descubrir noindex; resultados quedan fuera del sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).not.toMatch(/Disallow:.*(?:tracker|boleta-)/)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const path of ['/tracker', '/boleta-luz/cge', '/boleta-agua/aguas-andinas', '/boleta-gas/metrogas']) {
    const response = await request.get(path, { headers: { 'User-Agent': 'Googlebot' } })
    expect(response.ok()).toBe(true)
    expect(await response.text()).toMatch(/<meta name="robots" content="[^"]*noindex/)
    expect(sitemap).not.toContain(`https://lalupa.cl${path}<`)
  }
  const home = sitemap.match(/<url>\s*<loc>https:\/\/lalupa.cl\/<\/loc>[\s\S]*?<\/url>/)?.[0]
  expect(home).toBeTruthy()
  expect(home).not.toContain('<lastmod>')
  for (const slug of guides) {
    const entry = sitemap.split('<url>').find((part) => part.includes(`/guias/${slug}</loc>`))
    expect(entry).toContain('2026-09-25')
  }
})

test('la página principal enlaza gas y CGE', async ({ page }) => {
  await page.goto('/')
  for (const slug of guides.slice(0, 2)) await expect(page.locator(`main a[href="/guias/${slug}"]`)).toBeVisible()
})

test('no se incluyen scripts ni permisos de CSP para grabación de sesiones', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.headers()['content-security-policy']).not.toContain('clarity.ms')
  expect(await page.content()).not.toContain('clarity.ms/tag')
})
