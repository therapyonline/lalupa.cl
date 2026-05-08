import { buildMetadata } from '@/lib/seo'
import { Tracker } from './_components/tracker'

export const metadata = buildMetadata({
  title: 'Tracker',
  description:
    'Lleva tu histórico mensual de boletas básicas. Todo guardado en tu propio celular, nada en servidores.',
  path: '/tracker',
  ogKind: 'tool',
  noindex: true,
})

export default function TrackerPage() {
  return <Tracker />
}
