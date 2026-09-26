import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        // Permitir leer el noindex de las pantallas de resultados y tracker.
        // Los datos de boletas se leen del almacenamiento local del navegador;
        // robots.txt no es un mecanismo de privacidad o autorización.
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
