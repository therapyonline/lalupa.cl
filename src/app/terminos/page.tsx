import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbsSchema, buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Términos de uso',
  description:
    'Términos de uso de lalupa: herramienta referencial sin asesoría legal, parser que puede tener errores, vías formales para reclamos (SERNAC, SEC, SISS, SUBTEL).',
  path: '/terminos',
  ogKind: 'guide',
})

const ULTIMA_ACTUALIZACION = '12 de mayo de 2026'

const PROSE_LEGAL = 'mx-auto max-w-[65ch] text-[17px] leading-[1.65]'
const SECTION = 'mt-12'
const H2 = 'text-2xl font-medium tracking-tight text-ink md:text-3xl'
const P = 'mt-4 leading-[1.65] text-body'
const UL = 'mt-4 flex flex-col gap-2 list-disc pl-6 marker:text-soft'
const LI = 'leading-[1.65] text-body'

export default function TerminosPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={breadcrumbsSchema([
          { name: 'Inicio', href: '/' },
          { name: 'Términos', href: '/terminos' },
        ])}
      />

      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Términos de uso
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Para qué sirve y para qué no.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            lalupa es una herramienta referencial para revisar boletas de
            servicios básicos. No reemplaza ni a un abogado, ni a SERNAC, ni
            a las superintendencias. Esta página deja claro el alcance.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Última actualización: {ULTIMA_ACTUALIZACION}
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-24">
        <Container>
          <div className={PROSE_LEGAL}>
            <div className={SECTION} id="que-es-lalupa">
              <h2 className={H2}>1. Qué es lalupa</h2>
              <p className={P}>
                lalupa es una herramienta web gratuita que parsea boletas de
                servicios básicos (electricidad, agua, gas, internet) en tu
                navegador, identifica componentes de la boleta, y resalta
                cargos que merecen atención. También provee guías editoriales
                y un generador de carta de reclamo SERNAC.
              </p>
            </div>

            <div className={SECTION} id="referencial">
              <h2 className={H2}>2. Esto es referencial, no asesoría legal</h2>
              <p className={P}>
                Los análisis, alertas y plantillas de reclamo que produce
                lalupa son{' '}
                <strong className="text-ink">referenciales</strong>. No
                constituyen asesoría legal, financiera ni regulatoria. Si tu
                caso es complejo o de monto alto, consultá con un abogado o
                con la superintendencia que corresponda.
              </p>
              <p className={P}>
                Para reclamos formales con poder regulatorio, las vías
                oficiales son:
              </p>
              <ul className={UL}>
                <li className={LI}>
                  <strong className="text-ink">SERNAC</strong> — Servicio
                  Nacional del Consumidor (cualquier servicio).
                </li>
                <li className={LI}>
                  <strong className="text-ink">SEC</strong> —
                  Superintendencia de Electricidad y Combustibles (luz y gas).
                </li>
                <li className={LI}>
                  <strong className="text-ink">SISS</strong> —
                  Superintendencia de Servicios Sanitarios (agua).
                </li>
                <li className={LI}>
                  <strong className="text-ink">SUBTEL</strong> — Subsecretaría
                  de Telecomunicaciones (internet, telefonía).
                </li>
              </ul>
            </div>

            <div className={SECTION} id="precision">
              <h2 className={H2}>3. No garantizamos precisión 100%</h2>
              <p className={P}>
                Las distribuidoras chilenas cambian el formato de sus boletas
                sin aviso. Un cargo que el parser marca como sospechoso puede
                ser correcto, y uno que pasa sin alertas puede tener un
                error. Las tarifas SEC/SISS que usamos para validar pueden
                quedar desactualizadas frente a un decreto reciente.
              </p>
              <p className={P}>
                Antes de usar cualquier alerta de lalupa como base de un
                reclamo formal,{' '}
                <strong className="text-ink">
                  verificá la boleta original
                </strong>{' '}
                contra los valores publicados por SEC/SISS o por la propia
                empresa. lalupa es un primer filtro para detectar cosas
                raras, no la palabra final.
              </p>
            </div>

            <div className={SECTION} id="parser-puede-equivocarse">
              <h2 className={H2}>4. El parser puede equivocarse</h2>
              <p className={P}>
                Soportamos formatos de boleta que conocemos. Si tu boleta
                tiene un formato no soportado, lalupa puede:
              </p>
              <ul className={UL}>
                <li className={LI}>
                  No detectar la empresa (te pedimos elegir manualmente).
                </li>
                <li className={LI}>
                  Detectar la empresa pero extraer cargos parcialmente.
                </li>
                <li className={LI}>
                  Mostrar montos incorrectos por errores de parsing.
                </li>
              </ul>
              <p className={P}>
                Si encontrás un error, mandanos un correo a{' '}
                <a
                  href="mailto:bugs@lalupa.cl"
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  bugs@lalupa.cl
                </a>{' '}
                con la empresa y el período. Lo arreglamos rápido.
              </p>
            </div>

            <div className={SECTION} id="responsabilidad">
              <h2 className={H2}>
                5. Sin responsabilidad por decisiones tomadas con esta data
              </h2>
              <p className={P}>
                lalupa se ofrece «tal cual». No garantizamos que el resultado
                sea exhaustivo ni libre de errores.{' '}
                <strong className="text-ink">
                  No nos hacemos responsables de decisiones financieras,
                  legales o comerciales tomadas únicamente en base a lo que
                  muestra la herramienta.
                </strong>{' '}
                Si vas a presentar un reclamo formal o tomar una acción legal,
                respaldate con los documentos oficiales y, si el monto lo
                justifica, con asesoría profesional.
              </p>
            </div>

            <div className={SECTION} id="datos-regulatorios">
              <h2 className={H2}>6. Tarifas y datos regulatorios</h2>
              <p className={P}>
                Las tarifas SEC, SISS y SUBTEL que usamos para validar cargos
                son de fuentes oficiales públicas, pero pueden estar
                desactualizadas con respecto a un decreto reciente. La fuente
                autoritativa siempre es la publicación oficial vigente.
              </p>
              <p className={P}>
                El simulador del subsidio Ley 21.667 es referencial. La
                elegibilidad y el monto definitivos los determina el
                Ministerio de Energía al postular en{' '}
                <a
                  href="https://www.subsidioelectrico.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  subsidioelectrico.cl
                </a>{' '}
                con tu ClaveÚnica.
              </p>
            </div>

            <div className={SECTION} id="uso-aceptable">
              <h2 className={H2}>7. Uso aceptable</h2>
              <p className={P}>
                Podés usar lalupa para revisar tus propias boletas, ayudar a
                familiares, o uso académico. Está prohibido raspar el sitio
                automatizadamente, alterar el código en producción, o usar
                la herramienta para fines ilegales. La generación de cartas
                de reclamo SERNAC asume que sos el titular legítimo del
                servicio que reclamás.
              </p>
            </div>

            <div className={SECTION} id="cambios">
              <h2 className={H2}>8. Cambios</h2>
              <p className={P}>
                Estos términos pueden cambiar. Lo significativo se reflejará
                en la fecha de actualización abajo. Si no estás de acuerdo
                con algún cambio, dejá de usar la herramienta.
              </p>
              <p className="mt-8 text-xs text-soft">
                Última actualización: {ULTIMA_ACTUALIZACION}.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  )
}
