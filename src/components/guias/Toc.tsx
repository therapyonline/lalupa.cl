import { cn } from '@/lib/utils'

export interface TocItem {
  level: 2 | 3
  text: string
  slug: string
}

export function Toc({
  entries,
  title = 'En esta guía',
  className,
}: {
  entries: TocItem[]
  title?: string
  className?: string
}) {
  if (entries.length === 0) return null
  return (
    <nav
      aria-label="Tabla de contenidos"
      className={cn(
        'rounded-[16px] border border-border bg-white p-5',
        className,
      )}
    >
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        {title}
      </p>
      <ol className="mt-4 flex flex-col gap-2 text-sm">
        {entries.map((e) => (
          <li key={e.slug} className={e.level === 3 ? 'pl-4' : undefined}>
            <a
              href={`#${e.slug}`}
              className="text-body hover:text-ink"
            >
              {e.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
