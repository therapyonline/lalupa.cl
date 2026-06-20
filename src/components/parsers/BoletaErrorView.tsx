import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

/**
 * Estado de error compartido entre los 3 result-view (luz, agua, gas).
 * El caller pasa el href para "Volver a subir" porque depende del
 * servicio (`/boleta-luz`, `/boleta-agua`, `/boleta-gas`).
 */
export function BoletaErrorView({
  title,
  description,
  detail,
  backHref,
  backLabel = 'Volver a subir',
}: {
  title: string
  description: string
  detail?: string
  backHref: string
  backLabel?: string
}) {
  return (
    <main className="flex-1">
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Resultado
          </p>
          <h1 className="mt-4 text-[clamp(32px,4vw,48px)] font-medium leading-[1.1] tracking-tight text-ink">
            {title}
          </h1>
        </Container>
      </section>
      <section className="bg-cream pb-20">
        <Container>
          <Alert variant="danger">
            {/* El <h1> de arriba ya muestra el título; el Alert no lo
                repite para no duplicar el mensaje. */}
            <Alert.Body>
              {description}
              {detail && (
                <span className="mt-2 block font-mono text-xs text-ink/70">
                  {detail}
                </span>
              )}
            </Alert.Body>
          </Alert>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="dark" size="lg">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}
