'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

// Zod 4 usa `new Function()` para JIT de validación, lo cual viola la CSP
// `script-src 'self'` (sin `unsafe-eval`). Zod cachea el resultado del probe
// y siempre cae al evaluador interpretado, pero el intent inicial dispara
// un Content-Security-Policy issue en DevTools (Lighthouse lo cuenta como
// best practice). `jitless: true` salta el probe.
z.config({ jitless: true })
import { Container } from '@/components/layout/Container'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getEmpresa } from '@/data/empresas'
import {
  type ReclamoBoletaPayload,
  type ReclamoFormData,
  TIPOS_RECLAMO,
  buildHechosTemplate,
  buildLetterPdf,
  buildLetterText,
  buildPeticionTemplate,
} from '@/lib/sernac/letter'
import { formatRut, normalizeRut, validateRut } from '@/lib/validators/rut'
import { cn } from '@/lib/utils'

const RECLAMO_KEY = 'lalupa:reclamo'
const WIZARD_KEY = 'lalupa:reclamo:wizard'

const EMPTY: ReclamoFormData = {
  tipoReclamo: '',
  nombre: '',
  rut: '',
  email: '',
  telefono: '',
  direccion: '',
  empresaRazonSocial: '',
  empresaRut: '',
  empresaDireccion: '',
  hechos: '',
  peticion: '',
}

const rutSchema = z
  .string()
  .min(1, 'Ingresá tu RUT')
  .refine(validateRut, 'RUT inválido (revisá el dígito verificador)')

const stepSchemas = {
  1: z.object({
    tipoReclamo: z
      .string()
      .min(1, 'Elige un tipo de reclamo')
      .refine((v) => (TIPOS_RECLAMO as readonly string[]).includes(v), 'Opción inválida'),
  }),
  2: z.object({
    nombre: z.string().min(2, 'Mínimo 2 caracteres').max(120),
    rut: rutSchema,
    email: z.string().email('Email inválido'),
    telefono: z
      .string()
      .min(8, 'Mínimo 8 dígitos')
      .max(20, 'Máximo 20 caracteres'),
    direccion: z.string().min(5, 'Ingresá una dirección postal'),
  }),
  3: z.object({
    empresaRazonSocial: z.string().min(2, 'Ingresá la razón social'),
    empresaRut: z
      .string()
      .min(1, 'Ingresá el RUT de la empresa')
      .refine(
        (v) => /^[\dkK.\-]+$/.test(v),
        'Solo dígitos, puntos y guion',
      ),
    empresaDireccion: z.string().min(5, 'Ingresá una dirección de notificación'),
  }),
  4: z.object({
    hechos: z
      .string()
      .min(100, 'Describí los hechos en al menos 100 caracteres'),
  }),
  5: z.object({
    peticion: z.string().min(20, 'Mínimo 20 caracteres'),
  }),
} as const

type StepNumber = 1 | 2 | 3 | 4 | 5

const STEPS: Array<{ n: StepNumber; label: string }> = [
  { n: 1, label: 'Tipo' },
  { n: 2, label: 'Tus datos' },
  { n: 3, label: 'Empresa' },
  { n: 4, label: 'Hechos' },
  { n: 5, label: 'Petición' },
]

interface PersistedState {
  step: StepNumber
  data: ReclamoFormData
}

function buildPrefill(payload: ReclamoBoletaPayload): Partial<ReclamoFormData> {
  const empresa = getEmpresa(payload.empresaSlug)
  return {
    tipoReclamo: 'Cobro indebido en boleta de servicios',
    empresaRazonSocial: empresa?.razonSocial ?? payload.empresaNombre,
    empresaRut: empresa?.rut ?? '',
    empresaDireccion: empresa?.direccion ?? '',
    hechos: buildHechosTemplate(payload),
    peticion: buildPeticionTemplate(payload),
  }
}

export function Wizard() {
  const [step, setStep] = useState<StepNumber>(1)
  const [data, setData] = useState<ReclamoFormData>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)
  const [pdfStatus, setPdfStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'generating' }
    | { kind: 'ready'; url: string; filename: string }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  )

  useEffect(() => {
    // Hidratación desde sessionStorage: el wizard preserva pasos previos
    // y/o pre-llena con datos del result-view anterior. One-shot en mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    const wizardRaw = sessionStorage.getItem(WIZARD_KEY)
    if (wizardRaw) {
      try {
        const parsed = JSON.parse(wizardRaw) as PersistedState
        if (parsed.data && typeof parsed.step === 'number') {
          setData({ ...EMPTY, ...parsed.data })
          setStep(parsed.step)
          setHydrated(true)
          return
        }
      } catch {
        // ignore corrupt state
      }
    }

    const reclamoRaw = sessionStorage.getItem(RECLAMO_KEY)
    if (reclamoRaw) {
      try {
        const payload = JSON.parse(reclamoRaw) as ReclamoBoletaPayload
        const prefill = buildPrefill(payload)
        setData((prev) => ({ ...prev, ...prefill }))
      } catch {
        // ignore
      }
    }
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => {
    if (!hydrated) return
    sessionStorage.setItem(
      WIZARD_KEY,
      JSON.stringify({ step, data } satisfies PersistedState),
    )
  }, [step, data, hydrated])

  function updateField<K extends keyof ReclamoFormData>(
    key: K,
    value: ReclamoFormData[K],
  ) {
    setData((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  function validateCurrentStep(): boolean {
    const schema = stepSchemas[step]
    const result = schema.safeParse(data)
    if (result.success) {
      setErrors({})
      return true
    }
    const next: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!next[field]) next[field] = issue.message
    }
    setErrors(next)
    return false
  }

  function validateAll(): boolean {
    const all = z.object({
      ...stepSchemas[1].shape,
      ...stepSchemas[2].shape,
      ...stepSchemas[3].shape,
      ...stepSchemas[4].shape,
      ...stepSchemas[5].shape,
    })
    const result = all.safeParse(data)
    if (result.success) return true
    const next: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      if (!next[field]) next[field] = issue.message
    }
    setErrors(next)
    return false
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      // Asegurar que el mensaje de error se ve y se anuncia con AT.
      // El componente Step{N} ya renderiza role="alert"; scrollamos
      // al inicio del paso para que el usuario vea el feedback aunque
      // hayan llegado al botón en mobile.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: window.scrollY, behavior: 'smooth' })
      }
      return
    }
    if (step < 5) setStep((s) => (s + 1) as StepNumber)
  }

  /**
   * El paso actual es válido (sin tocar setErrors). Sirve para deshabilitar
   * el botón "Siguiente" antes que el usuario lo apriete cuando aún
   * falta data crítica (ej. paso 1 sin tipoReclamo seleccionado).
   */
  function isCurrentStepValid(): boolean {
    const schema = stepSchemas[step]
    return schema.safeParse(data).success
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as StepNumber)
  }

  function handleRutBlur() {
    if (!data.rut) return
    const cleaned = normalizeRut(data.rut)
    if (validateRut(cleaned)) {
      updateField('rut', formatRut(cleaned))
    }
  }

  async function handleGeneratePdf() {
    if (!validateAll()) {
      const firstError = Object.keys(errors)[0]
      const fieldStep = stepForField(firstError)
      if (fieldStep) setStep(fieldStep)
      return
    }
    setPdfStatus({ kind: 'generating' })
    try {
      const blob = await buildLetterPdf(data)
      const url = URL.createObjectURL(blob)
      const filename = `reclamo-sernac-${new Date().toISOString().slice(0, 10)}.pdf`
      setPdfStatus({ kind: 'ready', url, filename })
    } catch (err) {
      setPdfStatus({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'Error al generar el PDF.',
      })
    }
  }

  async function handleCopyText() {
    if (!validateAll()) return
    try {
      const text = buildLetterText(data)
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2400)
    } catch {
      setCopyStatus('error')
    }
  }

  function handleReset() {
    sessionStorage.removeItem(WIZARD_KEY)
    setData(EMPTY)
    setStep(1)
    setErrors({})
    setPdfStatus({ kind: 'idle' })
  }

  return (
    <>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-soft">
            Reclamo SERNAC · Paso {step} de 5
          </p>
          <h1 className="mt-4 max-w-[20ch] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-tight text-ink">
            Carta de reclamo lista en 2 minutos.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-body">
            Generamos un PDF formal y un texto plano para que pegues en{' '}
            <a
              href="https://www.sernac.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              sernac.cl
            </a>
            . Todo se arma en tu navegador.
          </p>
          <Stepper current={step} />
        </Container>
      </section>

      <section className="bg-cream pb-16">
        <Container>
          <div className="rounded-[20px] border border-border bg-white p-6 md:p-8">
            {step === 1 && (
              <Step1
                value={data.tipoReclamo}
                onChange={(v) => updateField('tipoReclamo', v)}
                error={errors.tipoReclamo}
              />
            )}

            {step === 2 && (
              <Step2
                data={data}
                onChange={updateField}
                onRutBlur={handleRutBlur}
                errors={errors}
              />
            )}

            {step === 3 && (
              <Step3 data={data} onChange={updateField} errors={errors} />
            )}

            {step === 4 && (
              <Step4
                value={data.hechos}
                onChange={(v) => updateField('hechos', v)}
                error={errors.hechos}
              />
            )}

            {step === 5 && (
              <Step5
                value={data.peticion}
                onChange={(v) => updateField('peticion', v)}
                error={errors.peticion}
              />
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {step > 1 && (
                <Button variant="ghost" size="md" onClick={handleBack}>
                  Atrás
                </Button>
              )}
              {step < 5 && (
                <Button
                  variant="dark"
                  size="md"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                >
                  Siguiente
                </Button>
              )}
              {step === 5 && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGeneratePdf}
                    disabled={pdfStatus.kind === 'generating'}
                  >
                    {pdfStatus.kind === 'generating'
                      ? 'Generando…'
                      : 'Generar PDF'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleCopyText}
                  >
                    {copyStatus === 'copied'
                      ? 'Copiado ✓'
                      : copyStatus === 'error'
                        ? 'Error al copiar'
                        : 'Copiar texto plano'}
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="ml-auto text-xs uppercase tracking-wide text-soft hover:text-ink"
              >
                Empezar de nuevo
              </button>
            </div>

            {pdfStatus.kind === 'ready' && (
              <div className="mt-6">
                <Alert variant="success">
                  <Alert.Title>PDF listo</Alert.Title>
                  <Alert.Body>
                    Tu carta está armada.{' '}
                    <a
                      href={pdfStatus.url}
                      download={pdfStatus.filename}
                      className="font-medium text-success underline-offset-4 hover:underline"
                    >
                      Descargar {pdfStatus.filename}
                    </a>
                  </Alert.Body>
                </Alert>
              </div>
            )}

            {pdfStatus.kind === 'error' && (
              <div className="mt-6">
                <Alert variant="danger">
                  <Alert.Title>No pudimos generar el PDF</Alert.Title>
                  <Alert.Body>{pdfStatus.message}</Alert.Body>
                </Alert>
              </div>
            )}
          </div>

          <p className="mt-8 max-w-2xl text-xs text-soft">
            La carta se arma en tu navegador con `pdf-lib`. No subimos ni
            guardamos tus datos en ningún servidor. SERNAC, SEC y SISS son las
            entidades formales para tramitar el reclamo.{' '}
            <Link
              href="/boleta-luz"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              volver a la boleta
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  )
}

function stepForField(field: string): StepNumber | null {
  if (!field) return null
  if (field in stepSchemas[1].shape) return 1
  if (field in stepSchemas[2].shape) return 2
  if (field in stepSchemas[3].shape) return 3
  if (field in stepSchemas[4].shape) return 4
  if (field in stepSchemas[5].shape) return 5
  return null
}

function Stepper({ current }: { current: StepNumber }) {
  return (
    <ol className="mt-10 flex flex-wrap items-center gap-3">
      {STEPS.map(({ n, label }) => {
        const active = n === current
        const done = n < current
        return (
          <li key={n} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-medium',
                active && 'bg-ink text-cream',
                done && 'bg-primary text-cream',
                !active && !done && 'border border-ink/20 text-soft',
              )}
            >
              {n}
            </span>
            <span
              className={cn(
                'text-xs uppercase tracking-wide',
                active ? 'text-ink' : 'text-soft',
              )}
            >
              {label}
            </span>
            {n < STEPS.length && (
              <span aria-hidden className="ml-1 text-soft">
                ·
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Step1({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-ink">
        ¿Qué tipo de reclamo es?
      </h2>
      <p className="mt-2 text-body">
        Esto define la categoría de la mediación SERNAC.
      </p>
      <fieldset className="mt-6 flex flex-col gap-2">
        <legend className="sr-only">Tipo de reclamo</legend>
        {TIPOS_RECLAMO.map((opt) => (
          <label
            key={opt}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-white px-4 py-3 transition-colors hover:border-ink',
              value === opt && 'border-primary bg-primary-soft',
            )}
          >
            <input
              type="radio"
              name="tipoReclamo"
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-[15px] text-ink">{opt}</span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p className="mt-3 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function Step2({
  data,
  onChange,
  onRutBlur,
  errors,
}: {
  data: ReclamoFormData
  onChange: <K extends keyof ReclamoFormData>(
    key: K,
    value: ReclamoFormData[K],
  ) => void
  onRutBlur: () => void
  errors: Record<string, string>
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-ink">
        Tus datos
      </h2>
      <p className="mt-2 text-body">
        Necesarios para que SERNAC te ubique y la empresa pueda responder.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Nombre completo"
          value={data.nombre}
          onChange={(e) => onChange('nombre', e.target.value)}
          error={errors.nombre}
        />
        <Input
          label="RUT"
          value={data.rut}
          onChange={(e) => onChange('rut', e.target.value)}
          onBlur={onRutBlur}
          error={errors.rut}
          hint="Ej: 12.345.678-9"
        />
        <Input
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Teléfono"
          type="tel"
          value={data.telefono}
          onChange={(e) => onChange('telefono', e.target.value)}
          error={errors.telefono}
          hint="Con código de país si vives fuera"
        />
        <div className="md:col-span-2">
          <Input
            label="Dirección postal"
            value={data.direccion}
            onChange={(e) => onChange('direccion', e.target.value)}
            error={errors.direccion}
            hint="Calle, número, comuna y región"
          />
        </div>
      </div>
    </div>
  )
}

function Step3({
  data,
  onChange,
  errors,
}: {
  data: ReclamoFormData
  onChange: <K extends keyof ReclamoFormData>(
    key: K,
    value: ReclamoFormData[K],
  ) => void
  errors: Record<string, string>
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-ink">
        Empresa proveedora
      </h2>
      <p className="mt-2 text-body">
        Pre-rellenamos con los datos públicos de la empresa detectada en tu
        boleta. Puedes corregir si no calzan.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5">
        <Input
          label="Razón social"
          value={data.empresaRazonSocial}
          onChange={(e) => onChange('empresaRazonSocial', e.target.value)}
          error={errors.empresaRazonSocial}
        />
        <Input
          label="RUT empresa"
          value={data.empresaRut}
          onChange={(e) => onChange('empresaRut', e.target.value)}
          error={errors.empresaRut}
          hint="Formato chileno con dígito verificador"
        />
        <Input
          label="Dirección de notificación"
          value={data.empresaDireccion}
          onChange={(e) => onChange('empresaDireccion', e.target.value)}
          error={errors.empresaDireccion}
        />
      </div>
    </div>
  )
}

function Step4({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-ink">
        Hechos
      </h2>
      <p className="mt-2 text-body">
        Pre-armamos un texto base con los datos de tu boleta. Editalo si hace
        falta, es lo que SERNAC va a leer primero.
      </p>
      <Textarea
        value={value}
        onChange={onChange}
        rows={10}
        helper={`${value.trim().length} caracteres · mínimo 100`}
        error={error}
      />
    </div>
  )
}

function Step5({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-ink">
        Petición
      </h2>
      <p className="mt-2 text-body">
        Qué le pides a SERNAC y a la empresa.
      </p>
      <Textarea
        value={value}
        onChange={onChange}
        rows={8}
        helper={`${value.trim().length} caracteres · mínimo 20`}
        error={error}
      />
    </div>
  )
}

function Textarea({
  value,
  onChange,
  rows = 6,
  helper,
  error,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  helper?: string
  error?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="mt-6">
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full resize-vertical rounded-md border-[1.5px] border-border bg-white px-4 py-3 text-base leading-relaxed text-ink transition-colors',
          'placeholder:text-soft',
          'focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15',
          error && 'border-danger focus:border-danger focus:ring-danger/15',
        )}
      />
      {(helper || error) && (
        <p
          className={cn(
            'mt-1.5 text-[13px]',
            error ? 'text-danger' : 'text-soft',
          )}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  )
}
