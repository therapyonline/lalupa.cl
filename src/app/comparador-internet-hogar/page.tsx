import { JsonLd } from '@/components/JsonLd'
import Link from 'next/link'
import { connection } from 'next/server'
import { Container } from '@/components/layout/Container'
import { FaqAccordion } from '@/components/guias/FaqAccordion'
import {
  INTERNET_FAQS,
  INTERNET_REVISION,
  PLANES_INTERNET,
  PROVEEDORES_INTERNET,
} from '@/data/internet-planes'
import { fechaSantiago } from '@/lib/internet/comparacion'
import {
  breadcrumbsSchema,
  buildMetadata,
  faqPageSchema,
  webApplicationSchema,
} from '@/lib/seo'
import { Comparador } from './_components/comparador'

export const metadata = buildMetadata({
  title: 'Compara internet hogar: precios y condiciones en Chile',
  description:
    'Compara precios de internet hogar, promociones e instalación a 12 o 24 meses. Fuentes con fecha de revisión y enlaces para consultar cobertura.',
  path: '/comparador-internet-hogar',
  ogKind: 'tool',
  ogCategory: 'Internet',
  keywords: [
    'comparador internet hogar Chile',
    'mejor plan internet 2026',
    'fibra óptica Chile precio',
    'comparar Movistar Entel WOM',
  ],
})

export default async function ComparadorInternetPage() {
  // Evalúa el cierre con la fecha de la visita, no con la del build.
  await connection()
  const hoy = fechaSantiago(new Date())
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Comparador internet hogar',
            description:
              'Compara una selección de planes con fuentes y fechas de revisión. Proyecta mensualidades e instalación a 12 o 24 meses.',
            path: '/comparador-internet-hogar',
          }),
          faqPageSchema(INTERNET_FAQS),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            {
              name: 'Comparador internet',
              href: '/comparador-internet-hogar',
            },
          ]),
        ]}
      />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-wide text-body">
            Internet hogar · Chile
          </p>
          <h1 className="mt-4 max-w-[23ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Compara internet hogar con los costos a la vista
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Revisa cuánto cambia el precio después de una promoción y cuánto
            sumarían las mensualidades y la instalación. Elige un período de 12
            o 24 meses para comparar con el mismo criterio.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-body">
            Selección editorial revisada el{' '}
            <time dateTime={INTERNET_REVISION}>26 de septiembre de 2026</time>.
            No cubre todos los planes del mercado ni confirma disponibilidad en
            tu domicilio. Cada precio enlaza a su fuente; confirma la cotización
            antes de contratar.
          </p>
          <nav
            aria-label="En esta comparación"
            className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-ink"
          >
            <a
              className="rounded-full border border-border bg-white px-4 py-3 underline"
              href="#planes"
            >
              Comparar precios
            </a>
            <a
              className="rounded-full border border-border bg-white px-4 py-3 underline"
              href="#como-comparamos"
            >
              Cómo calculamos
            </a>
            <a
              className="rounded-full border border-border bg-white px-4 py-3 underline"
              href="#proveedores"
            >
              Consultar cobertura
            </a>
          </nav>
          <noscript>
            <p className="mt-5 text-sm text-body">
              Puedes leer los precios y consultar las fuentes sin JavaScript.
              Para cambiar los filtros o el período de comparación, actívalo en
              tu navegador.
            </p>
          </noscript>
        </Container>
      </section>
      <Comparador planes={PLANES_INTERNET} fechaServidor={hoy} />
      <section id="como-comparamos" className="scroll-mt-24 bg-white py-14">
        <Container className="max-w-3xl">
          <h2 className="text-3xl font-medium tracking-tight text-ink">
            Cómo comparar el costo de un plan
          </h2>
          <ol className="mt-6 list-decimal space-y-4 pl-5 text-body">
            <li>
              <strong>Confirma la dirección.</strong> La presencia de una
              empresa en una comuna no acredita factibilidad en tu casa o
              edificio.
            </li>
            <li>
              <strong>Compara el mismo período.</strong> Multiplicamos cada
              mensualidad por los meses que corresponden a su tramo y sumamos la
              instalación publicada.
            </li>
            <li>
              <strong>Revisa lo que queda fuera.</strong> La proyección mantiene
              los importes observados: no anticipa IPC ni otros reajustes,
              equipos opcionales o cargos por término. Pregunta también por
              prorrateos en la primera boleta.
            </li>
            <li>
              <strong>Comprueba el servicio.</strong> Bajada, subida, WiFi y
              velocidad mínima garantizada son datos distintos. La velocidad
              anunciada no es una medición en tu hogar.
            </li>
          </ol>
          <p className="mt-6 text-body">
            No asignamos puntajes de calidad ni declaramos un ganador del
            mercado. Cuando falta un importe no lo reemplazamos por cero; cuando
            vence una campaña o su revisión editorial, retiramos ese precio de
            la comparación.
          </p>
          <p className="mt-4 text-body">
            Puedes revisar la{' '}
            <Link
              className="font-medium text-ink underline"
              href="/guias/fibra-vs-cable-internet-chile"
            >
              diferencia entre fibra FTTH y cable HFC
            </Link>{' '}
            o preparar los antecedentes de un{' '}
            <Link
              className="font-medium text-ink underline"
              href="/guias/reclamar-subtel-internet-paso-a-paso"
            >
              reclamo por internet ante SUBTEL
            </Link>
            .
          </p>
        </Container>
      </section>
      <section id="proveedores" className="scroll-mt-24 bg-cream py-14">
        <Container className="max-w-3xl">
          <h2 className="text-3xl font-medium tracking-tight text-ink">
            Consulta cobertura y otras ofertas
          </h2>
          <p className="mt-4 text-body">
            Estos enlaces llevan a las empresas. Entel, Claro y VTR no tienen
            precios incorporados en esta selección: no se obtuvo información
            suficiente y consistente para compararlos. Puedes consultar sus
            ofertas directamente.
          </p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {PROVEEDORES_INTERNET.map((p) => (
              <li key={p.nombre}>
                <a
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-5 py-3 font-medium text-ink underline"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.nombre}
                  <span className="sr-only">: consultar en otra pestaña</span>
                </a>
              </li>
            ))}
          </ul>
          <FaqAccordion faqs={[...INTERNET_FAQS]} />
        </Container>
      </section>
    </main>
  )
}
