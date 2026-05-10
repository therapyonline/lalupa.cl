'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { BoletaErrorView } from '@/components/parsers/BoletaErrorView'
import { ComparativaSection } from '@/components/parsers/ComparativaSection'
import { PartialExtractionAlert } from '@/components/parsers/PartialExtractionAlert'
import { PrivacyExportImport } from '@/components/parsers/PrivacyExportImport'
import {
  ResultBlock,
  ResultBlockSkeleton,
  formatPeriod,
} from '@/components/parsers/ResultBlock'
import { SaveButton } from '@/components/parsers/SaveButton'
import {
  type EmpresaGas,
  type GasSlug,
  type ParsedBoleta,
  parseGas,
} from '@/lib/parsers'
import { isValidDate, safeISOString } from '@/lib/dates'
import {
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from '@/lib/session-storage'
// (Subcomponentes Save/Comparativa/Privacy/Error ahora viven en
// src/components/parsers/, compartidos entre los 3 result-view.)

const SESSION_KEY = 'lalupa:lastParsed'
const REDIRECT_MESSAGE_KEY = 'lalupa:redirect-message'
const RECLAMO_KEY = 'lalupa:reclamo'

interface PayloadShape {
  servicio: 'gas'
  empresa: EmpresaGas
  slug: GasSlug
  rawText: string
  timestamp: number
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'redirecting' }
  | { kind: 'parsed'; boleta: ParsedBoleta; payload: PayloadShape }
  | { kind: 'parser-error'; error: string }
  | { kind: 'unsupported'; empresa: EmpresaGas }

export function ResultViewGas({ empresaSlug }: { empresaSlug: string }) {
  const router = useRouter()
  const [state, setState] = useState<ViewState>({ kind: 'loading' })
  const [refreshTick, setRefreshTick] = useState(0)
  // Cuántas veces el usuario ya intentó "Agregar foto del reverso".
  // Lo usamos para escalar el mensaje del banner Lectura parcial: si ya
  // probó 2 veces y sigue sin extraer cargos, paramos de empujar fotos
  // y le sugerimos el PDF original.
  const [addAttempts, setAddAttempts] = useState(0)

  useEffect(() => {
    // Hidratación desde sessionStorage: en primer render no hay datos; el
    // efecto lee el payload del upload-hub anterior y deriva el ViewState.
    // Es un one-shot en mount, no genera cascading renders.
    /* eslint-disable react-hooks/set-state-in-effect */
    const raw = safeSessionGet(SESSION_KEY)
    if (!raw) {
      try {
        safeSessionSet(
          REDIRECT_MESSAGE_KEY,
          'No encontramos una boleta procesada. Súbela de nuevo.',
        )
      } catch {
        // ignore
      }
      router.replace('/boleta-gas')
      setState({ kind: 'redirecting' })
      return
    }

    let payload: PayloadShape
    try {
      payload = JSON.parse(raw) as PayloadShape
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
      router.replace('/boleta-gas')
      setState({ kind: 'redirecting' })
      return
    }

    if (payload.servicio !== 'gas') {
      router.replace('/boleta-gas')
      setState({ kind: 'redirecting' })
      return
    }

    if (payload.slug !== empresaSlug) {
      // Slug viejo en sessionStorage: limpiamos y redirigimos al upload.
      safeSessionRemove(SESSION_KEY)
      try {
        safeSessionSet(
          REDIRECT_MESSAGE_KEY,
          'Sube tu boleta para ver el análisis.',
        )
      } catch {
        // ignore
      }
      router.replace('/boleta-gas')
      setState({ kind: 'redirecting' })
      return
    }

    try {
      const boleta = parseGas(payload.empresa, payload.rawText)
      const reclamoPayload = {
        empresaSlug: payload.slug,
        empresaNombre: boleta.empresa,
        servicio: boleta.servicio,
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
        // ignore
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
      <BoletaErrorView
        title="No pudimos analizar tu boleta"
        description="El parser detectó la empresa pero no logró extraer los datos. Prueba con la versión digital del PDF (no escaneada)."
        detail={state.error}
        backHref="/boleta-gas"
      />
    )
  }

  if (state.kind === 'unsupported') {
    return (
      <BoletaErrorView
        title={`Aún no analizamos boletas de ${state.empresa}`}
        description={`El parser de ${state.empresa} todavía no está implementado, necesitamos una boleta real para mapear el formato exacto. Mientras tanto puedes volver a subir o probar con otra herramienta.`}
        backHref="/boleta-gas"
      />
    )
  }

  const { boleta, payload } = state
  const flags = boleta.cargos.filter((c) => c.sospechoso)
  const hasFlags = flags.length > 0
  const esProducto = boleta.tipoVenta === 'producto'

  function handleAddText(newText: string) {
    if (state.kind !== 'parsed') return
    const combinedText = `${state.payload.rawText}\n\n${newText}`
    try {
      const updatedBoleta = parseGas(state.payload.empresa, combinedText)
      const updatedPayload: PayloadShape = {
        ...state.payload,
        rawText: combinedText,
      }
      try {
        safeSessionSet(SESSION_KEY, JSON.stringify(updatedPayload))
      } catch {
        // ignore
      }
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
      setAddAttempts((n) => n + 1)
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
            {esProducto
              ? `Tu compra${
                  boleta.fechaEmision && isValidDate(boleta.fechaEmision)
                    ? ` del ${boleta.fechaEmision.toLocaleDateString('es-CL')}`
                    : ''
                }.`
              : isValidDate(boleta.periodo.desde) &&
                  isValidDate(boleta.periodo.hasta)
                ? `Tu boleta de ${formatPeriod(boleta.periodo)}.`
                : `Tu última boleta de ${boleta.empresa}.`}
          </h1>
          {hasFlags ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
              Encontramos{' '}
              <strong className="font-medium text-accent-deep">
                {flags.length}{' '}
                {flags.length === 1
                  ? 'cargo que merece tu atención'
                  : 'cargos que merecen tu atención'}
              </strong>
              .{' '}
              {flags.length === 1 ? 'Revísalo' : 'Revísalos'} abajo y, si
              quieres, genera un reclamo formal.
            </p>
          ) : (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
              Revisamos cada línea contra los precios SEC vigentes. No
              encontramos cargos sospechosos esta vez.
            </p>
          )}
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <PartialExtractionAlert
            boleta={boleta}
            onAddText={handleAddText}
            addAttempts={addAttempts}
          />
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
              <Link href="/boleta-gas">Subir otra boleta</Link>
            </Button>
          </div>
        </Container>
      </section>

      <ComparativaSection
        empresa={boleta.empresa as EmpresaGas}
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
            Herramienta referencial. Para reclamos formales: SERNAC, SEC. El
            análisis se hizo en tu navegador y no se guardó en ningún
            servidor.
          </p>
        </Container>
      </section>
    </main>
  )
}

