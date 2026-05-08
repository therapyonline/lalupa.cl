import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        // Rutas privadas que renderizan datos del usuario:
        //  - /tracker es su histórico personal
        //  - /boleta-{servicio}/[empresa]/resultado o /boleta-{servicio}/[empresa]
        //    son los resultados de parsing
        // /api/og se mantiene accesible (lo necesitan los crawlers para
        // generar previews de redes sociales).
        disallow: [
          '/tracker',
          '/boleta-luz/*',
          '/boleta-agua/*',
          '/boleta-gas/*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
