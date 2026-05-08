import { Container } from '@/components/layout/Container'
import { LogoSpinner } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream py-20">
      <Container>
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-6 text-center"
        >
          <LogoSpinner />
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Cargando…
          </p>
        </div>
      </Container>
    </main>
  )
}
