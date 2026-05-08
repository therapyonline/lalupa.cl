#!/usr/bin/env node
/**
 * Auditoría de Core Web Vitals via Playwright contra servidor local.
 *
 * Uso:
 *   pnpm build && pnpm start &   # en otra terminal
 *   node scripts/perf-audit.mjs http://localhost:3000
 *
 * Mide:
 *   - FCP (First Contentful Paint)
 *   - LCP (Largest Contentful Paint)
 *   - CLS (Cumulative Layout Shift, manual via PerformanceObserver)
 *   - TTFB (Time To First Byte)
 *   - Initial JS payload (Network)
 *   - DOMContentLoaded / Load
 *
 * No reemplaza Lighthouse oficial (no calcula score), pero da las
 * métricas crudas para validar < umbrales del usuario.
 */

import { chromium } from '@playwright/test'

const URL = process.argv[2] ?? 'http://localhost:3000'
const ROUTES = ['/', '/boleta-luz', '/guias', '/comparador-internet-hogar']

async function auditRoute(browser, route) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 800 },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  let totalJsBytes = 0
  let totalCssBytes = 0
  let totalImageBytes = 0
  page.on('response', async (resp) => {
    try {
      const status = resp.status()
      if (status < 200 || status >= 400) return
      const ct = resp.headers()['content-type'] ?? ''
      const cl = Number(resp.headers()['content-length'] ?? 0)
      const len =
        cl > 0
          ? cl
          : (await resp.body().catch(() => Buffer.alloc(0))).byteLength
      if (ct.includes('javascript')) totalJsBytes += len
      else if (ct.includes('css')) totalCssBytes += len
      else if (ct.startsWith('image/')) totalImageBytes += len
    } catch {
      // ignore
    }
  })

  const fullUrl = `${URL}${route}`
  const t0 = Date.now()

  // Configura PerformanceObserver ANTES de la navegación para capturar
  // LCP buffered.
  await page.addInitScript(() => {
    window.__lcp = 0
    window.__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__lcp = Math.max(window.__lcp, entry.startTime)
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  await page.goto(fullUrl, { waitUntil: 'load', timeout: 30000 })
  const tLoad = Date.now() - t0

  // Wait extra para que LCP se estabilice (especialmente sobre fonts swap).
  await page.waitForTimeout(2500)

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint')
    const fcp = paint.find((p) => p.name === 'first-contentful-paint')?.startTime
    const fp = paint.find((p) => p.name === 'first-paint')?.startTime

    return {
      ttfb: nav?.responseStart,
      domContentLoaded: nav?.domContentLoadedEventEnd,
      domLoad: nav?.loadEventEnd,
      transferSize: nav?.transferSize,
      encodedBodySize: nav?.encodedBodySize,
      decodedBodySize: nav?.decodedBodySize,
      firstPaint: fp,
      firstContentfulPaint: fcp,
      largestContentfulPaint: window.__lcp || undefined,
      cls: window.__cls || 0,
    }
  })

  await context.close()

  return {
    route,
    fullUrl,
    fcp: metrics.firstContentfulPaint?.toFixed(0),
    lcp: metrics.largestContentfulPaint?.toFixed(0),
    cls: (metrics.cls ?? 0).toFixed(4),
    ttfb: metrics.ttfb?.toFixed(0),
    domContentLoaded: metrics.domContentLoaded?.toFixed(0),
    domLoad: metrics.domLoad?.toFixed(0),
    walltimeLoad: tLoad,
    transferKB: ((metrics.transferSize ?? 0) / 1024).toFixed(1),
    jsKB: (totalJsBytes / 1024).toFixed(1),
    cssKB: (totalCssBytes / 1024).toFixed(1),
    imgKB: (totalImageBytes / 1024).toFixed(1),
  }
}

async function main() {
  const browser = await chromium.launch()
  console.log(`\n🔍 Auditando ${URL}\n`)
  const rows = []
  for (const route of ROUTES) {
    const r = await auditRoute(browser, route)
    rows.push(r)
    console.log(`✓ ${route}`)
  }
  await browser.close()

  console.log('\n📊 Core Web Vitals (ms / count / kB):\n')
  console.log(
    'route                              FCP    LCP    CLS     TTFB   JS     CSS   img',
  )
  console.log(
    '-----------------------------------------------------------------------------',
  )
  for (const r of rows) {
    const route = r.route.padEnd(34)
    const fcp = String(r.fcp ?? '?').padStart(5)
    const lcp = String(r.lcp ?? '?').padStart(5)
    const cls = String(r.cls).padStart(7)
    const ttfb = String(r.ttfb ?? '?').padStart(5)
    const js = `${r.jsKB}kB`.padStart(8)
    const css = `${r.cssKB}kB`.padStart(6)
    const img = `${r.imgKB}kB`.padStart(6)
    console.log(`${route} ${fcp}  ${lcp}  ${cls}  ${ttfb}  ${js}  ${css}  ${img}`)
  }
  console.log('\nUmbrales (Web.dev / Lighthouse mobile):')
  console.log('  LCP < 2500ms (good)  < 1500ms (excellent)')
  console.log('  CLS < 0.1   (good)  < 0.05   (excellent)')
  console.log('  FCP < 1800ms (good)  < 1000ms (excellent)\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
