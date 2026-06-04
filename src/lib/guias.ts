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

/**
 * Una pregunta-respuesta del bloque FAQPage al final de una guía.
 * Se renderiza como sección visible en el body de la página Y como
 * structured data JSON-LD para que Google muestre rich results.
 */
export interface GuiaFaqItem {
  q: string
  a: string
}

/**
 * Un paso del bloque HowTo. Los steps se exponen como JSON-LD para
 * Google Rich Results. El contenido visible vive en el MDX como una
 * lista normal; este array es solo el espejo estructurado para SEO.
 */
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
  /**
   * Lista opcional de Q&A. Si está presente, la página genera
   * automáticamente FAQPage JSON-LD para rich results en Google.
   * NOTA: el contenido visible de las FAQ todavía vive en el MDX
   * dentro de un H2 "Preguntas frecuentes"; este array es solo el
   * espejo estructurado para SEO.
   */
  faqs?: GuiaFaqItem[]
  /**
   * Bloque HowTo opcional. Si está presente, la página genera HowTo
   * JSON-LD para rich results de instrucciones paso a paso. El
   * contenido visible vive en el MDX; este objeto es el espejo
   * estructurado.
   */
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
