import { Container } from '@/components/layout/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p
            role="status"
            aria-live="polite"
            className="font-mono text-xs uppercase tracking-[0.1em] text-soft"
          >
            Procesando tu boleta de luz…
          </p>
          <Skeleton className="mt-4 h-14 w-full max-w-[24ch] md:h-20" />
          <Skeleton className="mt-6 h-5 w-2/3 max-w-xl" />
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <div className="rounded-[20px] border border-border bg-white p-6 md:p-10">
            <Skeleton className="h-6 w-40" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-20 rounded-[16px]" />
              <Skeleton className="h-20 rounded-[16px]" />
              <Skeleton className="h-20 rounded-[16px]" />
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
