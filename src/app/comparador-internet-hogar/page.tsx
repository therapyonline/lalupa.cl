import { JsonLd } from '@/components/JsonLd'
import { RelatedGuias } from '@/components/guias/RelatedGuias'
import {
  breadcrumbsSchema,
  buildMetadata,
  webApplicationSchema,
} from '@/lib/seo'
import { Comparador } from './_components/comparador'

export const metadata = buildMetadata({
  title: 'Comparador internet hogar 2026',
  description:
    'Comparador de planes de internet residencial en Chile: WOM, Movistar, Entel, Claro, VTR, Mundo y GTD. Filtros por velocidad, presupuesto y comuna.',
  path: '/comparador-internet-hogar',
  ogKind: 'tool',
  ogCategory: 'Internet',
  keywords: [
    'comparador internet hogar Chile',
    'mejor plan internet 2026',
    'fibra óptica Chile precio',
    'comparar Movistar Entel WOM',
  ],
})

export default function ComparadorInternetPage() {
  return (
    <main className="flex-1">
      <JsonLd
        schema={[
          webApplicationSchema({
            name: 'Comparador internet hogar',
            description:
              'Filtra planes de fibra y cable de las 7 principales empresas chilenas por velocidad, presupuesto y servicios.',
            path: '/comparador-internet-hogar',
          }),
          breadcrumbsSchema([
            { name: 'Inicio', href: '/' },
            {
              name: 'Comparador internet',
              href: '/comparador-internet-hogar',
            },
          ]),
        ]}
      />
      <Comparador />
      <RelatedGuias toolPath="/comparador-internet-hogar" />
    </main>
  )
}
