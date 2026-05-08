import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Smoke test del result-view para las 14 empresas. Carga el texto de
 * fixture (boleta real, ya extraído de PDF) directamente en
 * sessionStorage y verifica que la página de resultado renderiza sin
 * caer en estado parser-error ni quedarse en skeleton infinito.
 *
 * Esto cubre el chain completo:
 *   payload en sessionStorage  → result-view useEffect  → parser  →
 *   render con ResultBlock + Comparativa.
 *
 * Si un parser tira con su propio fixture, este test lo agarra en CI.
 */

const SESSION_KEY = 'lalupa:lastParsed'

interface Empresa {
  servicio: 'electricidad' | 'agua' | 'gas'
  empresa: string
  slug: string
  basePath: '/boleta-luz' | '/boleta-agua' | '/boleta-gas'
  fixturePath: string
  fixtureExportName: string
}

const EMPRESAS: Empresa[] = [
  {
    servicio: 'electricidad',
    empresa: 'CGE',
    slug: 'cge',
    basePath: '/boleta-luz',
    fixturePath: 'src/lib/parsers/__fixtures__/cge-synthetic.ts',
    fixtureExportName: 'CGE_SYNTHETIC_NORMAL',
  },
  {
    servicio: 'electricidad',
    empresa: 'Enel',
    slug: 'enel',
    basePath: '/boleta-luz',
    fixturePath: 'src/lib/parsers/__fixtures__/enel-real-2024-06.ts',
    fixtureExportName: 'ENEL_REAL_2024_06',
  },
  {
    servicio: 'electricidad',
    empresa: 'SAESA',
    slug: 'saesa',
    basePath: '/boleta-luz',
    fixturePath: 'src/lib/parsers/__fixtures__/saesa-real-2024-09.ts',
    fixtureExportName: 'SAESA_REAL_2024_09',
  },
  {
    servicio: 'electricidad',
    empresa: 'Frontel',
    slug: 'frontel',
    basePath: '/boleta-luz',
    fixturePath: 'src/lib/parsers/__fixtures__/frontel-real-2022-09.ts',
    fixtureExportName: 'FRONTEL_REAL_2022_09',
  },
  {
    servicio: 'electricidad',
    empresa: 'Chilquinta',
    slug: 'chilquinta',
    basePath: '/boleta-luz',
    fixturePath: 'src/lib/parsers/__fixtures__/chilquinta-real-2023-07.ts',
    fixtureExportName: 'CHILQUINTA_REAL_2023_07',
  },
  {
    servicio: 'agua',
    empresa: 'Aguas Andinas',
    slug: 'aguas-andinas',
    basePath: '/boleta-agua',
    fixturePath: 'src/lib/parsers/__fixtures__/aguasandinas-real-2026-03.ts',
    fixtureExportName: 'AGUASANDINAS_REAL_2026_03',
  },
  {
    servicio: 'agua',
    empresa: 'Esval',
    slug: 'esval',
    basePath: '/boleta-agua',
    fixturePath: 'src/lib/parsers/__fixtures__/esval-real-2021-04.ts',
    fixtureExportName: 'ESVAL_REAL_2021_04',
  },
  {
    servicio: 'agua',
    empresa: 'ESSBio',
    slug: 'essbio',
    basePath: '/boleta-agua',
    fixturePath: 'src/lib/parsers/__fixtures__/essbio-real-2021-10.ts',
    fixtureExportName: 'ESSBIO_REAL_2021_10',
  },
  {
    servicio: 'agua',
    empresa: 'Nuevosur',
    slug: 'nuevosur',
    basePath: '/boleta-agua',
    fixturePath: 'src/lib/parsers/__fixtures__/nuevosur-real-2021-10.ts',
    fixtureExportName: 'NUEVOSUR_REAL_2021_10',
  },
  {
    servicio: 'agua',
    empresa: 'SMAPA',
    slug: 'smapa',
    basePath: '/boleta-agua',
    fixturePath: 'src/lib/parsers/__fixtures__/smapa-real-2025-10.ts',
    fixtureExportName: 'SMAPA_REAL_2025_10',
  },
  {
    servicio: 'gas',
    empresa: 'Metrogas',
    slug: 'metrogas',
    basePath: '/boleta-gas',
    fixturePath: 'src/lib/parsers/__fixtures__/metrogas-real-2025-08.ts',
    fixtureExportName: 'METROGAS_REAL_2025_08',
  },
  {
    servicio: 'gas',
    empresa: 'Lipigas',
    slug: 'lipigas',
    basePath: '/boleta-gas',
    fixturePath: 'src/lib/parsers/__fixtures__/lipigas-real-2021-08.ts',
    fixtureExportName: 'LIPIGAS_REAL_2021_08',
  },
  {
    servicio: 'gas',
    empresa: 'Abastible',
    slug: 'abastible',
    basePath: '/boleta-gas',
    fixturePath: 'src/lib/parsers/__fixtures__/abastible-real-2022-06.ts',
    fixtureExportName: 'ABASTIBLE_REAL_2022_06',
  },
  {
    servicio: 'gas',
    empresa: 'Gasco GLP',
    slug: 'gasco-glp',
    basePath: '/boleta-gas',
    fixturePath: 'src/lib/parsers/__fixtures__/gasco-real-2024-06.ts',
    fixtureExportName: 'GASCO_REAL_2024_06',
  },
]

function readFixtureRawText(path: string, exportName: string): string {
  const full = resolve(process.cwd(), path)
  const content = readFileSync(full, 'utf8')
  // El fixture exporta un template literal (`text`). Extraemos el contenido
  // entre los backticks asociados al export name buscado.
  const re = new RegExp(`export const ${exportName}\\s*=\\s*\`([\\s\\S]*?)\``, 'm')
  const m = content.match(re)
  if (!m) {
    throw new Error(
      `No pude extraer ${exportName} de ${path}. Verificá el formato del fixture.`,
    )
  }
  return m[1]
}

test.describe('Result view: 14 empresas con sus fixtures reales', () => {
  for (const e of EMPRESAS) {
    test(`${e.empresa}: fixture real → result page renderiza sin error`, async ({
      page,
    }) => {
      test.setTimeout(30_000)
      const rawText = readFixtureRawText(e.fixturePath, e.fixtureExportName)

      await page.goto(e.basePath)
      await page.evaluate(
        ({ key, payload }) => {
          sessionStorage.setItem(key, JSON.stringify(payload))
        },
        {
          key: SESSION_KEY,
          payload: {
            servicio: e.servicio,
            empresa: e.empresa,
            slug: e.slug,
            rawText,
            timestamp: Date.now(),
          },
        },
      )

      await page.goto(`${e.basePath}/${e.slug}`)

      // Debe llegar a un estado terminal (parsed o parser-error o
      // unsupported), no quedarse en skeleton.
      await page.waitForFunction(
        () => {
          const text = document.body.innerText
          return (
            /Resultado/i.test(text) ||
            /No pudimos analizar/i.test(text) ||
            /Aún no analizamos/i.test(text)
          )
        },
        { timeout: 15_000 },
      )

      // Lo importante: el fixture es real, debe llegar al estado "parsed"
      // (con Resultado · {empresa}), NO al estado parser-error.
      await expect(page.getByText(new RegExp(`Resultado.*${e.empresa.replace(/[+]/g, '\\+')}`, 'i'))).toBeVisible({
        timeout: 15_000,
      })

      // Y NO debe mostrar el error UI.
      await expect(page.getByText(/Invalid time value|invalid date/i)).not.toBeVisible()
    })
  }
})
