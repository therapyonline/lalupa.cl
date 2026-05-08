import type { MetadataRoute } from 'next'
import { getAllGuias } from '@/lib/guias'
import { SITE_URL } from '@/lib/seo'

interface StaticEntry {
  path: string
  priority: number
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
}

const STATIC_ROUTES: StaticEntry[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/boleta-luz', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/boleta-agua', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/boleta-gas', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/reclamar-sernac', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/subsidio-electrico', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/comparador-internet-hogar', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/guias', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/como-funciona', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/sobre', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacidad', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terminos', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/contacto', priority: 0.4, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const guias = await getAllGuias()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  const guiaEntries: MetadataRoute.Sitemap = guias.map((g) => ({
    url: `${SITE_URL}/guias/${g.slug}`,
    lastModified: new Date(g.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const categoriaSlugs = ['luz', 'agua', 'gas', 'derechos', 'internet']
  const categoriaEntries: MetadataRoute.Sitemap = categoriaSlugs.map(
    (slug) => ({
      url: `${SITE_URL}/guias/categoria/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  )

  return [...staticEntries, ...guiaEntries, ...categoriaEntries]
}
