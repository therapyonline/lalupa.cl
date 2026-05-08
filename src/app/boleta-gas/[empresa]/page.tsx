import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResultViewGas } from './_components/result-view'

const VALID_SLUGS = new Set([
  'metrogas',
  'lipigas',
  'abastible',
  'gasco-glp',
])

export const metadata: Metadata = {
  title: 'Resultado boleta de gas',
  robots: { index: false, follow: false },
}

export default async function ResultadoGasPage({
  params,
}: {
  params: Promise<{ empresa: string }>
}) {
  const { empresa } = await params
  if (!VALID_SLUGS.has(empresa)) notFound()
  return <ResultViewGas empresaSlug={empresa} />
}
