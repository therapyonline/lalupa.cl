'use client'

import { useState } from 'react'
import { Pill } from '@/components/ui/Pill'

export function ThumbsClient() {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  return (
    <div className="flex flex-col items-end gap-3">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        ¿Te sirvió esto?
      </p>
      {vote === null ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVote('up')}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
          >
            👍 Sí
          </button>
          <button
            type="button"
            onClick={() => setVote('down')}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
          >
            👎 No tanto
          </button>
        </div>
      ) : (
        <Pill variant={vote === 'up' ? 'success' : 'warning'}>
          {vote === 'up'
            ? 'Gracias por avisarnos.'
            : 'Anotado, lo iteramos.'}
        </Pill>
      )}
    </div>
  )
}
