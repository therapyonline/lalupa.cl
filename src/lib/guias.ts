import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import { validateGuiaFrontmatter } from './guias-frontmatter'
import {
  type CategoriaGuia,
  extractToc,
  filterGuiasForTool,
  formatReadingTime,
  pickRelatedGuias,
  type TocEntry,
} from './guias-utils'

export {
  extractToc,
  formatReadingTime,
  type CategoriaGuia,
  type TocEntry,
}

const GUIAS_DIR = path.join(process.cwd(), 'src', 'content', 'guias')

/** Preguntas visibles en la guía y representadas en JSON-LD. */
export interface GuiaFaqItem {
  q: string
  a: string
}

/** Pasos visibles en el MDX y representados en JSON-LD. */
export interface GuiaHowToStep {
  name: string
  text: string
}

export interface GuiaHowTo {
  name: string
  description: string
  steps: GuiaHowToStep[]
}

export interface GuiaFrontmatter {
  title: string
  slug: string
  description: string
  /** Override opcional del title para `og:title` (suele ser más punchy que el title de SEO). */
  ogTitle?: string
  publishedAt: string
  updatedAt: string
  category: CategoriaGuia
  keywords: string[]
  relatedTools?: string[]
  author?: string
  faqs?: GuiaFaqItem[]
  /** Datos estructurados, sin promesa de resultados enriquecidos. */
  howTo?: GuiaHowTo
}

export interface GuiaMeta extends GuiaFrontmatter {
  readingTime: string
}

export const TOOL_LABELS: Record<string, string> = {
  '/boleta-luz': 'Boleta de luz',
  '/boleta-agua': 'Boleta de agua',
  '/boleta-gas': 'Boleta de gas',
  '/reclamar-sernac': 'Reclamo SERNAC',
  '/subsidio-electrico': 'Subsidio eléctrico',
  '/comparador-internet-hogar': 'Comparador internet hogar',
  '/tracker': 'Tracker de boletas',
}

async function readGuiaFile(filename: string) {
  const filePath = path.join(GUIAS_DIR, filename)
  const source = await fs.readFile(filePath, 'utf-8')
  const matter = (await import('gray-matter')).default
  const { data, content } = matter(source)
  return { source, data: validateGuiaFrontmatter(data, filename), content }
}

export async function getAllGuias(): Promise<GuiaMeta[]> {
  const files = await fs.readdir(GUIAS_DIR)
  const metas = await Promise.all(
    files.filter((f) => f.endsWith('.mdx')).map(async (filename) => {
      const { data, content } = await readGuiaFile(filename)
      return { ...data, readingTime: formatReadingTime(content) } satisfies GuiaMeta
    }),
  )
  return metas.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export interface GuiaCompiled {
  frontmatter: GuiaFrontmatter
  source: string
  toc: TocEntry[]
  readingTime: string
}

export async function getGuiaBySlug(slug: string): Promise<GuiaCompiled | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  try {
    const { source, data, content } = await readGuiaFile(`${slug}.mdx`)
    return {
      frontmatter: data,
      source,
      toc: extractToc(source),
      readingTime: formatReadingTime(content),
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function getGuiasForTool(toolPath: string): Promise<GuiaMeta[]> {
  return filterGuiasForTool(await getAllGuias(), toolPath)
}

export async function getRelatedGuias(
  currentSlug: string,
  category: CategoriaGuia,
  limit = 3,
): Promise<GuiaMeta[]> {
  return pickRelatedGuias(await getAllGuias(), currentSlug, category, limit)
}

export async function getAllGuiaSlugs(): Promise<string[]> {
  return (await getAllGuias()).map((g) => g.slug)
}
