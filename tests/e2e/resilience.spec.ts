import { expect, test } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { createHash } from 'node:crypto'
import { PARSER_ASSETS } from '../../src/generated/parser-assets'
import manifest from '../../src/generated/parser-assets-manifest.json'

test('recursos de lectura versionados: worker exacto y caché inmutable', async ({
  request,
}) => {
  for (const [group, name] of [
    [manifest.pdf, 'pdf.worker.min.mjs'],
    [manifest.ocr, 'worker.min.js'],
  ] as const) {
    const response = await request.get(`${group.base}/${name}`)
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toContain('immutable')
    const expected = group.files.find((f) => f.name === name)!
    expect(
      createHash('sha256')
        .update(await response.body())
        .digest('hex'),
    ).toBe(expected.sha256)
  }
  expect(PARSER_ASSETS.pdfWorker).toBe(
    `${manifest.pdf.base}/pdf.worker.min.mjs`,
  )
  const icon = await request.get('/icon.svg')
  expect(icon.headers()['cache-control']).not.toContain('immutable')
})

for (const [path, key, invalid] of [
  ['/reclamar-sernac', 'lalupa:reclamo:wizard', { step: 99, data: {} }],
  [
    '/subsidio-electrico',
    'lalupa:subsidio:wizard',
    { step: -1, answers: { esMayorDeEdad: 'sí' } },
  ],
] as const) {
  test(`${path}: borrador inválido no rompe el formulario`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(
      ({ key, invalid }) =>
        sessionStorage.setItem(key, JSON.stringify(invalid)),
      { key, invalid },
    )
    await page.goto(path)
    await expect(
      page.getByText(/No pudimos recuperar el borrador anterior/),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Siguiente', exact: true }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })
  test(`${path}: almacenamiento bloqueado permite continuar en memoria`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await page.goto(path)
    await expect(
      page.getByText(/El navegador no permite guardar este borrador/),
    ).toBeVisible()
    if (path === '/reclamar-sernac')
      await page.getByLabel('Otro', { exact: true }).check()
    else await page.getByRole('radio', { name: 'Sí', exact: true }).click()
    await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
    if (path === '/reclamar-sernac')
      await expect(page.getByLabel('Nombre completo')).toBeVisible()
    else
      await expect(
        page.getByRole('heading', { name: /Registro Social de Hogares/ }),
      ).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('reclamo nuevo conserva datos personales y permite recuperar el borrador anterior', async ({
  page,
}) => {
  await page.goto('/sobre')
  await page.evaluate(() => {
    sessionStorage.setItem(
      'lalupa:reclamo:wizard',
      JSON.stringify({
        version: 2,
        source: 'anterior',
        step: 4,
        data: {
          nombre: 'Ana Prueba',
          hechos: 'Mi borrador anterior',
          empresaRazonSocial: 'Otra empresa',
        },
      }),
    )
    sessionStorage.setItem(
      'lalupa:reclamo',
      JSON.stringify({
        empresaSlug: 'cge',
        empresaNombre: 'CGE',
        servicio: 'electricidad',
        total: 111543,
        cargosSospechosos: [{ concepto: 'Seguro', monto: 2000 }],
      }),
    )
  })
  await page.goto('/reclamar-sernac')
  await expect(page.getByText(/Cargamos una boleta distinta/)).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem('lalupa:reclamo:wizard')!).data
            .nombre,
      ),
    )
    .toBe('Ana Prueba')
  const data = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('lalupa:reclamo:wizard')!),
  )
  expect(data.step).toBe(1)
  expect(data.data.hechos).toContain('CGE')
  expect(data.data.hechos).not.toContain('Mi borrador anterior')
  await page
    .getByRole('button', { name: 'Recuperar borrador anterior' })
    .click()
  await expect(page.getByRole('textbox').first()).toHaveValue(
    'Mi borrador anterior',
  )
  await page.reload()
  await expect(page.getByRole('textbox').first()).toHaveValue(
    'Mi borrador anterior',
  )
})

test('tracker vacío importa, muestra y exporta una boleta sin fechas', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/tracker')
  await expect(
    page.getByRole('button', { name: 'Importar JSON' }),
  ).toBeVisible()
  const payload = {
    version: 1,
    boletas: [
      {
        id: 'legacy',
        empresa: 'CGE',
        servicio: 'electricidad',
        periodo: { desde: null, hasta: null },
        cliente: {},
        consumo: { unidad: 'kWh', valor: 0 },
        cargos: [],
        totales: { subtotal: 0, iva: 0, total: 45000 },
        raw: 'Lectura parcial',
        guardadoEn: '2026-01-01T00:00:00.000Z',
      },
    ],
  }
  await page.locator('input[type=file]').setInputFiles({
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  })
  await expect(
    page.getByText('1 boleta agregada.', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ver boletas sin período' }).click()
  await expect(
    page.getByRole('dialog').getByText('CGE', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).not.toContainText('NaN')
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar JSON' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const saved = JSON.parse(Buffer.concat(chunks).toString())
  expect(saved.version).toBe(2)
  expect(saved.boletas[0].periodo.desde).toBeNull()
  expect(saved.boletas[0].totales.total).toBe(45000)
  expect(errors).toEqual([])
})

test('tracker permite reintentar cuando falla IndexedDB', async ({ page }) => {
  await page.addInitScript(() => {
    const open = IDBFactory.prototype.open
    let first = true
    IDBFactory.prototype.open = function (...args) {
      if (first) {
        first = false
        throw new DOMException('Permiso temporal', 'SecurityError')
      }
      return open.apply(this, args)
    }
  })
  await page.goto('/tracker')
  await expect(
    page.getByRole('heading', { name: 'No pudimos leer tu histórico' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Reintentar lectura' }).click()
  await expect(
    page.getByRole('heading', { name: 'Sube tu primera boleta' }),
  ).toBeVisible()
})

test('PDF mixto: conserva el texto nativo y lee cargos de la página escaneada', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/boleta-luz')
  const png = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 900
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 1200, 900)
    ctx.fillStyle = 'black'
    ctx.font = '40px sans-serif'
    const lines = [
      'DETALLE DE CARGOS CGE',
      'Cargo fijo BT1 $ 1.048',
      'Cargo por energia $ 45.234',
      'Consumo 280 kWh',
      'Subtotal $ 93.734',
      'IVA 19% $ 17.809',
      'Total a pagar $ 111.543',
    ]
    lines.forEach((line, i) => ctx.fillText(line, 60, 100 + i * 100))
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!)),
    )
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const first = pdf.addPage([600, 800])
  const lines = [
    'CGE COMPANIA GENERAL DE ELECTRICIDAD S.A.',
    'RUT: 99.513.400-4',
    'N° Cliente: 12345678-9',
    'Periodo facturado: 15/04/2026 al 15/05/2026',
    'Fecha de emision: 16/05/2026',
    'www.cge.cl',
  ]
  lines.forEach((line, i) =>
    first.drawText(line, { x: 30, y: 740 - i * 30, size: 14, font }),
  )
  const scan = await pdf.embedPng(new Uint8Array(png))
  pdf
    .addPage([600, 450])
    .drawImage(scan, { x: 0, y: 0, width: 600, height: 450 })
  const external: string[] = []
  page.on('request', (request) => {
    if (/tessdata\.projectnaptha|cdn\.jsdelivr|unpkg/.test(request.url()))
      external.push(request.url())
  })
  await page.locator('input[type=file]').setInputFiles({
    name: 'mixta.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save()),
  })
  await page.waitForURL('/boleta-luz/cge', { timeout: 80_000 })
  await expect(
    page.getByText('Cargo fijo', { exact: true }).first(),
  ).toBeVisible()
  const raw = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem('lalupa:lastParsed')!)
        .rawText as string,
  )
  expect(raw).toContain('12345678-9')
  expect(raw).toMatch(/111[.,]543/)
  expect(external).toEqual([])
  // Segunda lectura en el mismo navegador: recursos y modelo ya cargados.
  await page.goto('/boleta-luz')
  await page.locator('input[type=file]').setInputFiles({
    name: 'mixta.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save()),
  })
  await page.waitForURL('/boleta-luz/cge', { timeout: 80_000 })
  await expect(
    page.getByText('Cargo fijo', { exact: true }).first(),
  ).toBeVisible()
  expect(external).toEqual([])
})

test('PDF largo se rechaza explícitamente, sin leer solo una parte', async ({
  page,
}) => {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < 11; i++) pdf.addPage()
  await page.goto('/boleta-luz')
  await page.locator('input[type=file]').setInputFiles({
    name: 'larga.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save()),
  })
  await expect(page.getByText(/El PDF tiene 11 páginas/)).toBeVisible({
    timeout: 30_000,
  })
  expect(
    await page.evaluate(() => sessionStorage.getItem('lalupa:lastParsed')),
  ).toBeNull()
})

test('agregar una página permite guardar la nueva lectura sin sobrescribir la anterior', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/sobre')
  await page.evaluate(() =>
    sessionStorage.setItem(
      'lalupa:lastParsed',
      JSON.stringify({
        servicio: 'electricidad',
        empresa: 'CGE',
        slug: 'cge',
        timestamp: Date.now(),
        rawText:
          'CGE DISTRIBUCION S.A.\nRUT: 99.513.400-4\nN° Cliente: 12345678-9\nPeriodo facturado: 15/04/2026 al 15/05/2026\nTotal a pagar: $ 45.000\ncge.cl',
      }),
    ),
  )
  await page.goto('/boleta-luz/cge')
  await page.getByRole('button', { name: 'Guardar en mi histórico' }).click()
  await expect(
    page.getByRole('button', { name: 'Guardado en histórico ✓' }),
  ).toBeDisabled()
  const png = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 500
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 1200, 500)
    ctx.fillStyle = 'black'
    ctx.font = '44px sans-serif'
    ;[
      'DETALLE DE CARGOS CGE',
      'Cargo fijo BT1 $ 1.048',
      'Cargo por energia $ 40.000',
      'Consumo 250 kWh',
    ].forEach((line, i) => ctx.fillText(line, 60, 100 + i * 100))
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!)),
    )
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  await page
    .getByLabel('Agregar foto (frente, reverso, otra página)')
    .setInputFiles({
      name: 'reverso.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png),
    })
  const save = page.getByRole('button', { name: 'Guardar en mi histórico' })
  await expect(save).toBeEnabled({ timeout: 75_000 })
  await save.click()
  await expect(
    page.getByRole('button', { name: 'Guardado en histórico ✓' }),
  ).toBeDisabled()
  const count = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('lalupa', 1)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    const n = await new Promise<number>((resolve, reject) => {
      const r = db.transaction('boletas').objectStore('boletas').count()
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    db.close()
    return n
  })
  expect(count).toBe(2)
  await page.goto('/tracker')
  await expect(page.getByRole('heading', { name: /1 boleta ·/ })).toBeVisible()
  await page.getByRole('button', { name: 'Ver versiones anteriores' }).click()
  await expect(
    page.getByRole('dialog').getByText('CGE', { exact: true }),
  ).toBeVisible()
})
