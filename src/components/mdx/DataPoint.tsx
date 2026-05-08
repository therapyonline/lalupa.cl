export function DataPoint({
  value,
  label,
  source,
  sourceUrl,
}: {
  value: string
  label: string
  source?: string
  sourceUrl?: string
}) {
  return (
    <figure className="my-8 rounded-[20px] border border-border bg-cream-warm/30 px-6 py-7">
      <p className="font-mono text-4xl font-medium leading-none tracking-tight text-ink md:text-5xl">
        {value}
      </p>
      <figcaption className="mt-3 text-sm leading-relaxed text-body">
        {label}
      </figcaption>
      {source && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-soft">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink"
            >
              Fuente: {source}
            </a>
          ) : (
            <>Fuente: {source}</>
          )}
        </p>
      )}
    </figure>
  )
}
