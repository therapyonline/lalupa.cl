import { expect, test, type Page } from '@playwright/test'

const answers = {
  esMayorDeEdad: true,
  rshYTramo: '0-40',
  hayElectrodependiente: false,
  esClienteResidencial: true,
  estaEnSistemaRegulado: true,
  estaAlDia: true,
  tieneClaveUnica: false,
  cantidadIntegrantes: 4,
  otroIntegranteYaPostulo: false,
  hayPersonaConDiscapacidad: false,
  hayNinos: true,
  hayAdultoMayor: false,
  hayPersonaCuidadora: false,
}

async function restore(page: Page, draft: object) {
  await page.addInitScript((value) => {
    sessionStorage.setItem('lalupa:subsidio:wizard', JSON.stringify(value))
  }, draft)
  await page.goto('/subsidio-electrico')
}

test('informa el cierre y ofrece consulta oficial antes de pedir respuestas', async ({
  page,
}) => {
  await page.goto('/subsidio-electrico')
  await expect(
    page.getByRole('heading', {
      name: 'Postulación cerrada · quinta convocatoria',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Consultar resultado oficial' }),
  ).toHaveAttribute(
    'href',
    'https://www.ventanillaunicasocial.gob.cl/ficha/381/subsidio-electrico',
  )
  await expect(
    page.getByRole('heading', { name: '¿Tenías 18 años o más al postular?' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /^Postular/ })).toHaveCount(0)
})

test('muestra montos de referencia sin adjudicar beneficio ni inventar prioridad', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await restore(page, { version: 3, step: 12, answers })
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Tus respuestas coinciden con los requisitos consultados.',
  )
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.getByText('$ 31.224', { exact: true })).toBeVisible()
  await expect(page.getByText(/5\.204 por cuota/)).toBeVisible()
  await expect(
    page.getByText(/No es un monto adjudicado a tu hogar/),
  ).toBeVisible()
  await expect(
    page.getByText(/No representan un puntaje ni una probabilidad/),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'Postulación cerrada · quinta convocatoria',
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /^Postular/ })).toHaveCount(0)
  await expect(page).toHaveURL(/\/subsidio-electrico$/)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/subsidio-resultado-mobile.png',
    fullPage: true,
  })
})

test('no cumplir el corte de pago requiere revisar antecedentes', async ({
  page,
}) => {
  await restore(page, {
    version: 3,
    step: 12,
    answers: { ...answers, estaAlDia: false },
  })
  await page.getByRole('button', { name: 'Ver resultado', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hay antecedentes que revisar.',
  )
  await expect(page.getByText(/Regularizar hoy no acredita/)).toBeVisible()
  await expect(page.getByText('$ 31.224', { exact: true })).toHaveCount(0)
})

test('un borrador anterior no reinterpreta el pago actual como pago al corte', async ({
  page,
}) => {
  await restore(page, { version: 2, step: 12, answers })
  await expect(page.getByRole('status')).toContainText(
    'No pudimos recuperar el borrador',
  )
  await expect(
    page.getByRole('heading', { name: '¿Tenías 18 años o más al postular?' }),
  ).toBeVisible()
  await expect(
    page.getByRole('radio', { name: 'Sí', exact: true }),
  ).toHaveAttribute('aria-checked', 'false')
})

test('rechaza integrantes fraccionarios sin truncarlos y admite hogares de más de doce', async ({
  page,
}) => {
  await restore(page, { version: 3, step: 7, answers })
  await page.getByRole('spinbutton').fill('1.5')
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
  await expect(page.locator('main').getByRole('alert')).toHaveText(
    'Ingresa una cantidad entera de personas.',
  )
  await expect(page.getByRole('spinbutton')).toHaveValue('1.5')
  await page.getByRole('spinbutton').fill('13')
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
  await expect(
    page.getByRole('heading', {
      name: '¿Otra persona de tu hogar ya postuló a esta convocatoria del subsidio?',
    }),
  ).toBeVisible()
})

test('la guía sustituye el placeholder y mantiene FAQ y fecha consistentes', async ({
  page,
}) => {
  await page.goto('/guias/subsidio-electrico-2026-requisitos')
  await expect(page.locator('article')).not.toContainText(
    /placeholder|32\.224/i,
  )
  await expect(
    page.getByRole('cell', { name: '$31.224', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('meta[property="article:modified_time"]'),
  ).toHaveAttribute('content', '2026-09-26')
  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((elements) =>
      elements.flatMap((element) => JSON.parse(element.textContent ?? '{}')),
    )
  const faq = schemas.find((schema) => schema['@type'] === 'FAQPage')
  expect(faq.mainEntity).toHaveLength(3)
  for (const question of faq.mainEntity) {
    const summary = page.locator('summary').filter({ hasText: question.name })
    await expect(summary).toBeVisible()
    await summary.click()
    await expect(
      page.getByText(question.acceptedAnswer.text, { exact: true }),
    ).toBeVisible()
  }
})
