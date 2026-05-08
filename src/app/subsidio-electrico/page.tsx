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
    '13 preguntas → te decimos si calificas al subsidio Ley 21.667 y cómo postular. Quinta convocatoria vigente.',
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
              'Wizard de 13 preguntas que evalúa si tu hogar califica al Subsidio Eléctrico Ley 21.667 antes de postular en subsidioelectrico.cl.',
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
