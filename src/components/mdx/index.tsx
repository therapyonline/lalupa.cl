import type { ComponentProps, ComponentType } from 'react'
import { JsonLd } from '@/components/JsonLd'
import { Alert } from '@/components/ui/Alert'
import { Pill } from '@/components/ui/Pill'
import { Callout } from './Callout'
import { DataPoint } from './DataPoint'
import { RelatedTool } from './RelatedTool'

/**
 * Envuelve cada `<table>` GFM en un contenedor con scroll horizontal.
 * Sin esto, las tablas de 4-5 columnas de las guías desbordan el viewport
 * en mobile (~380px) y empujan el layout de toda la página. Es el mismo
 * patrón que usa el tracker (overflow-x-auto + min-w). El estilo visual
 * (bordes, padding, header) vive en .prose-guia de globals.css.
 */
function MdxTable(props: ComponentProps<'table'>) {
  return (
    <div className="-mx-2 overflow-x-auto sm:mx-0">
      <table {...props} />
    </div>
  )
}

// Mapa de componentes que se inyectan al renderer de MDX. El tipo amplio
// `ComponentType<any>` evita instalar `@types/mdx` solo para tipar este
// objeto; funcionalmente es el mismo shape que `MDXComponents`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mdxComponents: Record<string, ComponentType<any>> = {
  Alert: Alert as ComponentType<unknown>,
  Pill: Pill as ComponentType<unknown>,
  Callout,
  RelatedTool,
  DataPoint,
  // JsonLd permite que cada guía agregue su propio FAQPage / HowTo /
  // VideoObject schema desde el MDX sin tocar la page template.
  JsonLd: JsonLd as ComponentType<unknown>,
  // Tablas GFM con scroll horizontal contenido (no rompen mobile).
  table: MdxTable as ComponentType<unknown>,
}

export { Alert, Callout, DataPoint, JsonLd, Pill, RelatedTool }
