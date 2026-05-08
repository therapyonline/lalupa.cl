import type { NextConfig } from 'next'

/**
 * Headers de seguridad para producción.
 *
 * Filosofía:
 *   - HSTS preload (max-age 2 años + includeSubDomains)
 *   - X-Frame-Options DENY: la app nunca debería embebearse en iframe
 *   - X-Content-Type-Options nosniff: bloquea MIME-sniffing
 *   - Referrer-Policy strict-origin-when-cross-origin: comparte origen sin path
 *   - Permissions-Policy: deshabilita features que la app no usa
 *   - CSP same-origin con `wasm-unsafe-eval` (Tesseract) y `blob:` (pdf-lib)
 *
 * 'unsafe-inline' en script-src/style-src es pendiente de migrar a nonces
 * (App Router lo soporta), hoy es necesario para hidratación + estilos
 * inline que Next inyecta.
 */

const SECURITY_HEADERS = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Cloudflare Web Analytics + MS Clarity son cookie-less. Whitelisteamos
      // sus dominios para el caso opt-in (env vars `NEXT_PUBLIC_CLOUDFLARE_WA_TOKEN`
      // y `NEXT_PUBLIC_CLARITY_PROJECT_ID`). Si el usuario tiene blocker, no
      // cargan y la app funciona igual.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://*.clarity.ms",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.clarity.ms",
      "font-src 'self' data:",
      "connect-src 'self' https://static.cloudflareinsights.com https://cloudflareinsights.com https://*.clarity.ms",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
]

// Cache-Control para assets que servimos directamente desde public/ y rutas
// custom (OG image, tesseract, pdf worker). Las páginas SSG/ISR las cachea
// Vercel en el edge con su propia política.
const CACHE_IMMUTABLE = [
  {
    key: 'Cache-Control',
    value: 'public, max-age=31536000, immutable',
  },
]

const CACHE_24H_REVALIDATE = [
  {
    key: 'Cache-Control',
    value:
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  },
]

const nextConfig: NextConfig = {
  // Quitar header X-Powered-By: Next.
  poweredByHeader: false,

  // Compresión gzip/brotli (default en Vercel pero explícito).
  compress: true,

  // Tree-shake agresivo de paquetes con muchos exports. lucide-react expone
  // ~1000 íconos, nosotros usamos <10. date-fns tiene cientos de funciones
  // y solo importamos format/parseISO/etc.
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    // Inlinea el CSS crítico en <style> dentro del <head> para evitar
    // bloqueo de render. Tailwind v4 ya purga, esto solo cambia transporte.
    inlineCss: true,
  },

  async headers() {
    return [
      // Headers de seguridad globales.
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      // Logo: contenido inmutable, cache largo.
      {
        source: '/icon.svg',
        headers: CACHE_IMMUTABLE,
      },
      // Tesseract assets (worker, core wasm, traineddata): nunca cambian
      // entre deploys salvo upgrade de tesseract.js.
      {
        source: '/tesseract/:path*',
        headers: CACHE_IMMUTABLE,
      },
      // PDF.js worker.
      {
        source: '/pdf.worker.min.mjs',
        headers: CACHE_IMMUTABLE,
      },
      // OG image: regenerable, cache 24h con stale-while-revalidate.
      {
        source: '/api/og',
        headers: CACHE_24H_REVALIDATE,
      },
      // Fuentes Google self-hosted por next/font: hash en filename, immutable.
      {
        source: '/_next/static/media/:path*',
        headers: CACHE_IMMUTABLE,
      },
    ]
  },
}

export default nextConfig
