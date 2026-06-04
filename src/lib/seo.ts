import type { Metadata } from 'next'

export const SITE_URL = 'https://lalupa.cl'
export const SITE_NAME = 'Lalupa.cl'
export const SITE_LOCALE = 'es_CL'

export type OgKind = 'home' | 'tool' | 'guide'

interface BuildMetadataInput {
  title?: string
  description: string
  path: string
  ogKind?: OgKind
  /** Fuerza un título específico para OG (útil si el title es muy largo). */
  ogTitle?: string
  /** Subtítulo opcional para OG (ej: 'Luz', 'Agua') que se muestra en el eyebrow. */
  ogCategory?: string
  noindex?: boolean
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
  type?: 'website' | 'article'
}

export function buildOgImageUrl(
  title: string,
  kind: OgKind = 'tool',
  category?: string,
): string {
  const params = new URLSearchParams({ title, kind })
  if (category) params.set('category', category)
  return `${SITE_URL}/api/og?${params.toString()}`
}

export function buildMetadata({
  title,
  description,
  path,
  ogKind = 'tool',
  ogTitle,
  ogCategory,
  noindex,
  publishedTime,
  modifiedTime,
  keywords,
  type,
}: BuildMetadataInput): Metadata {
  const fullUrl = `${SITE_URL}${path}`
  const resolvedOgTitle = ogTitle ?? title ?? SITE_NAME
  const ogImageUrl = buildOgImageUrl(resolvedOgTitle, ogKind, ogCategory)
  const resolvedType =
    type ?? (ogKind === 'guide' ? 'article' : 'website')

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
      languages: { 'es-CL': fullUrl },
    },
    openGraph: {
      title: resolvedOgTitle,
      description,
      url: fullUrl,
      type: resolvedType,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: resolvedOgTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedOgTitle,
      description,
      images: [ogImageUrl],
    },
    ...(noindex && { robots: { index: false, follow: false } }),
  }
}

interface BreadCrumb {
  name: string
  href: string
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      'Herramienta de defensa al consumidor chileno: parsea boletas de servicios básicos en el navegador y detecta cobros sospechosos.',
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'es-CL',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  }
}

export function webApplicationSchema(opts: {
  name: string
  description: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    inLanguage: 'es-CL',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CLP',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  }
}

export function articleSchema(opts: {
  title: string
  description: string
  path: string
  publishedAt: string
  updatedAt: string
  author?: string
  keywords?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    datePublished: opts.publishedAt,
    dateModified: opts.updatedAt,
    inLanguage: 'es-CL',
    author: opts.author
      ? { '@type': 'Person', name: opts.author }
      : { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
    },
    keywords: opts.keywords?.join(', '),
    image: buildOgImageUrl(opts.title, 'guide'),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}${opts.path}`,
    },
  }
}

export function breadcrumbsSchema(crumbs: BreadCrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href}`,
    })),
  }
}

export function collectionPageSchema(opts: {
  name: string
  description: string
  path: string
  items: ReadonlyArray<{ title: string; path: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    inLanguage: 'es-CL',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${item.path}`,
        name: item.title,
      })),
    },
  }
}

export function faqPageSchema(qas: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.a,
      },
    })),
  }
}

/**
 * Schema HowTo para instrucciones paso a paso. Google muestra esto
 * como rich result con los pasos numerados y descripciones.
 */
export function howToSchema(howTo: {
  name: string
  description: string
  steps: ReadonlyArray<{ name: string; text: string }>
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((s) => ({
      '@type': 'HowToStep',
      name: s.name,
      text: s.text,
    })),
  }
}
