import { Container } from '@/components/layout/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-14 w-full max-w-2xl md:h-20" />
          <Skeleton className="mt-6 h-5 w-3/4 max-w-2xl" />
          <div className="mt-8 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="rounded-[20px] border border-border bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="mt-5 h-7 w-11/12" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-10/12" />
                <Skeleton className="mt-5 h-4 w-24" />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  )
}
