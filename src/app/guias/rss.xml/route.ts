import { getAllGuias } from '@/lib/guias'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const guias = await getAllGuias()
  const lastBuildDate = new Date().toUTCString()

  const items = guias
    .map((g) => {
      const url = `${SITE_URL}/guias/${g.slug}`
      const pubDate = new Date(g.updatedAt).toUTCString()
      return `    <item>
      <title>${escapeXml(g.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(g.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(g.category)}</category>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Guías</title>
    <link>${SITE_URL}/guias</link>
    <atom:link href="${SITE_URL}/guias/rss.xml" rel="self" type="application/rss+xml" />
    <description>Guías editoriales sobre boletas de servicios básicos, derechos del consumidor y subsidios en Chile.</description>
    <language>es-CL</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
