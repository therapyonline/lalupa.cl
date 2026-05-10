import Link from 'next/link'
import { Cpu, FileCheck, Upload, type LucideIcon } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Pill } from '@/components/ui/Pill'
import { Button } from '@/components/ui/Button'
import { CardGlass, CardLight } from '@/components/ui/Card'
import { INDICADORES_HOME } from '@/data/indicadores'
import { getAllGuias, type CategoriaGuia } from '@/lib/guias'

const CATEGORY_LABEL: Record<CategoriaGuia, string> = {
  luz: 'Luz',
  agua: 'Agua',
  gas: 'Gas',
  derechos: 'Derechos',
  internet: 'Internet',
}

const TOOLS = [
  {
    href: '/boleta-luz',
    badge: { label: 'Más usada', variant: 'accent' as const },
    title: 'Revisa tu boleta de luz',
    description:
      'CGE, Enel, SAESA, Frontel, Chilquinta. Detecta tramos mal aplicados, cargos no habituales y subidas anómalas.',
  },
  {
    href: '/boleta-agua',
    badge: null,
    title: 'Revisa tu boleta de agua',
    description:
      'Aguas Andinas, Esval, ESSBio, Nuevosur. Compara consumo histórico y detecta cargos sospechosos.',
  },
  {
    href: '/boleta-gas',
    badge: null,
    title: 'Revisa tu boleta de gas',
    description:
      'Metrogas, Lipigas, Abastible, Gasco. Cilindro o red, detectamos recargos y diferencias contra precios SEC.',
  },
  {
    href: '/reclamar-sernac',
    badge: null,
    title: 'Genera tu reclamo SERNAC',
    description:
      'Wizard de 5 preguntas → carta legal lista para enviar. Plantillas validadas según el tipo de empresa.',
  },
  {
    href: '/subsidio-electrico',
    badge: { label: 'Gratis', variant: 'success' as const },
    title: '¿Calificas al subsidio eléctrico?',
    description:
      '13 preguntas → te decimos si calificas y cómo postular. Subsidio vigente 2026.',
  },
  {
    href: '/comparador-internet-hogar',
    badge: null,
    title: 'Comparador de planes de internet',
    description:
      'WOM, Movistar, Entel, Claro, VTR, Mundo, GTD. Filtros por velocidad, presupuesto y comuna.',
  },
] as const

const STEPS: Array<{
  number: string
  Icon: LucideIcon
  title: string
  description: string
}> = [
  {
    number: '01',
    Icon: Upload,
    title: 'Sube tu boleta',
    description:
      'PDF o foto desde tu celular. Soportamos las principales empresas chilenas. Ningún archivo sale de tu dispositivo.',
  },
  {
    number: '02',
    Icon: Cpu,
    title: 'Procesamos en tu navegador',
    description:
      'Analizamos cada cargo en segundos, comparamos con tu histórico y validamos contra tarifas SEC/SISS oficiales vigentes.',
  },
  {
    number: '03',
    Icon: FileCheck,
    title: 'Recibes tu informe',
    description:
      'Detalle de cada línea, alertas en lo que merece tu atención, y un botón para generar el reclamo SERNAC si corresponde.',
  },
]

export default async function HomePage() {
  const guias = (await getAllGuias()).slice(0, 3)
  return (
    <main className="flex-1">
      <section className="relative bg-cream py-15 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255, 107, 53, 0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <Container className="relative z-10">
          <Pill variant="accent" className="font-mono uppercase">
            Para los que revisan antes de pagar
          </Pill>

          <h1 className="mt-8 text-[clamp(48px,8vw,96px)] font-medium leading-none tracking-tight text-ink [&_em]:not-italic [&_em]:text-primary">
            Lo que esconden bajo la <em>letra chica</em>, en segundos.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-body md:text-xl">
            Sube el PDF o sácale una foto. La lupa la procesa en tu propio
            celular (nunca sale de tu dispositivo) y te dice si te están
            cobrando lo justo.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button variant="dark" size="lg" asChild>
              <Link href="/boleta-luz">Revisar mi boleta</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="#herramientas">Ver herramientas</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section
        id="herramientas"
        className="scroll-mt-20 bg-cream py-20 md:py-32"
      >
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            01 · Herramientas
          </p>
          <h2 className="mt-4 max-w-[18ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Seis herramientas para el bolsillo chileno.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="block h-full rounded-[20px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <CardLight className="flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_8px_24px_rgba(34,34,34,0.06)]">
                  {tool.badge && (
                    <Pill
                      variant={tool.badge.variant}
                      className="self-start uppercase"
                    >
                      {tool.badge.label}
                    </Pill>
                  )}
                  <CardLight.Title
                    className={tool.badge ? 'mt-4' : undefined}
                  >
                    {tool.title}
                  </CardLight.Title>
                  <CardLight.Body>{tool.description}</CardLight.Body>
                </CardLight>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 md:py-32">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            02 · Cómo funciona
          </p>
          <h2 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Tres pasos. Sin trampa, sin registro.
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-10">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col">
                <step.Icon
                  aria-hidden
                  strokeWidth={1.5}
                  className="h-6 w-6 text-soft"
                />
                <p className="mt-4 text-[96px] font-medium leading-none tracking-tight text-primary">
                  {step.number}
                </p>
                <h3 className="mt-6 text-2xl font-medium leading-snug tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed text-body">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream py-20 md:py-28">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
                03 · Guías
              </p>
              <h2 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
                Para entender, no solo revisar.
              </h2>
            </div>
            <Link
              href="/guias"
              className="hidden text-sm font-medium text-primary hover:underline md:inline"
            >
              Ver todas las guías →
            </Link>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {guias.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="group flex h-full flex-col rounded-[20px] border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_8px_24px_rgba(34,34,34,0.06)]"
                >
                  <div className="flex items-center justify-between">
                    <Pill variant="info">{CATEGORY_LABEL[g.category]}</Pill>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-soft">
                      {g.readingTime}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-medium leading-tight tracking-tight text-ink group-hover:text-primary-deep">
                    {g.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-body">
                    {g.description}
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Leer guía <span aria-hidden>→</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex md:hidden">
            <Button asChild variant="ghost" size="md">
              <Link href="/guias">Ver todas las guías</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-2 py-20 md:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none overflow-hidden p-8 font-mono text-2xl leading-[2.5em] text-white/10 [word-spacing:1.5em]"
        >
          {'+ '.repeat(800)}
        </div>

        <Container className="relative z-10">
          <p className="text-center font-mono text-xs uppercase tracking-[0.1em] text-cream/70">
            04 · En cifras
          </p>
          <h2 className="mt-4 text-center text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-cream [&_em]:not-italic [&_em]:text-accent">
            Tus cuentas, sin <em>letra chica</em>.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-cream/75 md:text-xl">
            Privacidad, velocidad y transparencia. Tres cosas que no se
            negocian.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <CardGlass key={stat.label}>
                <CardGlass.Number>{stat.number}</CardGlass.Number>
                <CardGlass.Label>{stat.label}</CardGlass.Label>
              </CardGlass>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button variant="light" size="lg" asChild>
              <Link href="/boleta-luz">Empezar ahora</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-cream-warm py-20">
        <Container>
          <h3 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Chile, en cifras
          </h3>
          <p className="mt-3 max-w-xl text-body">
            Datos públicos vigentes para que sepas dónde estás parado.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {INDICADORES_HOME.map((ind) => (
              <div key={ind.id} className="flex flex-col">
                <p className="font-mono text-3xl leading-tight tracking-tight text-ink md:text-4xl">
                  {ind.cifra}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-body">
                  {ind.caption}
                </p>
                {ind.external ? (
                  <a
                    href={ind.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-deep"
                  >
                    {ind.linkLabel}{' '}
                    <span aria-hidden>→</span>
                  </a>
                ) : (
                  <Link
                    href={ind.href}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-deep"
                  >
                    {ind.linkLabel}{' '}
                    <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  )
}

const STATS = [
  {
    number: (
      <>
        <em>14</em> empresas
      </>
    ),
    label: '5 luz · 5 agua · 4 gas, chequeadas contra tarifas SEC y SISS',
  },
  {
    number: (
      <>
        <em>0kb</em> de tu boleta
      </>
    ),
    label: 'sale del navegador. nunca.',
  },
  {
    number: (
      <>
        <em>0</em> cookies
      </>
    ),
    label: 'cero login, cero paywall, cero pixel de tracking',
  },
  {
    number: (
      <>
        <em>100%</em> open
      </>
    ),
    label: 'parser, OCR y carta SERNAC corren en tu navegador',
  },
]
