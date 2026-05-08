import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
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

export interface GuiaFrontmatter {
  title: string
  slug: string
  description: string
  publishedAt: string
  updatedAt: string
  category: CategoriaGuia
  keywords: string[]
  relatedTools?: string[]
  author?: string
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

function isFrontmatterComplete(fm: Partial<GuiaFrontmatter>): fm is GuiaFrontmatter {
  return Boolean(
    fm.title &&
      fm.slug &&
      fm.description &&
      fm.publishedAt &&
      fm.updatedAt &&
      fm.category &&
      Array.isArray(fm.keywords),
  )
}

async function readGuiaFile(filename: string) {
  const filePath = path.join(GUIAS_DIR, filename)
  const source = await fs.readFile(filePath, 'utf-8')
  const matter = (await import('gray-matter')).default
  const { data, content } = matter(source)
  return { source, data: data as Partial<GuiaFrontmatter>, content }
}

export async function getAllGuias(): Promise<GuiaMeta[]> {
  let files: string[] = []
  try {
    files = await fs.readdir(GUIAS_DIR)
  } catch {
    return []
  }
  const mdxFiles = files.filter((f) => f.endsWith('.mdx'))

  const metas = await Promise.all(
    mdxFiles.map(async (filename) => {
      try {
        const { data, content } = await readGuiaFile(filename)
        if (!isFrontmatterComplete(data)) return null
        return {
          ...data,
          readingTime: formatReadingTime(content),
        } satisfies GuiaMeta
      } catch {
        return null
      }
    }),
  )

  return metas
    .filter((g): g is GuiaMeta => g !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export interface GuiaCompiled {
  frontmatter: GuiaFrontmatter
  source: string
  toc: TocEntry[]
  readingTime: string
}

export async function getGuiaBySlug(slug: string): Promise<GuiaCompiled | null> {
  try {
    const { source, data, content } = await readGuiaFile(`${slug}.mdx`)
    if (!isFrontmatterComplete(data)) return null
    return {
      frontmatter: data,
      source,
      toc: extractToc(source),
      readingTime: formatReadingTime(content),
    }
  } catch {
    return null
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
  let files: string[] = []
  try {
    files = await fs.readdir(GUIAS_DIR)
  } catch {
    return []
  }
  return files.filter((f) => f.endsWith('.mdx')).map((f) => f.replace('.mdx', ''))
}
