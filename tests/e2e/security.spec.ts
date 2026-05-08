import { expect, test } from '@playwright/test'

/**
 * Verifica que los headers de seguridad de producción estén presentes
 * en cada response. Si alguien remueve `headers()` de next.config.ts o
 * cambia los valores, este test falla.
 */

test.describe('Security headers', () => {
  test('headers críticos presentes en /', async ({ request }) => {
    const res = await request.get('/')
    expect(res.ok()).toBe(true)
    const h = res.headers()
    expect(h['strict-transport-security']).toContain('max-age=63072000')
    expect(h['strict-transport-security']).toContain('includeSubDomains')
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['permissions-policy']).toContain('camera=()')
    expect(h['permissions-policy']).toContain('microphone=()')
    expect(h['permissions-policy']).toContain('geolocation=()')
  })

  test('CSP base configurada correctamente', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy'] ?? ''
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('wasm-unsafe-eval') // Tesseract
    expect(csp).toContain("worker-src 'self' blob:")
    expect(csp).toContain('upgrade-insecure-requests')
    // No CDN externo permitido
    expect(csp).not.toContain('cdn.')
    expect(csp).not.toContain('unpkg')
  })

  test('headers también presentes en assets dinámicos (/api/og)', async ({
    request,
  }) => {
    const res = await request.get('/api/og?title=test&kind=tool')
    const h = res.headers()
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['x-content-type-options']).toBe('nosniff')
  })

  test('Tesseract worker se sirve same-origin con headers de seguridad', async ({
    request,
  }) => {
    const res = await request.get('/tesseract/worker.min.js')
    expect(res.ok()).toBe(true)
    const h = res.headers()
    expect(h['x-content-type-options']).toBe('nosniff')
  })
})

test.describe('Health check', () => {
  test('GET /api/health responde 200 con status ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(typeof body.uptimeSeconds).toBe('number')
  })

  test('respuesta de health no se cachea', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.headers()['cache-control']).toContain('no-store')
  })
})
