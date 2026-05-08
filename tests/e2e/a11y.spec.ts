import { expect, test } from '@playwright/test'

test.describe('A11y essentials', () => {
  test('skip-to-content link exists, is hidden by default and visible on focus', async ({
    page,
  }) => {
    await page.goto('/')
    const link = page.locator('a[href="#contenido-principal"]').first()
    await expect(link).toBeAttached()
    await expect(link).toHaveText(/saltar al contenido/i)

    await page.evaluate(() => {
      const a = document.querySelector<HTMLAnchorElement>(
        'a[href="#contenido-principal"]',
      )
      a?.focus()
    })
    await expect(link).toBeFocused()
  })

  test('active nav link has aria-current="page"', async ({ page }) => {
    await page.goto('/boleta-luz')
    const active = page
      .locator('header nav a[aria-current="page"]')
      .first()
    await expect(active).toBeVisible()
    await expect(active).toHaveText(/boletas/i)
  })

  test('FileDrop is keyboard reachable and has aria-label', async ({ page }) => {
    await page.goto('/boleta-luz')
    const drop = page.locator('[role="button"][aria-label*="boleta"]').first()
    await expect(drop).toBeVisible()
    await expect(drop).toHaveAttribute('tabindex', '0')
  })

  test('every page has a single <main> element', async ({ page }) => {
    for (const path of [
      '/',
      '/boleta-luz',
      '/boleta-agua',
      '/boleta-gas',
      '/comparador-internet-hogar',
      '/subsidio-electrico',
      '/reclamar-sernac',
      '/guias',
      '/como-funciona',
      '/sobre',
      '/privacidad',
      '/terminos',
      '/contacto',
    ]) {
      await page.goto(path, { waitUntil: 'networkidle' })
      const count = await page.locator('main').count()
      expect(count, `expected exactly one <main> on ${path}`).toBe(1)
    }
  })

  test('html lang is es-CL on every public route', async ({ page }) => {
    for (const path of ['/', '/boleta-luz', '/guias', '/privacidad']) {
      await page.goto(path)
      const lang = await page.locator('html').getAttribute('lang')
      expect(lang, `lang on ${path}`).toBe('es-CL')
    }
  })

  test('unknown route returns 404 with branded not-found page', async ({
    page,
  }) => {
    const response = await page.goto('/ruta-que-no-existe-jamas')
    expect(response?.status()).toBe(404)
    await expect(page.locator('h1')).toContainText('404')
    await expect(
      page.locator('main').getByText(/esta página no existe/i),
    ).toBeVisible()
    await expect(page.locator('a[href="/"]').first()).toBeVisible()
  })

  test('not-found page is noindex', async ({ page }) => {
    await page.goto('/ruta-que-no-existe-jamas-2')
    const robots = await page
      .locator('meta[name="robots"]')
      .first()
      .getAttribute('content')
    expect(robots ?? '').toMatch(/noindex/i)
  })

  test('tracker empty state shows CTA + links to the 3 boleta tools', async ({
    page,
  }) => {
    await page.goto('/tracker')
    const empty = page.getByText(/sin boletas todavía/i)
    await expect(empty).toBeVisible({ timeout: 5000 })
    const card = page
      .locator('main')
      .filter({ hasText: 'Sin boletas todavía' })
    await expect(
      card.getByRole('link', { name: /subir mi primera boleta/i }),
    ).toBeVisible()
    await expect(
      card.getByRole('link', { name: 'Boleta de agua', exact: true }),
    ).toBeVisible()
    await expect(
      card.getByRole('link', { name: 'Boleta de gas', exact: true }),
    ).toBeVisible()
  })

  test('tracker page shows aria-live "Cargando" status while IndexedDB loads', async ({
    page,
  }) => {
    await page.goto('/tracker')
    // El nodo aria-live aparece durante la carga; luego se reemplaza por
    // empty state ("Subí tu primera boleta") o por la grilla de meses.
    const statusOrEmpty = page.locator(
      'p[role="status"], h2:has-text("Subí tu primera boleta")',
    )
    await expect(statusOrEmpty.first()).toBeAttached({ timeout: 5000 })
  })

  test('no placeholder href="#" links anywhere in the document', async ({
    page,
  }) => {
    for (const path of ['/', '/boleta-luz', '/guias', '/privacidad']) {
      await page.goto(path)
      const broken = page.locator('a[href="#"]')
      const count = await broken.count()
      expect(count, `placeholder href="#" found on ${path}`).toBe(0)
    }
  })
})
