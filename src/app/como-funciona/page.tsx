import Link from 'next/link'
import { Cpu, EyeOff, Lock, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbsSchema, buildMetadata, faqPageSchema } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Cómo funciona lalupa',
  description:
    'Lalupa parsea tu boleta 100% en tu navegador, sin uploads ni cuentas. Acá te explicamos cómo lo hacemos técnicamente y por qué tu información nunca sale de tu celular.',
  path: '/como-funciona',
  ogKind: 'guide',
  keywords: [
    'lalupa cl seguro',
    'cómo funciona lalupa',
    'parser boleta navegador',
    'privacidad boletas chile',
  ],
})

const PRINCIPLES: Array<{
  Icon: LucideIcon
  title: string
  description: string
}> = [
  {
    Icon: EyeOff,
    title: 'Sin uploads',
    description:
      'El PDF no se sube a ningún servidor. Lo abre tu navegador y lo procesa ahí mismo. Nuestro backend nunca lo ve.',
  },
  {
    Icon: ShieldCheck,
    title: 'Sin login, sin tracking',
    description:
      'No hay cuentas, no hay Google Analytics, no hay Pixel. Si vas a /tracker, ese histórico vive solo en este celular.',
  },
  {
    Icon: Lock,
    title: 'Tu histórico es local',
    description:
      'IndexedDB. Es la base de datos de tu navegador, no nuestra. Si borrás los datos del sitio, se borra todo.',
  },
  {
    Icon: Cpu,
    title: 'Open por diseño',
    description:
      'El parser se ejecuta como JavaScript que vos podés inspeccionar. Validamos contra tarifas SEC/SISS oficiales públicas.',
  },
]

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: '¿Lalupa sube mi boleta a la nube?',
    a: 'No. La boleta se procesa íntegramente en tu navegador. El servidor de lalupa solo entrega el código de la página al inicio, después de eso, el archivo PDF nunca se transmite a internet.',
  },
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No. Lalupa no tiene sistema de cuentas. Cuando guardás boletas en tu histórico, esos datos quedan en IndexedDB en tu propio dispositivo.',
  },
  {
    q: '¿Puedo usar lalupa sin conexión?',
    a: 'La primera vez necesitás conexión para cargar el sitio. Una vez cargado, el parser de PDF funciona offline porque corre en el navegador. Si subís una foto, la primera vez se descargan el motor de OCR y el modelo de español (todos desde lalupa.cl, sin terceros); después de eso también quedan en cache. El sitio no es PWA por ahora, eso quiere decir que si cerrás la pestaña, la próxima vez vas a necesitar conexión para reabrirlo.',
  },
  {
    q: '¿Qué tan precisas son las alertas?',
    a: 'Las alertas son referenciales. Comparamos tu boleta contra tarifas SEC/SISS publicadas y contra tu histórico local. Pueden equivocarse, el formato de boleta cambia y a veces las tarifas se actualizan después de una resolución oficial. Verificá siempre la boleta original antes de usar una alerta como base de un reclamo formal.',
  },
  {
    q: '¿Por qué confiar en una herramienta gratuita?',
    a: 'Buena pregunta. La razón es que no necesitamos tu información para que el negocio funcione: lalupa es un proyecto de defensa al consumidor, sin uploads y sin tracking. La forma de validar la promesa es abrir las DevTools del navegador y mirar la pestaña Network: vas a ver cero requests al backend cuando subís un PDF.',
  },
  {
    q: '¿Puedo exportar mi histórico?',
    a: 'Sí. Desde la pantalla de resultado podés exportar como JSON. Ese archivo podés moverlo a otro dispositivo y volver a importarlo, o guardarlo de respaldo.',
  },
  {
    q: '¿Qué hago si la herramienta se equivoca?',
    a: 'Mandanos un correo a bugs@lalupa.cl con la empresa, la fecha de la boleta y qué fue lo que falló. Mejoramos los parsers a partir de reportes reales (sin necesidad de que nos mandes la boleta, solo lo necesario para reproducir).',
  },
]

const STACK = [
  { label: 'Next.js 16 + React Server Components' },
  { label: 'TypeScript estricto' },
  { label: 'pdfjs-dist (parser de PDF en browser)' },
  { label: 'tesseract.js para OCR de fotos en browser' },
  { label: 'IndexedDB (idb) para histórico local' },
  { label: 'pdf-lib para generar la carta SERNAC' },
  { label: 'Tailwind v4 para estilos' },
  { label: 'Vercel para hosting estático' },
]

export default function ComoFuncionaPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          faqPageSchema(FAQS),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Cómo funciona', href: '/como-funciona' },
          ]),
        ]}
      />

      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Cómo funciona
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Tu boleta nunca sale de tu celular.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Lalupa fue construida bajo un principio simple: no almacenamos lo
            que no necesitamos, y no necesitamos casi nada. Esta página explica
            exactamente cómo lo hacemos, incluyendo cómo verificarlo vos
            mismo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="dark" size="lg">
              <Link href="/boleta-luz">Probar con mi boleta</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/privacidad">Ver política de privacidad</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PRINCIPLES.map(({ Icon, title, description }) => (
              <li
                key={title}
                className="flex gap-5 rounded-[20px] border border-border bg-white p-6 md:p-8"
              >
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-warm text-ink">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-ink">
                    {title}
                  </h2>
                  <p className="mt-2 text-body">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-cream pb-16">
        <Container>
          <div className="rounded-[20px] border border-border bg-white p-6 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Cómo verificarlo vos mismo
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Abrí las DevTools y mirá la pestaña Network
            </h2>
            <ol className="mt-5 list-decimal space-y-3 pl-6 text-body">
              <li>
                Andá a <Link href="/boleta-luz" className="font-medium text-primary underline underline-offset-4 hover:no-underline">/boleta-luz</Link> en tu navegador.
              </li>
              <li>
                Apretá <kbd className="rounded border border-border bg-cream-warm px-1.5 py-0.5 font-mono text-xs">F12</kbd>{' '}
                (o <kbd className="rounded border border-border bg-cream-warm px-1.5 py-0.5 font-mono text-xs">Cmd+Opt+I</kbd> en Mac) y andá a la pestaña Network.
              </li>
              <li>Limpiá el log y subí un PDF de prueba.</li>
              <li>
                Verificá: vas a ver requests para los chunks de JS, fonts y un par de cosas estáticas. <strong className="text-ink">No vas a ver ningún POST con tu PDF como payload.</strong>
              </li>
            </ol>
            <p className="mt-5 text-sm text-soft">
              Ese es el contrato: si alguna vez ves un request sospechoso saliendo a un servidor, mandanos un bug y lo arreglamos.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Stack técnico
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
            Lo que está abajo del capó
          </h2>
          <p className="mt-3 max-w-2xl text-body">
            Sin sorpresas: usamos herramientas estándar. El parser de PDF es{' '}
            <code className="font-mono text-sm">pdfjs-dist</code> (la versión
            web del lector de PDFs de Mozilla), corriendo en tu navegador.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {STACK.map((s) => (
              <li key={s.label}>
                <Pill variant="info" className="font-mono text-[11px]">
                  {s.label}
                </Pill>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-cream py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
            Lo que más nos preguntan
          </h2>
          <div className="mt-8 space-y-2">
            {FAQS.map((qa) => (
              <details
                key={qa.q}
                className="group border-b border-border py-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium text-ink [&::-webkit-details-marker]:hidden md:text-lg">
                  <span>{qa.q}</span>
                  <span
                    className="ml-4 text-soft transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-body">
                  {qa.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-24">
        <Container>
          <div className="rounded-[20px] border border-border bg-white p-6 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Lista para empezar
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Subí tu primera boleta
            </h2>
            <p className="mt-3 max-w-2xl text-body">
              Si llegaste hasta acá, ya sabés cómo funciona. La forma más rápida
              de probarlo es con una boleta tuya.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="dark" size="lg">
                <Link href="/boleta-luz">Boleta de luz</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/boleta-agua">Boleta de agua</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/boleta-gas">Boleta de gas</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
