'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import {
  ResultBlock,
  ResultBlockSkeleton,
  formatPeriod,
} from '@/components/parsers/ResultBlock'
import { Comparativa, ComparativaSkeleton } from '@/components/parsers/Comparativa'
import { PartialExtractionAlert } from '@/components/parsers/PartialExtractionAlert'
import {
  type EmpresaElectrica,
  type EmpresaSlug,
  type ParsedBoleta,
  SLUG_TO_EMPRESA_ELECTRICA,
  parseElectricidad,
} from '@/lib/parsers'
import { safeISOString } from '@/lib/dates'
import {
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from '@/lib/session-storage'
import {
  type BoletaGuardada,
  exportarHistorial,
  guardarBoleta,
  importarHistorial,
  listarBoletas,
} from '@/lib/storage/historial'

const SESSION_KEY = 'lalupa:lastParsed'
const REDIRECT_MESSAGE_KEY = 'lalupa:redirect-message'
const RECLAMO_KEY = 'lalupa:reclamo'

interface PayloadShape {
  servicio: 'electricidad'
  empresa: EmpresaElectrica
  slug: EmpresaSlug
  rawText: string
  timestamp: number
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'redirecting' }
  | { kind: 'parsed'; boleta: ParsedBoleta; payload: PayloadShape }
  | { kind: 'parser-error'; error: string }
  | { kind: 'unsupported'; empresa: EmpresaElectrica }

export function ResultView({ empresaSlug }: { empresaSlug: string }) {
  const router = useRouter()
  const [state, setState] = useState<ViewState>({ kind: 'loading' })
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    // Hidratación desde sessionStorage: en primer render no hay datos; el
    // efecto lee el payload del upload-hub anterior y deriva el ViewState.
    // Es un one-shot en mount, no genera cascading renders.
    /* eslint-disable react-hooks/set-state-in-effect */
    const raw = safeSessionGet(SESSION_KEY)
    if (!raw) {
      // safeSessionSet puede fallar en Private Mode; ignoramos errores
      // del mensaje de redirect (no es bloqueante).
      try {
        safeSessionSet(
          REDIRECT_MESSAGE_KEY,
          'No encontramos una boleta procesada. Súbela de nuevo.',
        )
      } catch {
        // ignore
      }
      router.replace('/boleta-luz')
      setState({ kind: 'redirecting' })
      return
    }

    let payload: PayloadShape
    try {
      payload = JSON.parse(raw) as PayloadShape
      // Validación de shape mínima: campos requeridos no faltantes ni
      // de tipo extraño.  Un payload corrupto rompe el parser después.
      if (
        !payload ||
        typeof payload !== 'object' ||
        typeof payload.rawText !== 'string' ||
        typeof payload.empresa !== 'string' ||
        typeof payload.slug !== 'string'
      ) {
        throw new Error('Payload con shape inválido.')
      }
    } catch {
      safeSessionRemove(SESSION_KEY)
      router.replace('/boleta-luz')
      setState({ kind: 'redirecting' })
      return
    }

    if (payload.slug !== empresaSlug) {
      // Slug en URL distinto al del payload: el usuario clickeó un chip
      // de otra distribuidora intencionalmente. Tratamos como manual
      // override: reusamos el rawText pero lo parseamos con la empresa
      // de la URL. Si el texto no calza, el parser lanza WRONG_EMPRESA
      // y mostramos error claro.
      const empresaFromUrl =
        SLUG_TO_EMPRESA_ELECTRICA[empresaSlug as EmpresaSlug]
      if (!empresaFromUrl) {
        // Slug inválido (no debería pasar dado VALID_SLUGS en page.tsx).
        router.replace('/boleta-luz')
        setState({ kind: 'redirecting' })
        return
      }
      payload = {
        ...payload,
        empresa: empresaFromUrl,
        slug: empresaSlug as EmpresaSlug,
      }
    }

    try {
      const boleta = parseElectricidad(payload.empresa, payload.rawText)
      const reclamoPayload = {
        empresaSlug: payload.slug,
        empresaNombre: boleta.empresa,
        servicio: boleta.servicio,
        // safeISOString tolera Date(NaN) (cuando el parser no pudo
        // extraer fechas): devuelve undefined en vez de tirar RangeError.
        periodoDesde: safeISOString(boleta.periodo.desde),
        periodoHasta: safeISOString(boleta.periodo.hasta),
        fechaEmision: safeISOString(boleta.fechaEmision),
        fechaVencimiento: safeISOString(boleta.fechaVencimiento),
        numeroCliente: boleta.cliente.numeroCliente,
        total: boleta.totales.total,
        cargosSospechosos: boleta.cargos
          .filter((c) => c.sospechoso)
          .map((c) => ({
            concepto: c.concepto,
            monto: c.monto,
            razon: c.razonSospecha,
          })),
      }
      try {
        safeSessionSet(RECLAMO_KEY, JSON.stringify(reclamoPayload))
      } catch {
        // No bloqueante: si el storage falló, el reclamo se va a tener
        // que pre-llenar a mano. Mostramos el resultado igual.
      }
      setState({ kind: 'parsed', boleta, payload })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error desconocido al parsear.'
      if (/no implementado/i.test(message)) {
        setState({ kind: 'unsupported', empresa: payload.empresa })
      } else {
        setState({ kind: 'parser-error', error: message })
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [empresaSlug, router])

  if (state.kind === 'loading' || state.kind === 'redirecting') {
    return (
      <main className="flex-1">
        <section className="bg-cream py-12 md:py-16">
          <Container>
            <p
              role="status"
              aria-live="polite"
              className="font-mono text-xs uppercase tracking-[0.1em] text-soft"
            >
              Procesando…
            </p>
            <p className="mt-4 max-w-2xl text-2xl font-medium text-ink md:text-3xl">
              Analizando tu boleta línea por línea.
            </p>
          </Container>
        </section>
        <section className="bg-cream pb-12">
          <Container>
            <ResultBlockSkeleton />
          </Container>
        </section>
      </main>
    )
  }

  if (state.kind === 'parser-error') {
    return (
      <ErrorView
        title="No pudimos analizar tu boleta"
        description="El parser detectó la distribuidora pero no logró extraer los datos. Prueba con la versión digital del PDF (no escaneada)."
        detail={state.error}
      />
    )
  }

  if (state.kind === 'unsupported') {
    return (
      <ErrorView
        title={`Aún no analizamos boletas de ${state.empresa}`}
        description={`Estamos trabajando en el parser de ${state.empresa}. Por ahora, CGE es la única distribuidora con análisis completo. Sube una boleta de CGE o espera la próxima versión.`}
      />
    )
  }

  const { boleta, payload } = state
  const flags = boleta.cargos.filter((c) => c.sospechoso)
  const hasFlags = flags.length > 0

  function handleAddText(newText: string) {
    if (state.kind !== 'parsed') return
    const combinedText = `${state.payload.rawText}\n\n${newText}`
    try {
      const updatedBoleta = parseElectricidad(state.payload.empresa, combinedText)
      const updatedPayload: PayloadShape = {
        ...state.payload,
        rawText: combinedText,
      }
      // Persistir el payload combinado para que un refresh no pierda
      // las páginas extra que el usuario ya OCR-eó.
      try {
        safeSessionSet(SESSION_KEY, JSON.stringify(updatedPayload))
      } catch {
        // ignore
      }
      // Re-construir reclamoPayload con la nueva info.
      const reclamoPayload = {
        empresaSlug: updatedPayload.slug,
        empresaNombre: updatedBoleta.empresa,
        servicio: updatedBoleta.servicio,
        periodoDesde: safeISOString(updatedBoleta.periodo.desde),
        periodoHasta: safeISOString(updatedBoleta.periodo.hasta),
        fechaEmision: safeISOString(updatedBoleta.fechaEmision),
        fechaVencimiento: safeISOString(updatedBoleta.fechaVencimiento),
        numeroCliente: updatedBoleta.cliente.numeroCliente,
        total: updatedBoleta.totales.total,
        cargosSospechosos: updatedBoleta.cargos
          .filter((c) => c.sospechoso)
          .map((c) => ({
            concepto: c.concepto,
            monto: c.monto,
            razon: c.razonSospecha,
          })),
      }
      try {
        safeSessionSet(RECLAMO_KEY, JSON.stringify(reclamoPayload))
      } catch {
        // ignore
      }
      setState({ kind: 'parsed', boleta: updatedBoleta, payload: updatedPayload })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al re-parsear con la nueva foto.'
      setState({ kind: 'parser-error', error: message })
    }
  }

  return (
    <main className="flex-1">
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Resultado · {boleta.empresa}
          </p>
          <h1 className="mt-4 max-w-[24ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Tu boleta de {formatPeriod(boleta.periodo)}.
          </h1>
          {hasFlags ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
              Encontramos{' '}
              <strong className="font-medium text-accent-deep">
                {flags.length} {flags.length === 1 ? 'cargo' : 'cargos'} que
                merecen tu atención
              </strong>
              . Revísalos abajo y, si quieres, genera un reclamo formal.
            </p>
          ) : (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
              Revisamos cada línea contra las tarifas SEC vigentes. No
              encontramos cargos sospechosos esta vez.
            </p>
          )}
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <PartialExtractionAlert boleta={boleta} onAddText={handleAddText} />
          <div className={boleta.cargos.length > 0 ? '' : 'mt-6'}>
            <ResultBlock boleta={boleta} />
          </div>
        </Container>
      </section>

      <section className="bg-cream pb-16">
        <Container>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {hasFlags && (
              <Button asChild variant="accent" size="lg">
                <Link href="/reclamar-sernac">Generar reclamo SERNAC</Link>
              </Button>
            )}
            <SaveButton
              boleta={boleta}
              onSaved={() => setRefreshTick((t) => t + 1)}
            />
            <Button asChild variant="ghost" size="lg">
              <Link href="/boleta-luz">Subir otra boleta</Link>
            </Button>
          </div>
        </Container>
      </section>

      <ComparativaSection
        empresa={boleta.empresa as EmpresaElectrica}
        actual={boleta}
        slug={payload.slug}
        refreshTick={refreshTick}
      />

      <section className="bg-cream py-16">
        <Container>
          <PrivacyExportImport
            onImported={() => setRefreshTick((t) => t + 1)}
          />
          <p className="mt-10 max-w-2xl text-xs text-soft">
            Herramienta referencial. Para reclamos formales: SERNAC, SEC,
            SISS. El análisis se hizo en tu navegador y no se guardó en
            ningún servidor.
          </p>
        </Container>
      </section>
    </main>
  )
}

function ErrorView({
  title,
  description,
  detail,
}: {
  title: string
  description: string
  detail?: string
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
            <Alert.Title>{title}</Alert.Title>
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
              <Link href="/boleta-luz">Volver a subir</Link>
            </Button>
          </div>
        </Container>
      </section>
    </main>
  )
}

function SaveButton({
  boleta,
  onSaved,
}: {
  boleta: ParsedBoleta
  onSaved?: () => void
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      await guardarBoleta(boleta)
      setStatus('saved')
      onSaved?.()
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error guardando en histórico.',
      )
      setStatus('error')
    }
  }

  if (status === 'saved') {
    return (
      <Button variant="primary" size="lg" disabled>
        Guardado en histórico ✓
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="dark"
        size="lg"
        onClick={handleSave}
        disabled={status === 'saving'}
      >
        {status === 'saving' ? 'Guardando…' : 'Guardar en mi histórico'}
      </Button>
      {errorMsg && (
        <p className="text-xs text-danger" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}

function ComparativaSection({
  empresa,
  actual,
  slug,
  refreshTick,
}: {
  empresa: EmpresaElectrica
  actual: ParsedBoleta
  slug: EmpresaSlug
  refreshTick: number
}) {
  const [historicas, setHistoricas] = useState<BoletaGuardada[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    listarBoletas(empresa, actual.servicio)
      .then((all) => {
        const dedup = all.filter(
          (b) => b.periodo.desde.getTime() !== actual.periodo.desde.getTime(),
        )
        setHistoricas(dedup.slice(-5))
        setLoaded(true)
      })
      .catch(() => {
        setHistoricas([])
        setLoaded(true)
      })
  }, [empresa, actual.servicio, actual.periodo.desde, refreshTick])

  if (!loaded) {
    return (
      <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Histórico {empresa} · {slug}
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Cargando tu histórico…
          </h2>
          <ComparativaSkeleton className="mt-8" rows={4} />
        </Container>
      </section>
    )
  }

  if (historicas.length === 0) {
    return (
      <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
        <Container>
          <div className="rounded-[20px] border border-border bg-cream-warm/30 p-8 text-center md:p-12">
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
              Histórico {empresa}
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
              Esta es tu primera boleta acá
            </h2>
            <p className="mx-auto mt-3 max-w-md text-body">
              Cuando guardes este período en tu histórico (botón de arriba),
              empezamos a comparar mes a mes y te avisamos si tu cuenta sube
              sin razón aparente.
            </p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white py-16" aria-label={`Histórico ${empresa}`}>
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
          Histórico {empresa} · {slug}
        </p>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
          Tus últimos {historicas.length + 1} períodos
        </h2>
        <p className="mt-3 max-w-2xl text-body">
          Comparamos las últimas boletas guardadas contra la actual. Si la
          actual supera el promedio, la fila queda destacada.
        </p>

        <Comparativa
          className="mt-8"
          historicas={historicas}
          actual={actual}
        />
      </Container>
    </section>
  )
}

function PrivacyExportImport({ onImported }: { onImported?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const handleExport = useCallback(async () => {
    setFeedback(null)
    try {
      const blob = await exportarHistorial()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `lalupa-historial-${ts}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setFeedback({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'No pudimos exportar tu historial.',
      })
    }
  }, [])

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setFeedback(null)
      try {
        const count = await importarHistorial(file)
        setFeedback({
          kind: 'success',
          message: `Importadas ${count} ${count === 1 ? 'boleta' : 'boletas'} a tu histórico local.`,
        })
        onImported?.()
      } catch (err) {
        setFeedback({
          kind: 'error',
          message: err instanceof Error ? err.message : 'No pudimos importar.',
        })
      }
    },
    [onImported],
  )

  return (
    <div className="rounded-[20px] border border-border bg-cream-warm/50 p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink">
        Privacidad
      </p>
      <p className="mt-3 text-base leading-relaxed text-ink md:text-lg">
        Tu histórico vive solo en este celular. Nada sale a internet.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleExport}>
          Exportar JSON
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Importar JSON
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />
        <span className="text-xs text-body">
          para mover entre dispositivos.
        </span>
      </div>
      {feedback && (
        <p
          role="status"
          className={
            feedback.kind === 'success'
              ? 'mt-4 text-sm text-success'
              : 'mt-4 text-sm text-danger'
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  )
}
