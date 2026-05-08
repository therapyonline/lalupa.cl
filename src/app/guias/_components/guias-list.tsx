'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Pill } from '@/components/ui/Pill'
import type { CategoriaGuia, GuiaMeta } from '@/lib/guias'
import { cn } from '@/lib/utils'

const CATEGORY_LABEL: Record<CategoriaGuia, string> = {
  luz: 'Luz',
  agua: 'Agua',
  gas: 'Gas',
  derechos: 'Derechos',
  internet: 'Internet',
}

const CATEGORIES: CategoriaGuia[] = [
  'luz',
  'agua',
  'gas',
  'derechos',
  'internet',
]

export function GuiasList({ guias }: { guias: GuiaMeta[] }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CategoriaGuia | 'all'>(
    'all',
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return guias.filter((g) => {
      if (activeCategory !== 'all' && g.category !== activeCategory) return false
      if (!q) return true
      const haystack = [
        g.title,
        g.description,
        g.keywords.join(' '),
        CATEGORY_LABEL[g.category],
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [guias, query, activeCategory])

  const counts = useMemo(() => {
    const map = new Map<CategoriaGuia | 'all', number>()
    map.set('all', guias.length)
    for (const c of CATEGORIES) {
      map.set(c, guias.filter((g) => g.category === c).length)
    }
    return map
  }, [guias])

  return (
    <div>
      <div className="rounded-[20px] border border-border bg-white p-5 md:p-6">
        <label
          htmlFor="guias-search"
          className="font-mono text-xs uppercase tracking-[0.1em] text-soft"
        >
          Buscar
        </label>
        <input
          id="guias-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué andas buscando?"
          className="mt-2 w-full rounded-md border-[1.5px] border-border bg-white px-4 py-3 text-base text-ink placeholder:text-soft focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <CategoryChip
            label="Todas"
            count={counts.get('all') ?? 0}
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={CATEGORY_LABEL[c]}
              count={counts.get(c) ?? 0}
              active={activeCategory === c}
              onClick={() => setActiveCategory(c)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'guía' : 'guías'}
        </p>

        {filtered.length === 0 ? (
          <p className="mt-6 text-body">
            Sin resultados para esos filtros. Prueba quitando el texto o
            cambiando la categoría.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filtered.map((g) => (
              <GuiaCard key={g.slug} guia={g} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-ink bg-ink text-cream'
          : 'border-border bg-white text-ink hover:border-ink',
      )}
    >
      {label}
      <span
        className={cn(
          'font-mono text-[11px] tabular-nums',
          active ? 'text-cream/70' : 'text-soft',
        )}
      >
        {count}
      </span>
    </button>
  )
}

function GuiaCard({ guia }: { guia: GuiaMeta }) {
  return (
    <li>
      <Link
        href={`/guias/${guia.slug}`}
        className="group flex h-full flex-col rounded-[20px] border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_8px_24px_rgba(34,34,34,0.06)]"
      >
        <div className="flex items-center justify-between">
          <Pill variant="info" className="self-start">
            {CATEGORY_LABEL[guia.category]}
          </Pill>
          <span className="font-mono text-[11px] uppercase tracking-wide text-soft">
            {guia.readingTime}
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-medium leading-tight tracking-tight text-ink group-hover:text-primary-deep">
          {guia.title}
        </h2>
        <p className="mt-3 flex-1 text-body">{guia.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {guia.keywords.slice(0, 3).map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-soft"
            >
              {kw}
            </span>
          ))}
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Leer guía <span aria-hidden>→</span>
        </p>
      </Link>
    </li>
  )
}
