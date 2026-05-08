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
import { UploadHubAgua } from './_components/upload-hub'

export const metadata = buildMetadata({
  title: 'Boleta de agua',
  description:
    'Sube tu boleta de agua y revisa cobro a cobro. Aguas Andinas, Esval, ESSBio, Nuevosur y SMAPA. Todo en tu propio celular.',
  path: '/boleta-agua',
  ogKind: 'tool',
  ogCategory: 'Agua',
  keywords: [
    'boleta de agua Chile',
    'revisar boleta Aguas Andinas',
    'cobros indebidos agua',
    'tarifa SISS',
  ],
})

const SANITARIAS = [
  { id: 'aguas-andinas', label: 'Aguas Andinas' },
  { id: 'esval', label: 'Esval' },
  { id: 'essbio', label: 'ESSBio' },
  { id: 'nuevosur', label: 'Nuevosur' },
  { id: 'smapa', label: 'SMAPA' },
] as const

const FLAGS = [
  {
    title: 'Reposición de servicio sin corte previo',
    body: 'Cobro por reposición que no calza con un corte que tú recuerdes. Igual que en luz, suele aparecer cuando la empresa registró un corte que no fue.',
  },
  {
    title: 'Lectura presunta repetida',
    body: 'Cuando la sanitaria estima tu consumo en lugar de leer el medidor, mes tras mes. La estimación tiende a inflar y no siempre se reajusta.',
  },
  {
    title: 'Cargo fijo duplicado',
    body: 'A veces el cargo fijo aparece dos veces en la misma boleta. Se cuela en errores de facturación cuando hay cambios de tramo o reliquidación.',
  },
  {
    title: 'Recolección de aguas servidas mal aplicada',
    body: 'Si tu inmueble no está conectado a alcantarillado público, el cargo no debería aparecer. Pasa especialmente en zonas semi-rurales o nuevas urbanizaciones.',
  },
  {
    title: 'Subida anómala vs histórico',
    body: 'Si el consumo subió fuerte sin que cambiara nada en tu casa, puede ser una fuga interna o un error de lectura. Vale revisar antes de pagar.',
  },
] as const

const FAQ_ITEMS = [
  {
    q: '¿Mi boleta se sube a un servidor?',
    a: 'No. El PDF se procesa entero en este navegador. No tenemos backend para boletas, no las almacenamos, no las podemos ver.',
  },
  {
    q: '¿Funciona si la boleta es una foto?',
    a: 'Sí. Analizamos PDFs nativos y también fotos JPG o PNG con OCR — el reconocimiento corre en tu propio navegador, no se sube nada. Una imagen nítida y derecha mejora la precisión.',
  },
  {
    q: '¿Las tarifas de agua son distintas en cada región?',
    a: 'Sí. Cada sanitaria tiene su propia fórmula tarifaria aprobada por SISS, con tramos de consumo y temporadas (verano vs invierno). La lupa compara contra las tarifas vigentes de tu sanitaria específica.',
  },
  {
    q: '¿Qué hago si la lupa encuentra un problema?',
    a: 'Te mostramos qué línea llamó la atención y por qué. Podés generar un reclamo SERNAC con los antecedentes, o llamar a tu sanitaria con los datos en mano. SISS también recibe reclamos formales cuando la mediación no avanza.',
  },
  {
    q: '¿Es gratis?',
    a: 'Sí. Sin login, sin registro, sin paywall.',
  },
] as const

export default function BoletaAguaPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Revisor de boleta de agua',
            description:
              'Sube tu boleta de agua y la lupa la analiza contra las tarifas SISS vigentes de tu sanitaria.',
            path: '/boleta-agua',
          }),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Boleta de agua', href: '/boleta-agua' },
          ]),
          faqPageSchema(FAQ_ITEMS),
        ]}
      />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Boleta de agua
          </p>
          <h1 className="mt-4 max-w-[18ch] text-[clamp(36px,6vw,72px)] font-medium leading-[1.05] tracking-tight text-ink">
            Revisa tu boleta de agua en segundos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body md:text-xl">
            Soportamos Aguas Andinas, Esval, ESSBio, Nuevosur y SMAPA. Tu PDF
            o foto nunca sale de este celular.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <UploadHubAgua />

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-soft">
              O elegí tu sanitaria
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SANITARIAS.map((s) => (
                <Link
                  key={s.id}
                  href={`/boleta-agua/${s.id}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  {s.label}
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
            Las trampas que más se repiten en boletas de agua.
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
            Herramienta referencial. Para reclamos formales: SERNAC, SISS.
          </p>
        </Container>
      </section>

      <RelatedGuias toolPath="/boleta-agua" />
    </main>
  )
}
