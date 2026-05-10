import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbsSchema, buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contacto',
  description:
    'Cómo contactar al equipo de lalupa: sugerir distribuidora, reportar bug, prensa, partnership. Solo email, sin formulario, sin almacenar datos.',
  path: '/contacto',
  ogKind: 'guide',
})

const CANALES = [
  {
    eyebrow: 'Sugerencias y reportes',
    title: 'Sugerir distribuidora o algo en general',
    body: '¿Una empresa que quieres que soportemos? ¿Una guía que falta? ¿Algo que mejorar?',
    email: 'contacto@lalupa.cl',
    subject: 'Sugerencia / feedback lalupa',
  },
  {
    eyebrow: 'Bugs',
    title: 'El parser falló o algo se rompió',
    body: 'Cuéntanos qué empresa, qué pasó, y si puedes suma una captura sin datos personales.',
    email: 'bugs@lalupa.cl',
    subject: 'Bug en lalupa',
  },
  {
    eyebrow: 'Prensa',
    title: 'Medios y prensa',
    body: 'Solicitudes de información, entrevistas o material para artículos.',
    email: 'prensa@lalupa.cl',
    subject: 'Prensa, solicitud sobre lalupa',
  },
  {
    eyebrow: 'Partnership',
    title: 'Colaboraciones y partnerships',
    body: 'Fondos de software cívico, contribuciones de código, investigación de tarifas.',
    email: 'contacto@lalupa.cl',
    subject: 'Partnership / colaboración con lalupa',
  },
] as const

function mailto(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}

export default function ContactoPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={breadcrumbsSchema([
          { name: 'Inicio', href: '/' },
          { name: 'Contacto', href: '/contacto' },
        ])}
      />

      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Contacto
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Si algo no calza, escríbenos.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.65] text-body">
            Sin formulario, sin almacenamiento de datos. Solo email, tú
            controlas qué compartes y nosotros mantenemos la promesa
            privacy-first hasta el final del flujo.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-16">
        <Container>
          <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
            {CANALES.map(({ eyebrow, title, body, email, subject }) => (
              <li key={email + subject}>
                <a
                  href={mailto(email, subject)}
                  className="group flex h-full flex-col rounded-[20px] border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_8px_24px_rgba(34,34,34,0.06)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 md:p-8"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
                    {eyebrow}
                  </p>
                  <h2 className="mt-3 text-xl font-medium tracking-tight text-ink md:text-2xl">
                    {title}
                  </h2>
                  <p className="mt-3 flex-1 text-[15px] leading-[1.6] text-body">
                    {body}
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 font-mono text-sm font-medium text-primary group-hover:text-primary-deep">
                    {email} <span aria-hidden>→</span>
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-cream pb-24">
        <Container>
          <div className="mx-auto max-w-[65ch] rounded-[20px] border border-border bg-white p-6 text-[17px] leading-[1.65] md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Reclamos formales
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              No somos canal oficial de reclamos
            </h2>
            <p className="mt-4 text-body">
              Si tu reclamo es contra una empresa de servicios básicos, las
              vías formales con poder regulatorio son SERNAC, SEC, SISS y
              SUBTEL, no nosotros. Puedes generar tu carta SERNAC en{' '}
              <Link
                href="/reclamar-sernac"
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                /reclamar-sernac
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>
    </main>
  )
}
