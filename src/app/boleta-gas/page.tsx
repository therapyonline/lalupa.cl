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
import { UploadHubGas } from './_components/upload-hub'

export const metadata = buildMetadata({
  title: 'Boleta de gas',
  description:
    'Sube tu boleta de gas (red o cilindro) y revisa cobro a cobro. Metrogas, Lipigas, Abastible y Gasco GLP. Todo en tu propio celular.',
  path: '/boleta-gas',
  ogKind: 'tool',
  ogCategory: 'Gas',
  keywords: [
    'boleta de gas Chile',
    'precio cilindro gas',
    'tarifa Metrogas',
    'precio Lipigas Abastible',
  ],
})

const EMPRESAS_GAS = [
  { id: 'metrogas', label: 'Metrogas', tipo: 'Gas natural por red' },
  { id: 'lipigas', label: 'Lipigas', tipo: 'Gas por red' },
  { id: 'abastible', label: 'Abastible', tipo: 'Gas por red' },
  { id: 'gasco-glp', label: 'Gasco GLP', tipo: 'Cilindros GLP' },
] as const

const FLAGS = [
  {
    title: 'Recargo por delivery extraordinario',
    body: 'Cobro adicional por reparto que se cuela cuando la dirección está dentro de la zona regular de la empresa. En cilindros y en red.',
  },
  {
    title: 'Cobro por cambio de cilindro',
    body: 'En cilindros, a veces aparece un cargo por "cambio" o "manipulación" que no debería estar incluido si compraste un cilindro nuevo a precio publicado.',
  },
  {
    title: 'Diferencia con tarifa pública SEC',
    body: 'La SEC publica precios diariamente. Si la boleta tiene un valor por kilo o m³ muy distinto del rango publicado para tu región, es flag.',
  },
  {
    title: 'Cargo de seguridad domiciliaria duplicado',
    body: 'En boletas de gas natural por red, el cargo de seguridad domiciliaria a veces aparece dos veces. Una sola línea por boleta es lo correcto.',
  },
  {
    title: 'Subida anómala vs histórico',
    body: 'Si el consumo en m³ subió fuerte en gas red sin cambios en tu casa, puede ser una fuga o un error de lectura. Vale revisar antes de pagar.',
  },
] as const

const FAQ_ITEMS = [
  {
    q: '¿Mi boleta se sube a un servidor?',
    a: 'No. El PDF se procesa entero en este navegador. No tenemos backend para boletas, no las almacenamos.',
  },
  {
    q: '¿Funciona para cilindros y para gas por red?',
    a: 'Sí, con cobertura distinta. Para gas por red analizamos boletas de Metrogas, Lipigas y Abastible. Para cilindros GLP, hoy solo cubrimos Gasco GLP. Estamos trabajando en agregar Lipigas y Abastible cilindro pronto.',
  },
  {
    q: '¿De dónde saco una boleta de cilindro o gas por red en PDF?',
    a: 'Las empresas generan boleta digital cuando el pago es con tarjeta o débito automático. Si pagaste en efectivo y solo tienes papel, sácale una foto nítida (JPG o PNG) y súbela, corremos OCR en tu navegador para extraer los datos.',
  },
  {
    q: '¿Qué hago si la lupa encuentra un problema?',
    a: 'Te mostramos qué línea llamó la atención y por qué. Puedes generar un reclamo SERNAC con los antecedentes, o contactar a tu empresa con los datos en mano. Para gas red también puedes acudir a la SEC.',
  },
  {
    q: '¿Es gratis?',
    a: 'Sí. Sin login, sin registro, sin paywall.',
  },
] as const

export default function BoletaGasPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Revisor de boleta de gas',
            description:
              'Sube tu boleta de gas (red o cilindro) y la lupa la analiza contra los precios SEC vigentes.',
            path: '/boleta-gas',
          }),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Boleta de gas', href: '/boleta-gas' },
          ]),
          faqPageSchema(FAQ_ITEMS),
        ]}
      />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Boleta de gas
          </p>
          <h1 className="mt-4 max-w-[18ch] text-[clamp(36px,6vw,72px)] font-medium leading-[1.05] tracking-tight text-ink">
            Revisa tu boleta de gas en segundos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body md:text-xl">
            Cubrimos Metrogas, Lipigas y Abastible (gas por red), y Gasco GLP
            (cilindros). Tu PDF o foto nunca sale de este celular.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <UploadHubGas />

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-soft">
              O elige tu empresa de gas
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EMPRESAS_GAS.map((g) => (
                <Link
                  key={g.id}
                  href={`/boleta-gas/${g.id}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-ink bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  <span>{g.label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-soft transition-colors group-hover:text-cream/70">
                    {g.tipo}
                  </span>
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
            Las trampas más comunes en boletas de gas.
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
            Herramienta referencial. Para reclamos formales: SERNAC, SEC.
          </p>
        </Container>
      </section>

      <RelatedGuias toolPath="/boleta-gas" />
    </main>
  )
}
