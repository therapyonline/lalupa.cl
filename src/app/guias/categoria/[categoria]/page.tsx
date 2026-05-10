import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import { Pill } from '@/components/ui/Pill'
import {
  breadcrumbsSchema,
  buildMetadata,
  collectionPageSchema,
} from '@/lib/seo'
import { type CategoriaGuia, type GuiaMeta, getAllGuias } from '@/lib/guias'

const CATEGORIES: ReadonlyArray<{
  slug: CategoriaGuia
  label: string
  title: string
  description: string
  keywords: string[]
}> = [
  {
    slug: 'luz',
    label: 'Luz',
    title: 'Guías de electricidad',
    description:
      'Cómo leer tu boleta de luz, cuándo subió la cuenta, tarifas BT-1 vs BT-2, lectura estimada, subsidio eléctrico y cómo cambiar de comercializadora.',
    keywords: [
      'guías boleta luz chile',
      'cuenta de luz cómo entender',
      'tarifa BT-1 BT-2',
      'subsidio eléctrico requisitos',
    ],
  },
  {
    slug: 'agua',
    label: 'Agua',
    title: 'Guías de agua',
    description:
      'Cómo leer tu boleta de agua, qué cargos cuestionar, subsidio SAP y cómo reclamar a la empresa sanitaria o a la SISS.',
    keywords: [
      'guías boleta agua chile',
      'cargos boleta Aguas Andinas',
      'subsidio SAP postular',
      'sobreconsumo agua',
    ],
  },
  {
    slug: 'gas',
    label: 'Gas',
    title: 'Guías de gas',
    description:
      'Diferencias entre gas natural por red y cilindro, cómo entender la boleta de gas, recargos de delivery y reclamos a SEC.',
    keywords: [
      'gas red vs cilindro chile',
      'precio gas natural',
      'cilindro 15kg',
      'reclamo gas SEC',
    ],
  },
  {
    slug: 'derechos',
    label: 'Derechos',
    title: 'Derechos del consumidor',
    description:
      'Tus derechos cuando reclamas un cobro a una empresa de servicios básicos en Chile: Ley 19.496, plazos, vías formales y compensaciones.',
    keywords: [
      'derechos consumidor servicios básicos',
      'reclamar cobro indebido chile',
      'corte de servicio sin aviso',
      'Ley 19.496',
    ],
  },
  {
    slug: 'internet',
    label: 'Internet',
    title: 'Guías de internet',
    description:
      'Diferencia entre fibra óptica y cable coaxial, cómo elegir plan, reclamos a SUBTEL y cómo bajar tu cuenta de internet residencial.',
    keywords: [
      'comparar internet hogar chile',
      'fibra vs cable',
      'reclamar SUBTEL',
      'mejor plan internet 2026',
    ],
  },
] as const

const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]))

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>
}): Promise<Metadata> {
  const { categoria } = await params
  const cat = CATEGORY_BY_SLUG.get(categoria as CategoriaGuia)
  if (!cat) return { title: 'Categoría no encontrada' }
  return buildMetadata({
    title: cat.title,
    description: cat.description,
    path: `/guias/categoria/${cat.slug}`,
    ogKind: 'guide',
    ogCategory: cat.label,
    keywords: cat.keywords,
  })
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>
}) {
  const { categoria } = await params
  const cat = CATEGORY_BY_SLUG.get(categoria as CategoriaGuia)
  if (!cat) notFound()

  const all = await getAllGuias()
  const guias = all.filter((g) => g.category === cat.slug)

  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Guías', href: '/guias' },
            { name: cat.label, href: `/guias/categoria/${cat.slug}` },
          ]),
          collectionPageSchema({
            name: cat.title,
            description: cat.description,
            path: `/guias/categoria/${cat.slug}`,
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
            <Link href="/guias" className="hover:text-ink">
              Guías
            </Link>{' '}
            · <span>{cat.label}</span>
          </p>
          <h1 className="mt-4 max-w-[22ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            {cat.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            {cat.description}
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.1em] text-soft">
            {guias.length}{' '}
            {guias.length === 1 ? 'guía publicada' : 'guías publicadas'}
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          {guias.length === 0 ? (
            <p className="text-body">
              Todavía no publicamos guías en esta categoría. Vuelve pronto.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {guias.map((g) => (
                <CategoryGuiaCard key={g.slug} guia={g} />
              ))}
            </ul>
          )}
        </Container>
      </section>

      <section className="bg-white py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Otras categorías
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/guias/categoria/${c.slug}`}
                className="inline-flex items-center rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
              >
                {c.label}
              </Link>
            ))}
            <Link
              href="/guias"
              className="inline-flex items-center rounded-full border border-ink bg-ink px-4 py-1.5 text-sm font-medium text-cream"
            >
              Todas
            </Link>
          </div>
        </Container>
      </section>
    </main>
  )
}

function CategoryGuiaCard({ guia }: { guia: GuiaMeta }) {
  return (
    <li>
      <Link
        href={`/guias/${guia.slug}`}
        className="group flex h-full flex-col rounded-[20px] border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-ink"
      >
        <div className="flex items-center justify-between">
          <Pill variant="info">{guia.category}</Pill>
          <span className="font-mono text-[11px] uppercase tracking-wide text-soft">
            {guia.readingTime}
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-medium leading-tight tracking-tight text-ink group-hover:text-primary-deep">
          {guia.title}
        </h2>
        <p className="mt-3 flex-1 text-body">{guia.description}</p>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Leer guía <span aria-hidden>→</span>
        </p>
      </Link>
    </li>
  )
}
