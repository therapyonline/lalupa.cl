import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Pill } from '@/components/ui/Pill'
import {
  type CategoriaGuia,
  type GuiaMeta,
  getGuiasForTool,
} from '@/lib/guias'

const CATEGORY_LABEL: Record<CategoriaGuia, string> = {
  luz: 'Luz',
  agua: 'Agua',
  gas: 'Gas',
  derechos: 'Derechos',
  internet: 'Internet',
}

export async function RelatedGuias({
  toolPath,
  eyebrow = 'Guías relacionadas',
  title = 'Lee también',
  className,
  limit = 3,
}: {
  toolPath: string
  eyebrow?: string
  title?: string
  className?: string
  limit?: number
}) {
  const guias = await getGuiasForTool(toolPath)
  if (guias.length === 0) return null

  const visibles = guias.slice(0, limit)

  return (
    <section className={className ?? 'bg-white py-16'}>
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
              {title}
            </h2>
          </div>
          <Link
            href="/guias"
            className="hidden text-sm font-medium text-primary hover:underline md:inline"
          >
            Ver todas →
          </Link>
        </div>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {visibles.map((g) => (
            <RelatedGuiaCard key={g.slug} guia={g} />
          ))}
        </ul>
      </Container>
    </section>
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
          <Pill variant="info">{CATEGORY_LABEL[guia.category]}</Pill>
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
