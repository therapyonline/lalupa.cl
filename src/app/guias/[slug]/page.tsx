import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { compileMDX } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import { Button } from '@/components/ui/Button'
import { mdxComponents } from '@/components/mdx'
import { Toc } from '@/components/guias/Toc'
import {
  TOOL_LABELS,
  getAllGuiaSlugs,
  getGuiaBySlug,
  getRelatedGuias,
  type CategoriaGuia,
  type GuiaMeta,
} from '@/lib/guias'
import {
  articleSchema,
  breadcrumbsSchema,
  buildMetadata,
  faqPageSchema,
} from '@/lib/seo'

const CATEGORY_LABEL: Record<CategoriaGuia, string> = {
  luz: 'Luz',
  agua: 'Agua',
  gas: 'Gas',
  derechos: 'Derechos',
  internet: 'Internet',
}

export async function generateStaticParams() {
  const slugs = await getAllGuiaSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guia = await getGuiaBySlug(slug)
  if (!guia) return { title: 'Guía no encontrada' }
  return buildMetadata({
    title: guia.frontmatter.title,
    description: guia.frontmatter.description,
    path: `/guias/${slug}`,
    ogKind: 'guide',
    ogCategory: CATEGORY_LABEL[guia.frontmatter.category],
    keywords: guia.frontmatter.keywords,
    publishedTime: guia.frontmatter.publishedAt,
    modifiedTime: guia.frontmatter.updatedAt,
    type: 'article',
  })
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guia = await getGuiaBySlug(slug)
  if (!guia) notFound()

  const [{ content }, related] = await Promise.all([
    compileMDX({
      source: guia.source,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          rehypePlugins: [rehypeSlug],
        },
      },
      components: mdxComponents,
    }),
    getRelatedGuias(slug, guia.frontmatter.category),
  ])

  const publishedAt = parseISO(guia.frontmatter.publishedAt)
  const updatedAt = parseISO(guia.frontmatter.updatedAt)
  const wasUpdated =
    guia.frontmatter.updatedAt !== guia.frontmatter.publishedAt

  // Schemas JSON-LD: siempre Article + Breadcrumbs. Si la guía declara
  // `faqs` en su frontmatter, sumamos FAQPage para que Google genere
  // rich results.
  const schemas: Record<string, unknown>[] = [
    articleSchema({
      title: guia.frontmatter.title,
      description: guia.frontmatter.description,
      path: `/guias/${slug}`,
      publishedAt: guia.frontmatter.publishedAt,
      updatedAt: guia.frontmatter.updatedAt,
      author: guia.frontmatter.author,
      keywords: guia.frontmatter.keywords,
    }),
    breadcrumbsSchema([
      { name: 'Inicio', href: '/' },
      { name: 'Guías', href: '/guias' },
      {
        name: guia.frontmatter.title,
        href: `/guias/${slug}`,
      },
    ]),
  ]
  if (
    Array.isArray(guia.frontmatter.faqs) &&
    guia.frontmatter.faqs.length > 0
  ) {
    schemas.push(faqPageSchema(guia.frontmatter.faqs))
  }

  return (
    <main className="flex-1">
      <JsonLd schema={schemas} />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            <Link
              href="/guias"
              className="hover:text-ink"
            >
              Guías
            </Link>{' '}
            ·{' '}
            <span className="text-soft">
              {CATEGORY_LABEL[guia.frontmatter.category]}
            </span>
          </p>
          <h1 className="mt-4 max-w-[28ch] text-[clamp(32px,4.5vw,56px)] font-medium leading-[1.05] tracking-tight text-ink">
            {guia.frontmatter.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            {guia.frontmatter.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.1em] text-soft">
            <span>
              Publicado{' '}
              {format(publishedAt, "d 'de' MMMM yyyy", { locale: es })}
            </span>
            {wasUpdated && (
              <span>
                Actualizado{' '}
                {format(updatedAt, "d 'de' MMMM yyyy", { locale: es })}
              </span>
            )}
            <span>{guia.readingTime}</span>
            {guia.frontmatter.author && <span>{guia.frontmatter.author}</span>}
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
            <article className="prose-guia">{content}</article>

            <aside className="hidden lg:block">
              <div className="lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-6">
                {guia.toc.length > 0 && <Toc entries={guia.toc} />}
                {guia.frontmatter.relatedTools &&
                  guia.frontmatter.relatedTools.length > 0 && (
                    <RelatedToolsList tools={guia.frontmatter.relatedTools} />
                  )}
              </div>
            </aside>
          </div>

          <Footer
            updatedAt={guia.frontmatter.updatedAt}
            author={guia.frontmatter.author}
          />
        </Container>
      </section>

      {related.length > 0 && (
        <section className="bg-white py-16">
          <Container>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Sigue leyendo
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Guías relacionadas
            </h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((g) => (
                <RelatedGuiaCard key={g.slug} guia={g} />
              ))}
            </ul>
          </Container>
        </section>
      )}
    </main>
  )
}

function RelatedGuiaCard({ guia }: { guia: GuiaMeta }) {
  return (
    <li>
      <Link
        href={`/guias/${guia.slug}`}
        className="group flex h-full flex-col rounded-[20px] border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-ink"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-cream-warm px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-ink">
            {CATEGORY_LABEL[guia.category]}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-soft">
            {guia.readingTime}
          </span>
        </div>
        <h3 className="mt-5 text-xl font-medium leading-tight tracking-tight text-ink group-hover:text-primary-deep">
          {guia.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
          {guia.description}
        </p>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Leer <span aria-hidden>→</span>
        </p>
      </Link>
    </li>
  )
}

function RelatedToolsList({ tools }: { tools: string[] }) {
  return (
    <div className="rounded-[16px] border border-border bg-white p-5">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        Herramientas
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {tools.map((href) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex items-center gap-2 text-ink hover:text-primary"
            >
              <span aria-hidden>→</span>
              {TOOL_LABELS[href] ?? href}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Footer({ updatedAt, author }: { updatedAt: string; author?: string }) {
  const updated = parseISO(updatedAt)
  return (
    <footer className="mt-16 border-t border-border pt-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="text-sm text-body">
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Actualización
          </p>
          <p className="mt-2">
            Esta guía fue actualizada el{' '}
            {format(updated, "d 'de' MMMM yyyy", { locale: es })}
            {author && (
              <>
                {' '}
                por <strong className="text-ink">{author}</strong>
              </>
            )}
            . Si encuentras un error o algo desactualizado, escríbenos.
          </p>
        </div>
        <ThumbsFeedback />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="md">
          <Link href="/guias">← Todas las guías</Link>
        </Button>
        <Button asChild variant="dark" size="md">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </footer>
  )
}

function ThumbsFeedback() {
  return (
    <ThumbsClient />
  )
}

import { ThumbsClient } from './_components/thumbs-client'
export { ThumbsClient }
