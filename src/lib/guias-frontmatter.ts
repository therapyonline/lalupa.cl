import { z } from 'zod'

const text = z.string().trim().min(1)
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}, 'Fecha de calendario inválida')

const schema = z.object({
  title: text,
  slug: text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: text,
  ogTitle: text.optional(),
  publishedAt: date,
  updatedAt: date,
  category: z.enum(['luz', 'agua', 'gas', 'derechos', 'internet']),
  keywords: z.array(text),
  relatedTools: z.array(z.enum([
    '/boleta-luz', '/boleta-agua', '/boleta-gas', '/reclamar-sernac',
    '/subsidio-electrico', '/comparador-internet-hogar', '/tracker',
  ])).optional(),
  author: text.optional(),
  faqs: z.array(z.object({ q: text, a: text })).optional(),
  howTo: z.object({
    name: text,
    description: text,
    steps: z.array(z.object({ name: text, text })).min(1),
  }).optional(),
}).refine((data) => data.updatedAt >= data.publishedAt, {
  message: 'updatedAt no puede preceder a publishedAt', path: ['updatedAt'],
})

export function validateGuiaFrontmatter(data: unknown, filename: string) {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Guía inválida ${filename}: ${result.error.message}`)
  }
  if (`${result.data.slug}.mdx` !== filename) {
    throw new Error(`Guía inválida ${filename}: slug no coincide con el archivo`)
  }
  return result.data
}
