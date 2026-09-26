import { JsonLd } from '@/components/JsonLd'
import { RelatedGuias } from '@/components/guias/RelatedGuias'
import {
  breadcrumbsSchema,
  buildMetadata,
  webApplicationSchema,
} from '@/lib/seo'
import { SubsidioWizard } from './_components/wizard'

export const metadata = buildMetadata({
  title: 'Subsidio eléctrico 2026',
  description:
    'La quinta postulación de 2026 cerró. Revisa sus requisitos y montos de referencia, y consulta el resultado oficial del Subsidio Eléctrico.',
  path: '/subsidio-electrico',
  ogKind: 'tool',
  ogCategory: 'Subsidio',
  keywords: [
    'subsidio eléctrico 2026',
    'Ley 21.667 requisitos',
    'subsidio luz Chile',
    'cómo postular subsidio eléctrico',
  ],
})

export default function SubsidioElectricoPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Calculadora subsidio eléctrico',
            description:
              'Orientación sobre los requisitos de la quinta convocatoria cerrada, con montos de referencia y acceso a la consulta oficial. No acredita adjudicación.',
            path: '/subsidio-electrico',
          }),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            { name: 'Subsidio eléctrico', href: '/subsidio-electrico' },
          ]),
        ]}
      />
      <SubsidioWizard />
      <RelatedGuias toolPath="/subsidio-electrico" />
    </main>
  )
}
