import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResultViewAgua } from './_components/result-view'

const VALID_SLUGS = new Set([
  'aguas-andinas',
  'esval',
  'essbio',
  'nuevosur',
  'smapa',
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
      alternates: { canonical: '/boleta-agua' },
    }
  }
  return {
    title: 'Resultado boleta de agua',
    robots: { index: false, follow: false },
    alternates: { canonical: '/boleta-agua' },
  }
}

export default async function ResultadoAguaPage({
  params,
}: {
  params: Promise<{ empresa: string }>
}) {
  const { empresa } = await params
  if (!VALID_SLUGS.has(empresa)) notFound()
  return <ResultViewAgua empresaSlug={empresa} />
}
