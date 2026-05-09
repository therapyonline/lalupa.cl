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

/**
 * Metadata dinámica: si el slug es inválido devolvemos un title acorde
 * a "no encontrado" así el 404 fallback no hereda "Resultado".
 */
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
      alternates: { canonical: '/boleta-luz' },
    }
  }
  return {
    title: 'Resultado',
    robots: { index: false, follow: false },
    // Canonical apunta a la ruta indexable padre (/boleta-luz) en lugar
    // del default de layout (/) — más semánticamente correcto aunque la
    // página sea noindex.
    alternates: { canonical: '/boleta-luz' },
  }
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
