import { describe, expect, it } from 'vitest'
import {
  SITE_URL,
  articleSchema,
  breadcrumbsSchema,
  buildMetadata,
  buildOgImageUrl,
  collectionPageSchema,
  faqPageSchema,
  organizationSchema,
  webApplicationSchema,
  websiteSchema,
} from './seo'

describe('buildOgImageUrl', () => {
  it('builds /api/og URL with title and kind params', () => {
    const url = buildOgImageUrl('Boleta de luz', 'tool')
    expect(url).toContain(`${SITE_URL}/api/og?`)
    expect(url).toContain('title=Boleta+de+luz')
    expect(url).toContain('kind=tool')
  })

  it('defaults kind to "tool"', () => {
    const url = buildOgImageUrl('Algo')
    expect(url).toContain('kind=tool')
  })

  it('encodes special characters in the title', () => {
    const url = buildOgImageUrl('¿Por qué subió?', 'guide')
    expect(url).toContain('kind=guide')
    expect(url).toMatch(/title=%C2%BFPor\+qu%C3%A9\+subi%C3%B3%3F/)
  })

  it('includes category param when provided', () => {
    const url = buildOgImageUrl('Algo', 'guide', 'Luz')
    expect(url).toContain('category=Luz')
  })

  it('omits category when not provided', () => {
    const url = buildOgImageUrl('Algo', 'guide')
    expect(url).not.toContain('category=')
  })
})

describe('buildMetadata', () => {
  it('sets canonical to path (relative, Next resolves with metadataBase)', () => {
    const m = buildMetadata({
      title: 'Test',
      description: 'Test page',
      path: '/algo',
    })
    expect(m.alternates?.canonical).toBe('/algo')
  })

  it('hreflang language map points to absolute URL', () => {
    const m = buildMetadata({
      title: 'Test',
      description: 'Test',
      path: '/algo',
    })
    expect(m.alternates?.languages).toEqual({
      'es-CL': `${SITE_URL}/algo`,
    })
  })

  it('uses ogTitle when provided, falling back to title', () => {
    const a = buildMetadata({
      title: 'Largo título',
      ogTitle: 'Corto',
      description: 'd',
      path: '/x',
    })
    expect(a.openGraph?.title).toBe('Corto')
    const b = buildMetadata({ title: 'Solo título', description: 'd', path: '/x' })
    expect(b.openGraph?.title).toBe('Solo título')
  })

  it('uses og type=article when ogKind=guide and no override', () => {
    const m = buildMetadata({
      title: 'Guía',
      description: 'd',
      path: '/g',
      ogKind: 'guide',
    })
    expect(m.openGraph?.type).toBe('article')
  })

  it('uses og type=website when ogKind=tool', () => {
    const m = buildMetadata({
      title: 'Tool',
      description: 'd',
      path: '/t',
      ogKind: 'tool',
    })
    expect(m.openGraph?.type).toBe('website')
  })

  it('respects explicit type override', () => {
    const m = buildMetadata({
      title: 'X',
      description: 'd',
      path: '/x',
      ogKind: 'guide',
      type: 'website',
    })
    expect(m.openGraph?.type).toBe('website')
  })

  it('adds noindex robots when noindex=true', () => {
    const m = buildMetadata({
      title: 'X',
      description: 'd',
      path: '/x',
      noindex: true,
    })
    expect(m.robots).toEqual({ index: false, follow: false })
  })

  it('omits robots when noindex is falsy', () => {
    const m = buildMetadata({ title: 'X', description: 'd', path: '/x' })
    expect(m.robots).toBeUndefined()
  })

  it('twitter card is summary_large_image', () => {
    const m = buildMetadata({ title: 'X', description: 'd', path: '/x' })
    expect(m.twitter?.card).toBe('summary_large_image')
  })

  it('threads ogCategory through to og:image URL', () => {
    const m = buildMetadata({
      title: 'Mi guía',
      description: 'd',
      path: '/g',
      ogKind: 'guide',
      ogCategory: 'Luz',
    })
    const og = m.openGraph as { images: Array<{ url: string }> }
    expect(og.images[0].url).toContain('category=Luz')
  })

  it('passes publishedTime + modifiedTime to OpenGraph when given', () => {
    const m = buildMetadata({
      title: 'G',
      description: 'd',
      path: '/g',
      ogKind: 'guide',
      publishedTime: '2026-01-01',
      modifiedTime: '2026-02-01',
    })
    const og = m.openGraph as { publishedTime?: string; modifiedTime?: string }
    expect(og.publishedTime).toBe('2026-01-01')
    expect(og.modifiedTime).toBe('2026-02-01')
  })
})

describe('JSON-LD schemas', () => {
  it('organizationSchema declares type Organization', () => {
    const s = organizationSchema()
    expect(s['@type']).toBe('Organization')
    expect(s.url).toBe(SITE_URL)
  })

  it('websiteSchema declares type WebSite with es-CL', () => {
    const s = websiteSchema()
    expect(s['@type']).toBe('WebSite')
    expect(s.inLanguage).toBe('es-CL')
  })

  it('webApplicationSchema includes path appended to SITE_URL and offers price 0', () => {
    const s = webApplicationSchema({
      name: 'X',
      description: 'd',
      path: '/boleta-luz',
    })
    expect(s.url).toBe(`${SITE_URL}/boleta-luz`)
    expect(s.offers.price).toBe('0')
    expect(s.offers.priceCurrency).toBe('CLP')
  })

  it('articleSchema sets datePublished + dateModified', () => {
    const s = articleSchema({
      title: 'T',
      description: 'd',
      path: '/guias/x',
      publishedAt: '2026-01-01',
      updatedAt: '2026-02-01',
    })
    expect(s.datePublished).toBe('2026-01-01')
    expect(s.dateModified).toBe('2026-02-01')
    expect(s.url).toBe(`${SITE_URL}/guias/x`)
  })

  it('articleSchema uses Person author when given, Organization fallback otherwise', () => {
    const a = articleSchema({
      title: 'T',
      description: 'd',
      path: '/g',
      publishedAt: '2026-01-01',
      updatedAt: '2026-01-02',
      author: 'Equipo lalupa',
    })
    expect(a.author).toEqual({ '@type': 'Person', name: 'Equipo lalupa' })
    const b = articleSchema({
      title: 'T',
      description: 'd',
      path: '/g',
      publishedAt: '2026-01-01',
      updatedAt: '2026-01-02',
    })
    expect(
      (b.author as { '@type': string })['@type'],
    ).toBe('Organization')
  })

  it('breadcrumbsSchema numbers positions starting at 1', () => {
    const s = breadcrumbsSchema([
      { name: 'Inicio', href: '/' },
      { name: 'Guías', href: '/guias' },
      { name: 'X', href: '/guias/x' },
    ])
    expect(s.itemListElement).toHaveLength(3)
    expect(s.itemListElement[0]).toMatchObject({
      position: 1,
      name: 'Inicio',
      item: `${SITE_URL}/`,
    })
    expect(s.itemListElement[2].position).toBe(3)
  })

  it('collectionPageSchema wraps items in ItemList with positions starting at 1', () => {
    const s = collectionPageSchema({
      name: 'Guías de luz',
      description: 'Todas las guías de luz',
      path: '/guias/categoria/luz',
      items: [
        { title: 'A', path: '/guias/a' },
        { title: 'B', path: '/guias/b' },
      ],
    })
    expect(s['@type']).toBe('CollectionPage')
    expect(s.url).toBe(`${SITE_URL}/guias/categoria/luz`)
    expect(s.mainEntity['@type']).toBe('ItemList')
    expect(s.mainEntity.numberOfItems).toBe(2)
    expect(s.mainEntity.itemListElement).toHaveLength(2)
    expect(s.mainEntity.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'A',
      url: `${SITE_URL}/guias/a`,
    })
    expect(s.mainEntity.itemListElement[1].position).toBe(2)
  })

  it('collectionPageSchema handles empty items list', () => {
    const s = collectionPageSchema({
      name: 'X',
      description: 'd',
      path: '/x',
      items: [],
    })
    expect(s.mainEntity.numberOfItems).toBe(0)
    expect(s.mainEntity.itemListElement).toEqual([])
  })

  it('faqPageSchema maps Q&A to mainEntity', () => {
    const s = faqPageSchema([
      { q: '¿Es gratis?', a: 'Sí.' },
      { q: '¿Sube mi PDF?', a: 'No.' },
    ])
    expect(s['@type']).toBe('FAQPage')
    expect(s.mainEntity).toHaveLength(2)
    expect(s.mainEntity[0].name).toBe('¿Es gratis?')
    expect(s.mainEntity[1].acceptedAnswer.text).toBe('No.')
  })
})
