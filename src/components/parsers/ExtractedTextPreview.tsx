'use client'

import { useState } from 'react'

const PREVIEW_CHARS = 600

export function ExtractedTextPreview({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  if (!text.trim()) return null

  const truncated = text.length > PREVIEW_CHARS
  const visible = truncated ? text.slice(0, PREVIEW_CHARS) : text

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard puede fallar en contextos sin permisos, no es crítico.
    }
  }

  return (
    <details className={className}>
      <summary className="cursor-pointer text-sm font-medium text-ink hover:text-primary">
        Ver el texto que extrajimos
      </summary>
      <div className="mt-3 rounded-md border border-border bg-cream-warm/30 p-4">
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
          {visible}
          {truncated && (
            <span className="text-soft">
              {`\n…[+${text.length - PREVIEW_CHARS} caracteres más]`}
            </span>
          )}
        </pre>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-ink bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-cream-warm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            {copied ? 'Copiado ✓' : 'Copiar texto'}
          </button>
          <span className="text-xs text-soft">
            Útil si quieres reportar el caso a bugs@lalupa.cl
          </span>
        </div>
      </div>
    </details>
  )
}
