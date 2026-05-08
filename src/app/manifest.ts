import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'lalupa',
    description:
      'Revisa tus boletas de luz, agua, gas e internet en tu navegador. Sin uploads, sin registro.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFCF5',
    theme_color: '#FF6B35',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    lang: 'es-CL',
    orientation: 'portrait',
    categories: ['utilities', 'finance', 'productivity'],
  }
}
