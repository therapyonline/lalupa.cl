import { expect, test } from '@playwright/test'
import { CGE_SYNTHETIC_NORMAL } from '../../src/lib/parsers/__fixtures__/cge-synthetic'
import { AGUASANDINAS_REAL_2026_03 } from '../../src/lib/parsers/__fixtures__/aguasandinas-real-2026-03'
import { GASCO_REAL_2024_06 } from '../../src/lib/parsers/__fixtures__/gasco-real-2024-06'

// Fixtures sintéticos: no se atribuye validez regulatoria a sus precios.
const cases = [
  {
    route: 'boleta-luz', servicio: 'electricidad', empresa: 'CGE', slug: 'cge',
    rawText: CGE_SYNTHETIC_NORMAL.replace('$ 1.048', '$ 1.500'),
    charge: 'Cargo fijo',
  },
  {
    route: 'boleta-agua', servicio: 'agua', empresa: 'Aguas Andinas', slug: 'aguas-andinas',
    rawText: AGUASANDINAS_REAL_2026_03.replace('Grupo Tarifario: 1 (Gran Santiago)', '')
      .replace('Cargo Fijo                                       914', 'Cargo Fijo                                       1500'),
    charge: 'Cargo fijo',
  },
  {
    route: 'boleta-gas', servicio: 'gas', empresa: 'Gasco GLP', slug: 'gasco-glp',
    rawText: GASCO_REAL_2024_06, charge: 'Cilindro Gas Licuado',
  },
]

for (const entry of cases) {
  test(`${entry.empresa}: precio no verificado, sin falsas alertas tarifarias`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${entry.route}`)
    await page.evaluate((payload) => {
      sessionStorage.setItem('lalupa:lastParsed', JSON.stringify({ ...payload, timestamp: Date.now() }))
    }, entry)
    await page.goto(`/${entry.route}/${entry.slug}`)
    await expect(page.getByText(entry.charge, { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Tarifa no verificada.', { exact: true })).toBeVisible()
    await expect(page.getByText(/no certifican los precios cobrados/)).toBeVisible()
    await expect(page.getByText(/referencia histórica.*%|sobre.*lo esperado en/)).toHaveCount(0)
    // En luz/agua el cargo alto debe sobrevivir a la extracción sin marcarse.
    if (entry.servicio !== 'gas') {
      await expect(page.getByText(/No hay cargos marcados en el desglose/)).toBeVisible()
      await expect(page.getByText(/1\.500/).first()).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/tariff-${entry.slug}-mobile.png`, fullPage: true })
  })
}
