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
 * (App Router lo soporta) — hoy es necesario para hidratación + estilos
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

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
