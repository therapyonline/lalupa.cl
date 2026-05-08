import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResultView } from './_components/result-view'

const VALID_SLUGS = new Set([
  'cge',
  'enel',
  'saesa',
  'frontel',
  'chilquinta',
])

export const metadata: Metadata = {
  title: 'Resultado',
  robots: { index: false, follow: false },
}

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ empresa: string }>
}) {
  const { empresa } = await params
  if (!VALID_SLUGS.has(empresa)) notFound()
  return <ResultView empresaSlug={empresa} />
}
