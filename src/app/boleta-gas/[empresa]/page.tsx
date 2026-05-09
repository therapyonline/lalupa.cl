import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResultViewGas } from './_components/result-view'

const VALID_SLUGS = new Set([
  'metrogas',
  'lipigas',
  'abastible',
  'gasco-glp',
])

export async function generateMetadata({
  params,
}: {
  params: Promise<{ empresa: string }>
}): Promise<Metadata> {
  const { empresa } = await params
  if (!VALID_SLUGS.has(empresa)) {
    return {
      title: 'Página no encontrada',
      robots: { index: false, follow: false },
      alternates: { canonical: '/boleta-gas' },
    }
  }
  return {
    title: 'Resultado boleta de gas',
    robots: { index: false, follow: false },
    alternates: { canonical: '/boleta-gas' },
  }
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
