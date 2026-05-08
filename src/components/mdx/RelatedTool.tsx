import Link from 'next/link'
import { TOOL_LABELS } from '@/lib/guias'

export function RelatedTool({
  href,
  label,
  description,
}: {
  href: string
  label?: string
  description?: string
}) {
  const resolvedLabel = label ?? TOOL_LABELS[href] ?? href
  return (
    <Link
      href={href}
      className="group my-6 flex items-start justify-between gap-4 rounded-[16px] border border-border bg-white px-5 py-4 transition-colors hover:border-ink"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          Herramienta relacionada
        </p>
        <p className="mt-2 text-lg font-medium leading-tight text-ink">
          {resolvedLabel}
        </p>
        {description && (
          <p className="mt-1 text-sm text-body">{description}</p>
        )}
      </div>
      <span
        aria-hidden
        className="text-soft transition-colors group-hover:text-ink"
      >
        →
      </span>
    </Link>
  )
}
