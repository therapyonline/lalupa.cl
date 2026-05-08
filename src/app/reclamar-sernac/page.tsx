import { JsonLd } from '@/components/JsonLd'
import { RelatedGuias } from '@/components/guias/RelatedGuias'
import {
  breadcrumbsSchema,
  buildMetadata,
  webApplicationSchema,
} from '@/lib/seo'
import { Wizard } from './_components/wizard'

export const metadata = buildMetadata({
  title: 'Reclamar a SERNAC',
  description:
    'Wizard de 5 preguntas → carta legal lista para enviar. Plantillas validadas según el tipo de empresa, exportable como PDF o texto plano.',
  path: '/reclamar-sernac',
  ogKind: 'tool',
  ogCategory: 'Reclamo',
  keywords: [
    'reclamar a SERNAC',
    'carta reclamo SERNAC plantilla',
    'cobro indebido empresa Chile',
    'mediación SERNAC servicios básicos',
  ],
})

export default function ReclamarSernacPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Generador de reclamo SERNAC',
            description:
              'Wizard de 5 pasos que arma una carta de reclamo formal en PDF lista para presentar en SERNAC.',
            path: '/reclamar-sernac',
          }),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Reclamar a SERNAC', href: '/reclamar-sernac' },
          ]),
        ]}
      />
      <Wizard />
      <RelatedGuias toolPath="/reclamar-sernac" />
    </main>
  )
}
