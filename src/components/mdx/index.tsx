import type { ComponentType } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Pill } from '@/components/ui/Pill'
import { Callout } from './Callout'
import { DataPoint } from './DataPoint'
import { RelatedTool } from './RelatedTool'

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
}

export { Alert, Callout, DataPoint, Pill, RelatedTool }
