import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import {
  breadcrumbsSchema,
  buildMetadata,
  collectionPageSchema,
} from '@/lib/seo'
import { getAllGuias } from '@/lib/guias'
import { GuiasList } from './_components/guias-list'

const CATEGORIA_LINKS = [
  { href: '/guias/categoria/luz', label: 'Luz' },
  { href: '/guias/categoria/agua', label: 'Agua' },
  { href: '/guias/categoria/gas', label: 'Gas' },
  { href: '/guias/categoria/derechos', label: 'Derechos' },
  { href: '/guias/categoria/internet', label: 'Internet' },
] as const

export const metadata = buildMetadata({
  title: 'Guías',
  description:
    'Guías editoriales sobre boletas de servicios básicos, derechos del consumidor y subsidios en Chile. Sin jerga, sin SaaS-ese.',
  path: '/guias',
  ogKind: 'guide',
  keywords: [
    'guías boletas Chile',
    'derechos consumidor Chile',
    'subsidios servicios básicos',
    'cómo leer boleta luz agua gas',
  ],
})

export default async function GuiasPage() {
  const guias = await getAllGuias()
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Guías', href: '/guias' },
          ]),
          collectionPageSchema({
            name: 'Guías de lalupa.cl',
            description:
              'Guías editoriales sobre boletas de servicios básicos, derechos del consumidor y subsidios en Chile.',
            path: '/guias',
            items: guias.map((g) => ({
              title: g.title,
              path: `/guias/${g.slug}`,
            })),
          }),
        ]}
      />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Guías editoriales
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Lo que necesitas saber, sin paja.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Artículos cortos sobre cómo leer tus boletas, cómo defenderte cuando
            un cobro no calza, y cómo postular a beneficios estatales. Cada uno
            linkea a la herramienta correspondiente.
          </p>
          <nav
            aria-label="Navegar por categoría"
            className="mt-8 flex flex-wrap gap-2"
          >
            {CATEGORIA_LINKS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="inline-flex items-center rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <GuiasList guias={guias} />
        </Container>
      </section>
    </main>
  )
}
