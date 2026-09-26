'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Pill'
import {
  CALENDARIO_5TA_CONVOCATORIA,
  ELEGIBILIDAD_METADATA,
  formatFechaCalendario,
  PREGUNTAS_2026,
  type PreguntaWizard,
  type ResultadoElegibilidad,
  type RespuestasWizard,
  buildRespuestasUsuario,
  evaluarSubsidioElectrico,
} from '@/data/subsidio-electrico'
import { cn } from '@/lib/utils'
import { safeSessionSet, safeSessionRemove } from '@/lib/session-storage'
import {
  readSessionDraft,
  subsidioDraftSchema,
  STORAGE_NOTICE,
  SUBSIDIO_DRAFT_VERSION,
} from '@/lib/storage/wizard-state'

const STORAGE_KEY = 'lalupa:subsidio:wizard'
const TOTAL = PREGUNTAS_2026.length

export function SubsidioWizard() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<RespuestasWizard>({})
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [hydrated, setHydrated] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storageNotice, setStorageNotice] = useState<string | null>(null)

  useEffect(() => {
    // Hidratación desde sessionStorage: one-shot en mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = readSessionDraft(STORAGE_KEY, subsidioDraftSchema)
    if (saved.data) {
      setStep(saved.data.step)
      setAnswers(saved.data.answers)
    }
    setStorageNotice(saved.notice ?? null)
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      safeSessionSet(
        STORAGE_KEY,
        JSON.stringify({ version: SUBSIDIO_DRAFT_VERSION, step, answers }),
      )
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- El efecto informa un fallo de persistencia externo.
      setStorageNotice(STORAGE_NOTICE)
    }
  }, [step, answers, hydrated])

  const pregunta = PREGUNTAS_2026[step]
  const currentValue = answers[pregunta.id]

  function setValue(id: string, value: unknown) {
    setError(null)
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  function validate(p: PreguntaWizard, value: unknown): string | null {
    if (p.opcional) return null
    if (value === undefined || value === null || value === '') {
      return 'Necesitamos tu respuesta para seguir.'
    }
    if (p.tipo === 'number') {
      const n = typeof value === 'number' ? value : Number(value)
      if (!Number.isSafeInteger(n))
        return 'Ingresa una cantidad entera de personas.'
      if (p.min !== undefined && n < p.min) return `Mínimo ${p.min}.`
      if (p.max !== undefined && n > p.max) return `Máximo ${p.max}.`
    }
    return null
  }

  function handleNext() {
    const err = validate(pregunta, currentValue)
    if (err) {
      setError(err)
      return
    }
    setDirection('forward')

    // Nota: antes había un short-circuit que saltaba al resultado si la
    // persona declaraba ser menor de edad. Lo quitamos porque dejaba el
    // wizard en un estado inconsistente al volver atrás (step quedaba en
    // 0 y "Volver" no tenía a dónde ir). El motor de elegibilidad ya
    // produce la minoría de edad como bloqueador terminal por la ruta
    // normal, así que la navegación queda consistente.
    if (step < TOTAL - 1) {
      setStep((s) => s + 1)
    } else {
      setShowResult(true)
    }
  }

  function handleSkip() {
    if (!pregunta.opcional) return
    setDirection('forward')
    setAnswers((a) => {
      const next = { ...a }
      delete next[pregunta.id]
      return next
    })
    if (step < TOTAL - 1) {
      setStep((s) => s + 1)
    } else {
      setShowResult(true)
    }
  }

  function handleBack() {
    setDirection('back')
    setError(null)
    if (showResult) {
      setShowResult(false)
      return
    }
    if (step > 0) setStep((s) => s - 1)
  }

  function handleRestart() {
    safeSessionRemove(STORAGE_KEY)
    setAnswers({})
    setStep(0)
    setShowResult(false)
    setError(null)
    setDirection('back')
  }

  const resultado = useMemo<ResultadoElegibilidad | null>(() => {
    if (!showResult) return null
    return evaluarSubsidioElectrico(buildRespuestasUsuario(answers))
  }, [showResult, answers])

  if (showResult && resultado) {
    return (
      <ResultView
        resultado={resultado}
        onBack={handleBack}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Subsidio eléctrico Ley 21.667
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Revisa los requisitos del subsidio eléctrico.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Responde sobre las condiciones de la quinta convocatoria de 2026.
            Esta orientación no consulta registros oficiales ni confirma un
            beneficio. Tus respuestas se guardan solo en este navegador.
          </p>
          <ConvocatoriaNotice />
          <Stepper current={step + 1} total={TOTAL} />
          {storageNotice && (
            <p className="mt-6" role="status">
              {storageNotice}
            </p>
          )}
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-[20px] border border-border bg-white p-6 md:p-10">
            <div
              key={step}
              className={cn(
                direction === 'forward'
                  ? 'animate-slide-from-right'
                  : 'animate-slide-from-left',
              )}
            >
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
                Pregunta {step + 1} de {TOTAL}
                {pregunta.opcional && (
                  <span className="ml-3 inline-flex items-center text-[10px] text-accent-deep">
                    · Opcional
                  </span>
                )}
              </p>
              <h2 className="mt-3 text-2xl font-medium leading-tight text-ink md:text-3xl">
                {pregunta.pregunta}
              </h2>
              {pregunta.descripcion && (
                <p className="mt-3 text-body">{pregunta.descripcion}</p>
              )}

              <div className="mt-8">
                <PreguntaInput
                  pregunta={pregunta}
                  value={currentValue}
                  onChange={(v) => setValue(pregunta.id, v)}
                />
                {error && (
                  <p className="mt-3 text-[13px] text-danger" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {step > 0 && (
                <Button variant="ghost" size="md" onClick={handleBack}>
                  Atrás
                </Button>
              )}
              {pregunta.opcional && (
                <Button variant="ghost" size="md" onClick={handleSkip}>
                  Saltar
                </Button>
              )}
              <Button variant="dark" size="md" onClick={handleNext}>
                {step === TOTAL - 1 ? 'Ver resultado' : 'Siguiente'}
              </Button>
              <button
                type="button"
                onClick={handleRestart}
                className="ml-auto text-xs uppercase tracking-wide text-soft hover:text-ink"
              >
                Empezar de nuevo
              </button>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

function Stepper({ current, total }: { current: number; total: number }) {
  // Una sola fórmula para texto y barra: preguntas completadas / total
  // (en la pregunta 1 aún no completaste ninguna, así que 0%). Antes el
  // texto usaba (current-1)/total y la barra current/total, mostrando dos
  // porcentajes distintos para el mismo progreso.
  const pctNum = ((current - 1) / total) * 100
  const pct = Math.round(pctNum)
  return (
    <div className="mt-10 max-w-3xl">
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wide text-soft">
        <span>
          {current} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-ink/5"
        role="progressbar"
        aria-label={`Progreso: pregunta ${current} de ${total}`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pctNum}%` }}
        />
      </div>
    </div>
  )
}

function PreguntaInput({
  pregunta,
  value,
  onChange,
}: {
  pregunta: PreguntaWizard
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (pregunta.tipo === 'boolean') {
    return (
      <div
        role="radiogroup"
        aria-label={pregunta.pregunta}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <BooleanOption
          label="Sí"
          selected={value === true}
          onClick={() => onChange(true)}
        />
        <BooleanOption
          label="No"
          selected={value === false}
          onClick={() => onChange(false)}
        />
      </div>
    )
  }
  if (pregunta.tipo === 'select' && pregunta.opciones) {
    return (
      <div className="flex flex-col gap-2">
        {pregunta.opciones.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-border bg-white px-4 py-3 transition-colors hover:border-ink',
              value === opt.value && 'border-primary bg-primary-soft',
            )}
          >
            <input
              type="radio"
              name={pregunta.id}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="text-[15px] text-ink">{opt.label}</span>
          </label>
        ))}
      </div>
    )
  }
  if (pregunta.tipo === 'number') {
    return (
      <div className="max-w-xs">
        <Input
          type="number"
          aria-label={pregunta.pregunta}
          step={1}
          value={value === undefined ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange(undefined)
            const n = Number(raw)
            onChange(Number.isNaN(n) ? undefined : n)
          }}
          min={pregunta.min}
          max={pregunta.max}
        />
      </div>
    )
  }
  return null
}

function BooleanOption({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'rounded-md border-[1.5px] px-6 py-4 text-left text-[15px] font-medium transition-colors',
        selected
          ? 'border-primary bg-primary-soft text-ink'
          : 'border-border bg-white text-ink hover:border-ink',
      )}
    >
      {label}
    </button>
  )
}

function ResultView({
  resultado,
  onBack,
  onRestart,
}: {
  resultado: ResultadoElegibilidad
  onBack: () => void
  onRestart: () => void
}) {
  const { califica, alertas } = resultado
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    // La última pregunta puede dejar el scroll lejos del inicio del resultado.
    heading.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  return (
    <>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Resultado · Subsidio eléctrico
          </p>
          <Pill
            variant={califica ? 'info' : 'warning'}
            className="mt-4 self-start"
          >
            Revisión orientativa
          </Pill>
          <h1
            ref={heading}
            tabIndex={-1}
            className="mt-6 max-w-[24ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink"
          >
            {califica
              ? 'Tus respuestas coinciden con los requisitos consultados.'
              : 'Hay antecedentes que revisar.'}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            {resultado.motivo}
          </p>
          <ConvocatoriaNotice />
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {califica && resultado.montoSemestralCLP !== null && (
              <MontoCard
                semestral={resultado.montoSemestralCLP}
                mensual={resultado.montoMensualCLP ?? 0}
              />
            )}

            {!califica && resultado.bloqueadores.length > 0 && (
              <BloqueadoresCard bloqueadores={resultado.bloqueadores} />
            )}

            {alertas.length > 0 && <AlertasCard alertas={alertas} />}
          </div>

          {resultado.factoresPrioridad.length > 0 && (
            <div className="mt-6 rounded-[20px] border border-border bg-white p-6">
              <h2 className="font-medium text-ink">
                Factores de priorización declarados
              </h2>
              <ul className="mt-3 list-disc pl-5 text-sm text-body">
                {resultado.factoresPrioridad.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-body">
                No representan un puntaje ni una probabilidad de adjudicación.
              </p>
            </div>
          )}
          <PasosCard pasos={resultado.pasosSiguientes} />
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <Alert variant="info">
            <Alert.Title>Esto es referencial</Alert.Title>
            <Alert.Body>
              Solo el resultado del Ministerio de Energía confirma la
              asignación. Contrasta tus antecedentes y el descuento de tu boleta
              con la resolución oficial. Revisión de fuentes:{' '}
              {ELEGIBILIDAD_METADATA.ultimaActualizacion}.
            </Alert.Body>
          </Alert>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" size="lg" onClick={onBack}>
              Volver al wizard
            </Button>
            <Button variant="ghost" size="lg" onClick={onRestart}>
              Empezar de nuevo
            </Button>
            <Button asChild variant="dark" size="lg">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}

function MontoCard({
  semestral,
  mensual,
}: {
  semestral: number
  mensual: number
}) {
  return (
    <div className="rounded-[20px] border border-border bg-white p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        Referencia por integrantes · segundo semestre 2026
      </p>
      <p className="mt-3 text-4xl font-medium leading-none tabular-nums text-ink md:text-5xl">
        $ {Math.round(semestral).toLocaleString('es-CL')}
      </p>
      <p className="mt-2 text-sm text-body">
        semestral · ${Math.round(mensual).toLocaleString('es-CL')} por cuota, en
        seis cuotas. No es un monto adjudicado a tu hogar.
      </p>
      <a
        href={ELEGIBILIDAD_METADATA.fuentes.montosYAplicacion}
        className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver montos publicados por el Ministerio
      </a>
    </div>
  )
}

function BloqueadoresCard({ bloqueadores }: { bloqueadores: string[] }) {
  return (
    <div className="rounded-[20px] border border-danger/30 bg-danger-soft p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-danger">
        Antecedentes por verificar
      </p>
      <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ink">
        {bloqueadores.map((b) => (
          <li key={b} className="flex gap-2">
            <span aria-hidden className="text-danger">
              ×
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AlertasCard({ alertas }: { alertas: string[] }) {
  return (
    <div className="rounded-[20px] border border-warning/30 bg-warning-soft p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-warning">
        A verificar
      </p>
      <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ink">
        {alertas.map((a) => (
          <li key={a} className="flex gap-2">
            <span aria-hidden className="text-warning">
              !
            </span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PasosCard({ pasos }: { pasos: string[] }) {
  return (
    <div className="mt-6 rounded-[20px] border border-border bg-white p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        Consulta y revisión del resultado
      </p>
      <ol className="mt-5 flex flex-col gap-4">
        {pasos.map((paso, i) => (
          <li
            key={paso}
            className="flex gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0"
          >
            <span className="font-mono text-xs font-medium tracking-wide text-primary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 text-[15px] leading-relaxed text-ink">
              {paso}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="primary" size="md">
          <a
            href="https://www.subsidioelectrico.cl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar en subsidioelectrico.cl
          </a>
        </Button>
        <Button asChild variant="ghost" size="md">
          <a
            href={ELEGIBILIDAD_METADATA.fuentes.consulta}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver canales de atención
          </a>
        </Button>
      </div>
    </div>
  )
}

function ConvocatoriaNotice() {
  return (
    <div className="mt-6 rounded-xl border border-primary/20 bg-primary-soft p-5 text-body">
      <h2 className="font-medium text-ink">
        Postulación cerrada · quinta convocatoria
      </h2>
      <p className="mt-2 text-sm leading-relaxed">
        El plazo cerró el{' '}
        {formatFechaCalendario(CALENDARIO_5TA_CONVOCATORIA.postulacionFin)}.
        Puedes consultar el resultado oficial y los descuentos asignados. Este
        formulario no permite postular ni predice una próxima convocatoria.
      </p>
      <a
        href={ELEGIBILIDAD_METADATA.fuentes.consulta}
        className="mt-3 inline-block font-medium text-primary underline underline-offset-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Consultar resultado oficial
      </a>
    </div>
  )
}
