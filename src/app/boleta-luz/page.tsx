import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import { Pill } from '@/components/ui/Pill'
import { CardLight } from '@/components/ui/Card'
import {
  breadcrumbsSchema,
  buildMetadata,
  faqPageSchema,
  webApplicationSchema,
} from '@/lib/seo'
import { RelatedGuias } from '@/components/guias/RelatedGuias'
import { UploadHub } from './_components/upload-hub'

export const metadata = buildMetadata({
  title: 'Boleta de luz',
  description:
    'Sube tu boleta de electricidad y revisa cobro a cobro. CGE, Enel, SAESA, Frontel y Chilquinta. Todo en tu propio celular.',
  path: '/boleta-luz',
  ogKind: 'tool',
  ogCategory: 'Luz',
  keywords: [
    'boleta de luz Chile',
    'revisar boleta CGE',
    'revisar boleta Enel',
    'cobros indebidos electricidad',
  ],
})

const DISTRIBUIDORAS = [
  { id: 'cge', label: 'CGE' },
  { id: 'enel', label: 'Enel' },
  { id: 'saesa', label: 'SAESA' },
  { id: 'frontel', label: 'Frontel' },
  { id: 'chilquinta', label: 'Chilquinta' },
] as const

const FLAGS = [
  {
    title: 'Cargo de reposición no habitual',
    body: 'Cuando aparece un cargo por reposición de servicio que no calza con un corte que tú recuerdes haber tenido.',
  },
  {
    title: 'Tramo mal aplicado',
    body: 'Te están cobrando a tarifa BT-2 cuando deberías estar en BT-1 (o viceversa). Pasa más seguido de lo que se cree.',
  },
  {
    title: 'Subida anómala vs histórico',
    body: 'Si tu consumo subió 30% o más sin que nada en tu casa cambiara, vale la pena mirar lectura y multiplicador.',
  },
  {
    title: 'Recargo por mora ya pagada',
    body: 'Intereses por una boleta atrasada que ya pagaste. Suele aparecer cuando el sistema no actualizó el pago a tiempo.',
  },
  {
    title: 'Lectura estimada vs real',
    body: 'Cuando la empresa estimó tu consumo en lugar de leer el medidor. La estimación puede ser optimista (para ellos).',
  },
] as const

const FAQ_ITEMS = [
  {
    q: '¿Mi boleta se sube a un servidor?',
    a: 'No. El PDF se procesa entero en este navegador. No tenemos backend, no tenemos base de datos, no podemos ver tu boleta aunque quisiéramos.',
  },
  {
    q: '¿Funciona si la boleta es una foto?',
    a: 'Sí. Analizamos PDFs nativos (los que descargas del sitio de tu empresa eléctrica) y también fotos JPG o PNG con OCR, el reconocimiento corre en tu propio navegador. Para fotos, una imagen nítida y derecha mejora muchísimo la precisión.',
  },
  {
    q: '¿Por qué no detectó mi distribuidora?',
    a: 'Algunas boletas tienen el logo en imagen y el resto es texto, pero el header puede venir distinto en boletas viejas. Si no detectamos, puedes elegirla a mano abajo.',
  },
  {
    q: '¿Qué hago si la lupa encuentra un problema?',
    a: 'Te mostramos qué línea de la boleta llamó la atención y por qué. Puedes generar un reclamo SERNAC con los antecedentes ya armados, o llamar a tu empresa eléctrica con los datos en mano.',
  },
  {
    q: '¿Es gratis?',
    a: 'Sí. Sin login, sin registro, sin paywall. Si la herramienta te ayuda, lo mejor que puedes hacer es pasársela a alguien más.',
  },
] as const

export default function BoletaLuzPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Revisor de boleta de luz',
            description:
              'Sube tu boleta de electricidad y la lupa la analiza línea por línea contra las tarifas SEC vigentes.',
            path: '/boleta-luz',
          }),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Boleta de luz', href: '/boleta-luz' },
          ]),
          faqPageSchema(FAQ_ITEMS),
        ]}
      />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Boleta de luz
          </p>
          <h1 className="mt-4 max-w-[18ch] text-[clamp(36px,6vw,72px)] font-medium leading-[1.05] tracking-tight text-ink">
            Revisa tu boleta de luz en segundos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body md:text-xl">
            Soportamos CGE, Enel, SAESA, Frontel y Chilquinta. Tu PDF o foto
            nunca sale de este celular.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <UploadHub />

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-soft">
              O elige tu distribuidora
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DISTRIBUIDORAS.map((d) => (
                <Link
                  key={d.id}
                  href={`/boleta-luz/${d.id}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  {d.label}
                  <span
                    aria-hidden
                    className="text-soft transition-colors group-hover:text-cream"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 md:py-24">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            ¿Qué detectamos?
          </p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(32px,4vw,48px)] font-medium leading-[1.1] tracking-tight text-ink">
            Las trampas que más se repiten en boletas reales.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLAGS.map((flag) => (
              <CardLight key={flag.title} className="flex h-full flex-col">
                <Pill variant="warning" className="self-start">
                  Flag
                </Pill>
                <CardLight.Title className="mt-4">{flag.title}</CardLight.Title>
                <CardLight.Body>{flag.body}</CardLight.Body>
              </CardLight>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream py-20 md:py-24">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Preguntas frecuentes
          </p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(32px,4vw,48px)] font-medium leading-[1.1] tracking-tight text-ink">
            Las dudas más razonables.
          </h2>

          <div className="mt-10 max-w-3xl border-t border-border">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group border-b border-border py-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium text-ink [&::-webkit-details-marker]:hidden md:text-lg">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-soft transition-transform group-open:rotate-180"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-body">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-xs text-soft">
            Herramienta referencial. Para reclamos formales: SERNAC, SEC, SISS.
          </p>
        </Container>
      </section>

      <RelatedGuias toolPath="/boleta-luz" />
    </main>
  )
}
