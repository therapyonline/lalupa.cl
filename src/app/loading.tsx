import { Container } from '@/components/layout/Container'
import { LogoSpinner } from '@/components/ui/Skeleton'

// `<div>` en vez de `<main>`: durante streaming SSR esta loading aparece
// mientras la page real (que también tiene <main>) se hidrata, dejando
// momentáneamente 2 elementos `<main>` en el DOM. El landmark único
// queda en page.tsx; aquí basta con role="status".
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-cream py-20">
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
    </div>
  )
}
