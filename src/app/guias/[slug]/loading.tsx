import { Container } from '@/components/layout/Container'
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-12 w-full max-w-3xl md:h-16" />
          <Skeleton className="mt-6 h-5 w-2/3 max-w-2xl" />
          <div className="mt-8 flex gap-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-9/12" />
              <div className="h-4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
            <aside className="hidden lg:block">
              <div className="rounded-[16px] border border-border bg-white p-5">
                <Skeleton className="h-3 w-24" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  )
}
