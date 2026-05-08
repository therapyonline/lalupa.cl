'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[lalupa] error boundary:', error)
    }
  }, [error])

  return (
    <main className="flex-1">
      <section className="bg-cream py-20 md:py-28">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Error inesperado
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Algo se rompió. No es tu culpa.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Tuvimos un error inesperado al renderizar esta página. Tu boleta y
            tu histórico siguen seguros, nada salió de tu dispositivo.
            Intentá recargar.
          </p>
          {error.digest && (
            <p className="mt-4 font-mono text-xs text-soft">
              ref: {error.digest}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="dark" size="lg" onClick={reset}>
              Reintentar
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
