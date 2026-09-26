import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbsSchema, buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Sobre lalupa',
  description:
    'Por qué existe lalupa.cl: una herramienta de defensa al consumidor chileno, gratuita, privada por diseño. Quiénes somos y cómo contribuir.',
  path: '/sobre',
  ogKind: 'guide',
  keywords: [
    'lalupa.cl quienes somos',
    'manifiesto lalupa',
    'defensa consumidor chile',
    'open source consumer defense',
  ],
})

const PROSE_LEGAL = 'mx-auto max-w-[65ch] text-[17px] leading-[1.65]'
const SECTION = 'mt-12'
const H2 = 'text-2xl font-medium tracking-tight text-ink md:text-3xl'
const P = 'mt-4 leading-[1.65] text-body'

export default function SobrePage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={breadcrumbsSchema([
          { name: 'Inicio', href: '/' },
          { name: 'Sobre', href: '/sobre' },
        ])}
      />

      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Sobre lalupa
          </p>
          <h1 className="mt-4 max-w-[22ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Defensa al consumidor sin letra chica.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            lalupa nació de la frustración de mirar una boleta de luz y no
            saber si te están cobrando lo justo. Ahora es una herramienta
            gratuita, privada por diseño, para ayudarte a leer los cargos y preparar preguntas a tu proveedor.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-16">
        <Container>
          <div className={PROSE_LEGAL}>
            <div id="manifiesto">
              <h2 className={H2}>Manifiesto</h2>
              <p className={P}>
                Las boletas de servicios básicos en Chile pueden ser difíciles de
                entender. Tarifas que cambian,
                cargos por reposición, recargos por mora ya pagada,
                refacturaciones retroactivas, lecturas estimadas que después
                “se ajustan”, todo dentro de un PDF de tres páginas que
                nadie lee.
              </p>
              <p className={P}>
                Mientras tanto, las empresas tienen abogados, sistemas y
                tiempo. El consumidor necesita entender el documento y conocer el canal
                y los requisitos que corresponden a su caso.
              </p>
              <p className={P}>
                <strong className="text-ink">
                  Eso es lo que lalupa intenta arreglar.
                </strong>{' '}
                Subes tu boleta, la procesamos en tu propio celular (nunca
                sale de tu dispositivo), te marcamos lo que merece atención,
                y te armamos la carta de reclamo SERNAC si quieres. Todo
                gratis y en tu idioma. Consulta nuestra política de privacidad
                para conocer las métricas opcionales del sitio.
              </p>
            </div>

            <div className={SECTION} id="por-que-gratis">
              <h2 className={H2}>Por qué es gratis</h2>
              <p className={P}>
                Porque cobrar le quitaría sentido al proyecto. La gente que
                más necesita revisar su boleta es la que menos puede pagar
                por una herramienta. Si fuera gratis solo en el “tier free”,
                la mitad de los usuarios chocarían contra un paywall en el
                peor momento.
              </p>
              <p className={P}>
                lalupa se sostiene por mantenimiento mínimo (un dominio,
                hosting en Vercel) y trabajo voluntario. No
                tenemos inversionistas que esperen retorno. Si algún día eso
                cambia, lo vamos a decir explícitamente acá.
              </p>
            </div>

            <div className={SECTION} id="quienes-somos">
              <h2 className={H2}>Quiénes somos</h2>
              <p className={P}>
                El contenido se publica bajo la firma colectiva Equipo lalupa. No tenemos relación con
                ninguna empresa de servicios básicos, ni con SERNAC, SEC,
                SISS o SUBTEL, somos independientes.
              </p>
              <p className={P}>
                Si quieres que apliquemos a un fondo de software cívico,
                contribuyas con código, o aportes con investigación de
                tarifas, escríbenos a{' '}
                <a
                  href="mailto:contacto@lalupa.cl"
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  contacto@lalupa.cl
                </a>
                .
              </p>
            </div>

            <div className={SECTION} id="criterio-editorial">
              <h2 className={H2}>Criterio editorial</h2>
              <p className={P}>
                Las guías son orientación general. La firma Equipo lalupa
                identifica al editor del sitio y no acredita una revisión
                jurídica individual ni el respaldo de un organismo público.
              </p>
              <p className={P}>
                Para comprobar un precio o un plazo, consulta la fuente oficial
                enlazada y verifica su fecha, zona y condiciones de aplicación.
                Los ejemplos de cálculo identificados como ilustrativos no son
                cotizaciones. Cada guía muestra su fecha de publicación y revisión;
                esa fecha no garantiza que todos sus datos sigan vigentes.
              </p>
              <p className={P}>
                Las correcciones sustantivas se describen al final de las guías
                revisadas. Si encuentras un error, envía la URL, el dato y su
                fuente desde <Link href="/contacto" className="underline underline-offset-4">contacto</Link>.
                Evita enviar boletas con datos personales sin ocultarlos.
              </p>
            </div>

            <div className={SECTION} id="contribuciones">
              <h2 className={H2}>Contribuciones</h2>
              <p className={P}>
                Las formas más útiles de aportar:
              </p>
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-6 marker:text-soft">
                <li className="leading-[1.65] text-body">
                  <strong className="text-ink">
                    Reportar boletas que rompen el parser.
                  </strong>{' '}
                  Cada reporte mejora la cobertura. Mandalo a{' '}
                  <a
                    href="mailto:bugs@lalupa.cl"
                    className="text-primary underline underline-offset-4 hover:no-underline"
                  >
                    bugs@lalupa.cl
                  </a>
                  .
                </li>
                <li className="leading-[1.65] text-body">
                  <strong className="text-ink">
                    Compartir lalupa con quien le sirva.
                  </strong>{' '}
                  Boca a boca es lo único que tenemos para llegar a la gente
                  que más lo necesita.
                </li>
                <li className="leading-[1.65] text-body">
                  <strong className="text-ink">
                    Sugerir guías y empresas a soportar
                  </strong>{' '}
                  desde nuestra{' '}
                  <Link
                    href="/contacto"
                    className="text-primary underline underline-offset-4 hover:no-underline"
                  >
                    página de contacto
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <div className={SECTION} id="lo-que-no-somos">
              <h2 className={H2}>Lo que NO somos</h2>
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-6 marker:text-soft">
                <li className="leading-[1.65] text-body">
                  Una empresa con fines de lucro.
                </li>
                <li className="leading-[1.65] text-body">
                  Un canal oficial de reclamo (eso es SERNAC, SEC, SISS,
                  SUBTEL, ver{' '}
                  <Link
                    href="/terminos"
                    className="text-primary underline underline-offset-4 hover:no-underline"
                  >
                    términos
                  </Link>
                  ).
                </li>
                <li className="leading-[1.65] text-body">
                  Asesoría legal o financiera.
                </li>
                <li className="leading-[1.65] text-body">
                  Un servicio de “recuperación de plata” o intermediación.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-24">
        <Container>
          <div className="mx-auto max-w-[65ch] rounded-[20px] border border-border bg-white p-6 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Listo para probar
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Sube tu primera boleta
            </h2>
            <p className="mt-4 max-w-prose text-body">
              Sin login. Revisa los datos extraídos y las alertas junto al
              documento original; la herramienta no certifica tu facturación.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="dark" size="lg">
                <Link href="/boleta-luz">Boleta de luz</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/como-funciona">Cómo funciona</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
