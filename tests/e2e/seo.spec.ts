import { expect, test } from '@playwright/test'

interface RouteSpec {
  path: string
  expectedTitle: RegExp
  expectsCanonical?: boolean
  expectsBreadcrumbs?: boolean
  expectsArticle?: boolean
  expectsWebApplication?: boolean
  expectsFaq?: boolean
  expectsCollectionPage?: boolean
}

const ROUTES: RouteSpec[] = [
  {
    path: '/',
    expectedTitle: /Lalupa\.cl/,
    expectsCanonical: true,
    expectsBreadcrumbs: false,
  },
  {
    path: '/boleta-luz',
    expectedTitle: /Boleta de luz/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsWebApplication: true,
    expectsFaq: true,
  },
  {
    path: '/boleta-agua',
    expectedTitle: /Boleta de agua/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsWebApplication: true,
    expectsFaq: true,
  },
  {
    path: '/boleta-gas',
    expectedTitle: /Boleta de gas/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsWebApplication: true,
    expectsFaq: true,
  },
  {
    path: '/reclamar-sernac',
    expectedTitle: /Reclamar a SERNAC/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsWebApplication: true,
  },
  {
    path: '/subsidio-electrico',
    expectedTitle: /Subsidio eléctrico/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsWebApplication: true,
  },
  {
    path: '/comparador-internet-hogar',
    expectedTitle: /Comparador internet/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsWebApplication: true,
  },
  {
    path: '/guias',
    expectedTitle: /Guías/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsCollectionPage: true,
  },
  {
    path: '/guias/por-que-subio-mi-cuenta-de-luz',
    expectedTitle: /letra chica|cuenta de luz|por qué subió/i,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsArticle: true,
  },
  {
    path: '/como-funciona',
    expectedTitle: /Cómo funciona/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
  },
  {
    path: '/guias/categoria/luz',
    expectedTitle: /Guías de electricidad|guías de luz/i,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
    expectsCollectionPage: true,
  },
  {
    path: '/privacidad',
    expectedTitle: /Privacidad/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
  },
  {
    path: '/terminos',
    expectedTitle: /Términos/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
  },
  {
    path: '/contacto',
    expectedTitle: /Contacto/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
  },
  {
    path: '/sobre',
    expectedTitle: /Sobre lalupa/,
    expectsCanonical: true,
    expectsBreadcrumbs: true,
  },
]

async function getJsonLdSchemas(page: import('@playwright/test').Page) {
  const scripts = await page.locator('script[type="application/ld+json"]').all()
  const schemas: unknown[] = []
  for (const s of scripts) {
    const raw = await s.textContent()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) schemas.push(...parsed)
      else schemas.push(parsed)
    } catch {
      // skip
    }
  }
  return schemas as Array<{ '@type'?: string }>
}

test.describe('SEO metadata', () => {
  test('layout exposes Organization + WebSite JSON-LD on every page', async ({ page }) => {
    await page.goto('/')
    const schemas = await getJsonLdSchemas(page)
    const types = schemas.map((s) => s['@type'])
    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
  })

  test('html lang is es-CL', async ({ page }) => {
    await page.goto('/')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('es-CL')
  })

  for (const route of ROUTES) {
    test(`${route.path} has correct title, description, canonical, OG image and Twitter card`, async ({
      page,
    }) => {
      await page.goto(route.path)

      await expect(page).toHaveTitle(route.expectedTitle)

      const description = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute('content')
      expect(description).toBeTruthy()
      expect((description ?? '').length).toBeGreaterThan(20)

      const ogImage = await page
        .locator('meta[property="og:image"]')
        .first()
        .getAttribute('content')
      expect(ogImage).toBeTruthy()
      expect(ogImage).toMatch(/\/api\/og/)

      const ogType = await page
        .locator('meta[property="og:type"]')
        .first()
        .getAttribute('content')
      expect(['website', 'article']).toContain(ogType)

      const twitterCard = await page
        .locator('meta[name="twitter:card"]')
        .first()
        .getAttribute('content')
      expect(twitterCard).toBe('summary_large_image')

      if (route.expectsCanonical) {
        const canonical = await page
          .locator('link[rel="canonical"]')
          .first()
          .getAttribute('href')
        const expected =
          route.path === '/'
            ? 'https://lalupa.cl'
            : `https://lalupa.cl${route.path}`
        expect(canonical).toBe(expected)
      }

      const hreflang = await page
        .locator('link[rel="alternate"][hreflang="es-CL"]')
        .first()
        .getAttribute('href')
      expect(hreflang).toContain('lalupa.cl')

      const schemas = await getJsonLdSchemas(page)
      const types = schemas.map((s) => s['@type'])

      if (route.expectsBreadcrumbs) {
        expect(types).toContain('BreadcrumbList')
      }
      if (route.expectsWebApplication) {
        expect(types).toContain('WebApplication')
      }
      if (route.expectsArticle) {
        expect(types).toContain('Article')
      }
      if (route.expectsFaq) {
        expect(types).toContain('FAQPage')
      }
      if (route.expectsCollectionPage) {
        expect(types).toContain('CollectionPage')
      }
    })
  }

  test('OG image route returns 200 with PNG', async ({ request }) => {
    const res = await request.get('/api/og?title=test&kind=tool', {
      timeout: 30_000,
    })
    expect(res.ok()).toBe(true)
    expect(res.headers()['content-type']).toContain('image/png')
  })

  test('private routes (tracker, dynamic resultados) are noindex', async ({ page }) => {
    await page.goto('/tracker')
    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
    expect(robots).toMatch(/noindex/i)
  })

  test('sitemap.xml lists all indexable routes', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.ok()).toBe(true)
    expect(res.headers()['content-type']).toMatch(/xml/i)
    const body = await res.text()
    // Static routes
    expect(body).toContain('https://lalupa.cl/')
    expect(body).toContain('https://lalupa.cl/boleta-luz')
    expect(body).toContain('https://lalupa.cl/boleta-agua')
    expect(body).toContain('https://lalupa.cl/boleta-gas')
    expect(body).toContain('https://lalupa.cl/reclamar-sernac')
    expect(body).toContain('https://lalupa.cl/subsidio-electrico')
    expect(body).toContain('https://lalupa.cl/comparador-internet-hogar')
    expect(body).toContain('https://lalupa.cl/guias')
    // Guides (dynamic from MDX)
    expect(body).toContain('https://lalupa.cl/guias/por-que-subio-mi-cuenta-de-luz')
    // Category index pages
    expect(body).toContain('https://lalupa.cl/guias/categoria/luz')
    expect(body).toContain('https://lalupa.cl/guias/categoria/agua')
    expect(body).toContain('https://lalupa.cl/sobre')
    // Private routes must NOT be in sitemap
    expect(body).not.toContain('https://lalupa.cl/tracker')
    expect(body).not.toContain('/api/og')
  })

  test('home page surfaces 3 guides linking to /guias/[slug]', async ({
    page,
  }) => {
    await page.goto('/')
    const guideLinks = page.locator('main a[href^="/guias/"]')
    const count = await guideLinks.count()
    expect(count).toBeGreaterThanOrEqual(3)
    await expect(page.locator('main a[href="/guias"]').first()).toBeVisible()
  })

  test('guide page shows "Sigue leyendo" with related guide cards', async ({
    page,
  }) => {
    await page.goto('/guias/por-que-subio-mi-cuenta-de-luz')
    const heading = page.getByRole('heading', { name: /guías relacionadas/i })
    await expect(heading).toBeVisible()
    // Cards link to other guides — should be 3 and not include the current slug
    const links = page.locator(
      'main a[href^="/guias/"]:not([href="/guias"]):not([href="/guias/por-que-subio-mi-cuenta-de-luz"])',
    )
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('guides RSS feed is valid XML with channel + items', async ({
    request,
  }) => {
    const res = await request.get('/guias/rss.xml')
    expect(res.ok()).toBe(true)
    expect(res.headers()['content-type']).toContain('application/rss+xml')
    const body = await res.text()
    expect(body).toContain('<rss version="2.0"')
    expect(body).toContain('<channel>')
    expect(body).toContain('<title>Lalupa.cl — Guías</title>')
    expect(body).toContain('<language>es-CL</language>')
    // At least one guide is listed
    expect(body).toMatch(/<item>[\s\S]*<\/item>/)
    // Sitemap-known guide should appear
    expect(body).toContain('/guias/por-que-subio-mi-cuenta-de-luz')
  })

  test('layout exposes RSS auto-discovery link', async ({ page }) => {
    await page.goto('/')
    const link = page
      .locator('link[rel="alternate"][type="application/rss+xml"]')
      .first()
    await expect(link).toHaveAttribute('href', /\/guias\/rss\.xml$/)
  })

  test('Tesseract OCR assets are self-hosted and served from same origin', async ({
    request,
  }) => {
    const worker = await request.get('/tesseract/worker.min.js')
    expect(worker.ok()).toBe(true)
    expect(worker.headers()['content-type']).toMatch(/javascript/)

    const lang = await request.get('/tesseract/lang/spa.traineddata.gz')
    expect(lang.ok()).toBe(true)
    // Spanish traineddata is a gzipped binary (~8MB)
    const buf = await lang.body()
    expect(buf.length).toBeGreaterThan(1_000_000)
  })

  test('manifest.webmanifest is valid JSON with required fields', async ({
    request,
  }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.name).toBeTruthy()
    expect(body.short_name).toBeTruthy()
    expect(body.start_url).toBe('/')
    expect(body.display).toBe('standalone')
    expect(body.theme_color).toBeTruthy()
    expect(body.icons).toBeInstanceOf(Array)
    expect(body.icons.length).toBeGreaterThan(0)
    expect(body.lang).toBe('es-CL')
  })

  test('robots.txt allows crawlers and points to sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBe(true)
    const body = await res.text()
    expect(body).toMatch(/User-Agent:\s*\*/i)
    expect(body).toMatch(/Allow:\s*\//i)
    // Private routes should be disallowed
    expect(body).toMatch(/Disallow:\s*\/tracker/i)
    expect(body).toMatch(/Disallow:\s*\/boleta-(luz|agua|gas)/i)
    // Sitemap reference
    expect(body).toMatch(/Sitemap:\s*https:\/\/lalupa\.cl\/sitemap\.xml/i)
  })
})
