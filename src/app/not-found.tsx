import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description:
    'Esta página no existe o se movió. Vuelve al inicio o prueba una de nuestras herramientas para revisar tus boletas.',
  robots: { index: false, follow: false },
}

const HERRAMIENTAS = [
  {
    href: '/boleta-luz',
    title: 'Boleta de luz',
    description: 'CGE, Enel, SAESA, Frontel, Chilquinta.',
  },
  {
    href: '/boleta-agua',
    title: 'Boleta de agua',
    description: 'Aguas Andinas, Esval, ESSBio, Nuevosur, SMAPA.',
  },
  {
    href: '/boleta-gas',
    title: 'Boleta de gas',
    description: 'Metrogas, Lipigas, Abastible, Gasco GLP.',
  },
  {
    href: '/reclamar-sernac',
    title: 'Reclamo SERNAC',
    description: 'Wizard de 5 pasos → carta lista para enviar.',
  },
] as const

export default function NotFound() {
  return (
    <main className="flex-1">
      <section className="bg-cream py-16 md:py-24">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Error 404
          </p>
          <h1 className="mt-4 text-[clamp(96px,18vw,200px)] font-medium leading-none tracking-tight text-ink">
            404
          </h1>
          <p className="mt-6 max-w-2xl text-2xl font-medium leading-snug text-ink md:text-3xl">
            Esta página no existe. Pero estas sí:
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-16">
        <Container>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {HERRAMIENTAS.map(({ href, title, description }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-[20px] border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_8px_24px_rgba(34,34,34,0.06)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  <p className="text-xl font-medium text-ink group-hover:text-primary-deep md:text-2xl">
                    {title}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
                    {description}
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Abrir <span aria-hidden>→</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-cream pb-24">
        <Container>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="dark" size="lg">
              <Link href="/">Volver al inicio</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/guias">Ver las guías</Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
