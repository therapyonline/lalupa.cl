'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pill } from '@/components/ui/Pill'
import {
  CALENDARIO_5TA_CONVOCATORIA,
  PREGUNTAS_2026,
  type PreguntaWizard,
  type ResultadoElegibilidad,
  type RespuestasWizard,
  buildRespuestasUsuario,
  evaluarSubsidioElectrico,
} from '@/data/subsidio-electrico'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'lalupa:subsidio:wizard'
const TOTAL = PREGUNTAS_2026.length

interface PersistedState {
  step: number
  answers: RespuestasWizard
}

export function SubsidioWizard() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<RespuestasWizard>({})
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [hydrated, setHydrated] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Hidratación desde sessionStorage: one-shot en mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PersistedState
        if (parsed && typeof parsed.step === 'number' && parsed.answers) {
          setStep(Math.min(parsed.step, TOTAL - 1))
          setAnswers(parsed.answers)
        }
      } catch {
        // ignore corrupt state
      }
    }
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => {
    if (!hydrated) return
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ step, answers } satisfies PersistedState),
    )
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
      const n = typeof value === 'number' ? value : parseInt(String(value), 10)
      if (Number.isNaN(n)) return 'Ingresá un número válido.'
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

    // Short-circuit: si la respuesta a Q1 (esMayorDeEdad) es false,
    // el resto del wizard no aplica (bloqueador absoluto). Saltamos
    // directo al resultado para no hacer perder tiempo al usuario.
    if (
      pregunta.id === 'esMayorDeEdad' &&
      answers.esMayorDeEdad === false
    ) {
      setShowResult(true)
      return
    }

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
    sessionStorage.removeItem(STORAGE_KEY)
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
            ¿Calificas al subsidio eléctrico?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            13 preguntas. Te tomamos 2 minutos y te decimos si calificas +
            cómo postular. Tus respuestas viven solo en este celular.
          </p>
          <Stepper current={step + 1} total={TOTAL} />
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
  const pct = Math.round(((current - 1) / total) * 100)
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
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
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
          value={value === undefined ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange(undefined)
            const n = parseInt(raw, 10)
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
  const conAlertas = alertas.length > 0
  const tone: 'califica' | 'parcial' | 'no-califica' = !califica
    ? 'no-califica'
    : conAlertas
      ? 'parcial'
      : 'califica'

  return (
    <>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Resultado · Subsidio eléctrico
          </p>
          <Pill
            variant={
              tone === 'califica'
                ? 'success'
                : tone === 'parcial'
                  ? 'warning'
                  : 'danger'
            }
            className="mt-4 self-start"
          >
            {tone === 'califica'
              ? 'Calificas'
              : tone === 'parcial'
                ? 'Calificas, con condiciones'
                : 'No calificas'}
          </Pill>
          <h1 className="mt-6 max-w-[24ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            {tone === 'califica'
              ? 'Sí calificas al subsidio eléctrico.'
              : tone === 'parcial'
                ? 'Calificas, pero hay cosas a verificar.'
                : 'Esta convocatoria no calificas.'}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            {resultado.motivo}
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {califica && resultado.montoSemestralCLP !== null && (
              <MontoCard
                semestral={resultado.montoSemestralCLP}
                mensual={resultado.montoMensualCLP ?? 0}
                prioridad={resultado.prioridad}
              />
            )}

            {!califica && resultado.bloqueadores.length > 0 && (
              <BloqueadoresCard bloqueadores={resultado.bloqueadores} />
            )}

            {alertas.length > 0 && <AlertasCard alertas={alertas} />}
          </div>

          <PasosCard
            califica={califica}
            pasos={resultado.pasosSiguientes}
          />
        </Container>
      </section>

      <section className="bg-cream pb-20">
        <Container>
          <Alert variant="info">
            <Alert.Title>Esto es referencial</Alert.Title>
            <Alert.Body>
              La elegibilidad oficial se confirma al postular en{' '}
              <a
                href="https://www.subsidioelectrico.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                subsidioelectrico.cl
              </a>{' '}
              con tu ClaveÚnica. Las fechas vigentes (postulación hasta el{' '}
              {CALENDARIO_5TA_CONVOCATORIA.postulacionFin}, estar al día hasta
              el {CALENDARIO_5TA_CONVOCATORIA.fechaAlDiaPago}) las publica la
              SEC y pueden cambiar.
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
  prioridad,
}: {
  semestral: number
  mensual: number
  prioridad: ResultadoElegibilidad['prioridad']
}) {
  return (
    <div className="rounded-[20px] border border-border bg-white p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        Estimación
      </p>
      <p className="mt-3 text-4xl font-medium leading-none tabular-nums text-ink md:text-5xl">
        $ {Math.round(semestral).toLocaleString('es-CL')}
      </p>
      <p className="mt-2 text-sm text-body">
        semestral · ${Math.round(mensual).toLocaleString('es-CL')} mensual en
        6 cuotas.
      </p>
      <Pill
        variant={
          prioridad === 'alta'
            ? 'success'
            : prioridad === 'media'
              ? 'warning'
              : 'info'
        }
        className="mt-5 self-start"
      >
        Prioridad{' '}
        {prioridad === 'alta'
          ? 'alta'
          : prioridad === 'media'
            ? 'media'
            : prioridad === 'baja'
              ? 'baja'
              : '-'}
      </Pill>
    </div>
  )
}

function BloqueadoresCard({ bloqueadores }: { bloqueadores: string[] }) {
  return (
    <div className="rounded-[20px] border border-danger/30 bg-danger-soft p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-danger">
        Por qué no calificas
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

function PasosCard({
  califica,
  pasos,
}: {
  califica: boolean
  pasos: string[]
}) {
  return (
    <div className="mt-6 rounded-[20px] border border-border bg-white p-6 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
        {califica ? 'Cómo postular' : 'Qué puedes hacer ahora'}
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
            Postular en subsidioelectrico.cl
          </a>
        </Button>
        <Button asChild variant="ghost" size="md">
          <a
            href="https://www.sec.cl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver SEC
          </a>
        </Button>
      </div>
    </div>
  )
}
