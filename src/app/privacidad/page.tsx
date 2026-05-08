import { Container } from '@/components/layout/Container'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbsSchema, buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Privacidad',
  description:
    'Política de privacidad de lalupa.cl: qué hacemos, qué no hacemos, cómo optar por no ser medido. Honesta y al día con la Ley 21.719.',
  path: '/privacidad',
  ogKind: 'guide',
})

const ULTIMA_ACTUALIZACION = '12 de mayo de 2026'

/** Clases compartidas para tipografía legal cómoda. */
const PROSE_LEGAL = 'mx-auto max-w-[65ch] text-[17px] leading-[1.65]'
const SECTION = 'mt-12'
const H2 = 'text-2xl font-medium tracking-tight text-ink md:text-3xl'
const H3 = 'mt-6 text-base font-semibold uppercase tracking-[0.08em] text-ink'
const P = 'mt-4 leading-[1.65] text-body'
const UL = 'mt-4 flex flex-col gap-2 list-disc pl-6 marker:text-soft'
const LI = 'leading-[1.65] text-body'

export default function PrivacidadPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={breadcrumbsSchema([
          { name: 'Inicio', href: '/' },
          { name: 'Privacidad', href: '/privacidad' },
        ])}
      />

      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Política de privacidad
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Tu boleta, tu celular. Punto.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            lalupa fue construida bajo un principio simple: no almacenamos lo
            que no necesitamos. Esta página es la versión literal de eso —
            qué hacemos, qué no, y cómo desactivar lo poco que sí hacemos.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Última actualización: {ULTIMA_ACTUALIZACION}
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-24">
        <Container>
          <div className={PROSE_LEGAL}>
            {/* ───────────────── QUÉ NO HACEMOS ───────────────── */}
            <div className={SECTION} id="que-no-hacemos">
              <h2 className={H2}>Qué NO hacemos</h2>
              <p className={P}>
                Esta lista es exhaustiva. Si algún día agregamos algo, lo
                vas a ver acá primero.
              </p>
              <ul className={UL}>
                <li className={LI}>
                  <strong className="text-ink">
                    No subimos tus boletas a ningún servidor.
                  </strong>{' '}
                  Todo se procesa en este navegador. El PDF o foto que subís
                  nunca se transmite a internet.
                </li>
                <li className={LI}>
                  <strong className="text-ink">
                    No guardamos tu nombre, RUT, dirección ni datos de tu
                    boleta
                  </strong>{' '}
                  en nuestros servidores. No tenemos base de datos de
                  usuarios.
                </li>
                <li className={LI}>
                  <strong className="text-ink">
                    No usamos cookies de tracking
                  </strong>
                  . No hay Google Analytics, no hay Facebook Pixel, no hay
                  identificadores cross-site.
                </li>
                <li className={LI}>
                  <strong className="text-ink">
                    No identificamos a usuarios individuales.
                  </strong>{' '}
                  Las métricas que sí usamos son agregadas y anónimas — ver
                  abajo.
                </li>
                <li className={LI}>
                  <strong className="text-ink">
                    No vendemos ni compartimos datos con terceros.
                  </strong>{' '}
                  No tenemos integraciones publicitarias, ni acuerdos de
                  data brokers, ni APIs comerciales.
                </li>
              </ul>
            </div>

            {/* ───────────────── QUÉ SÍ HACEMOS ───────────────── */}
            <div className={SECTION} id="que-si-hacemos">
              <h2 className={H2}>Qué SÍ hacemos</h2>
              <p className={P}>
                Tres cosas, todas declaradas y bypaseables.
              </p>

              <h3 className={H3}>Métricas anónimas agregadas</h3>
              <p className={P}>
                Usamos <strong className="text-ink">Cloudflare Web
                Analytics</strong>: sin cookies, sin IPs almacenadas. Vemos
                cuántas personas visitaron una página, desde qué país llegaron
                en agregado, y qué páginas son las más usadas. No podemos
                conectar dos visitas tuyas, ni saber qué hiciste dentro de
                la app.
              </p>

              <h3 className={H3}>Heatmaps y grabaciones de sesión</h3>
              <p className={P}>
                Usamos <strong className="text-ink">Microsoft Clarity</strong>{' '}
                en modo cookie-less, configurado para{' '}
                <strong className="text-ink">enmascarar todos los inputs</strong>{' '}
                de formularios. Lo que vemos es por dónde se mueve el cursor
                y dónde la gente se atasca — útil para mejorar la UX. Lo que{' '}
                <em>no</em> vemos es: qué escribís, tu nombre, RUT, ni
                ningún campo de tu boleta. Nunca capturamos texto de inputs.
              </p>

              <h3 className={H3}>Datos en tu propio navegador (IndexedDB)</h3>
              <p className={P}>
                Si guardás boletas en tu histórico (en{' '}
                <a
                  href="/tracker"
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  /tracker
                </a>
                ), esos datos viven en{' '}
                <strong className="text-ink">IndexedDB</strong> dentro de
                tu navegador. Solo tu dispositivo tiene acceso — ni siquiera
                nosotros podemos leerlo. Si borrás los datos del sitio, el
                histórico se borra junto. Y nunca se sincroniza a otros
                dispositivos automáticamente — solo si vos exportás manualmente.
              </p>
            </div>

            {/* ───────────────── CÓMO OPTAR ───────────────── */}
            <div className={SECTION} id="como-optar">
              <h2 className={H2}>Cómo optar por no ser medido</h2>
              <p className={P}>
                Cualquier{' '}
                <strong className="text-ink">
                  bloqueador de tracking estándar
                </strong>{' '}
                bloquea todo lo de la sección anterior sin afectar funcionalidad.
                La app sigue funcionando 100% igual sin métricas.
              </p>
              <ul className={UL}>
                <li className={LI}>
                  <strong className="text-ink">uBlock Origin</strong> (Firefox
                  / Chrome): listas EasyPrivacy bloquean Cloudflare WA y
                  Clarity por defecto.
                </li>
                <li className={LI}>
                  <strong className="text-ink">Brave Browser</strong>: Shields
                  on (default) bloquea ambos.
                </li>
                <li className={LI}>
                  <strong className="text-ink">
                    Firefox con Enhanced Tracking Protection en modo «Strict»
                  </strong>
                  : bloquea ambos.
                </li>
                <li className={LI}>
                  <strong className="text-ink">Safari con Private Mode</strong>
                  : bloquea ambos.
                </li>
              </ul>
              <p className={P}>
                No hay banner de cookies pidiéndote consentimiento porque no
                usamos cookies de tracking. Las métricas son cookie-less por
                diseño.
              </p>
            </div>

            {/* ───────────────── LEGAL CHILE ───────────────── */}
            <div className={SECTION} id="ley-21719">
              <h2 className={H2}>Cumplimiento legal</h2>
              <p className={P}>
                lalupa cumple con la{' '}
                <strong className="text-ink">Ley 21.719</strong> sobre
                Protección de Datos Personales (Chile, vigente desde diciembre
                2026). Aunque técnicamente no procesamos datos personales
                identificables en servidor —porque todo el procesamiento de
                boletas ocurre en tu navegador—, declaramos transparentemente
                acá qué hacemos y qué no.
              </p>
              <p className={P}>
                Si querés ejercer tus derechos ARCO (acceso, rectificación,
                cancelación, oposición) sobre cualquier dato que pudiéramos
                tener tuyo, escribinos a{' '}
                <a
                  href="mailto:privacidad@lalupa.cl"
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  privacidad@lalupa.cl
                </a>
                . En la mayoría de los casos la respuesta va a ser que no
                tenemos datos tuyos para acceder, rectificar o cancelar —
                pero la garantía está y la respondemos por escrito en los
                plazos legales (15 días hábiles).
              </p>
            </div>

            {/* ───────────────── CONTACTO ───────────────── */}
            <div className={SECTION} id="contacto-privacidad">
              <h2 className={H2}>Contacto</h2>
              <p className={P}>
                Cualquier duda o sugerencia sobre esta política:
              </p>
              <ul className={UL}>
                <li className={LI}>
                  General:{' '}
                  <a
                    href="mailto:contacto@lalupa.cl"
                    className="text-primary underline underline-offset-4 hover:no-underline"
                  >
                    contacto@lalupa.cl
                  </a>
                </li>
                <li className={LI}>
                  Privacidad / derechos ARCO:{' '}
                  <a
                    href="mailto:privacidad@lalupa.cl"
                    className="text-primary underline underline-offset-4 hover:no-underline"
                  >
                    privacidad@lalupa.cl
                  </a>
                </li>
              </ul>
            </div>

            {/* ───────────────── CAMBIOS ───────────────── */}
            <div className={SECTION} id="cambios">
              <h2 className={H2}>Cambios a esta política</h2>
              <p className={P}>
                Si cambiamos algo material — agregamos un tracker nuevo,
                cambiamos proveedor de analytics, o pasa cualquier cosa que
                afecte qué se mide o cómo — lo vas a ver reflejado en la
                fecha de actualización al inicio de esta página, y notificamos
                en el footer del sitio durante 30 días.
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
