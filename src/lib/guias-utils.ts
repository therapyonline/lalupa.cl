import GithubSlugger from 'github-slugger'

export type CategoriaGuia = 'luz' | 'agua' | 'gas' | 'derechos' | 'internet'

export interface GuiaListItem {
  slug: string
  category: CategoriaGuia
  relatedTools?: string[]
}

export interface TocEntry {
  level: 2 | 3
  text: string
  slug: string
}

/** Pure: filter a guide list to those matching the given tool path. */
export function filterGuiasForTool<T extends GuiaListItem>(
  all: T[],
  toolPath: string,
): T[] {
  return all.filter((g) => (g.relatedTools ?? []).includes(toolPath))
}

/**
 * Pure: pick guides related to the given (currentSlug, category).
 * Prefers same-category, falls back to other categories if short of `limit`.
 */
export function pickRelatedGuias<T extends GuiaListItem>(
  all: T[],
  currentSlug: string,
  category: CategoriaGuia,
  limit = 3,
): T[] {
  const sameCategory = all.filter(
    (g) => g.slug !== currentSlug && g.category === category,
  )
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)
  const others = all.filter(
    (g) => g.slug !== currentSlug && g.category !== category,
  )
  return [...sameCategory, ...others].slice(0, limit)
}

export function formatReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min de lectura`
}

export function extractToc(source: string): TocEntry[] {
  const slugger = new GithubSlugger()
  const lines = source.split('\n')
  const toc: TocEntry[] = []
  let inFrontmatter = false
  let inFence = false

  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }
    if (inFrontmatter) continue

    if (line.trim().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.match(/^(#{2,3})\s+(.+?)\s*$/)
    if (match) {
      const level = match[1].length as 2 | 3
      const text = match[2].replace(/[*_`]/g, '').trim()
      toc.push({ level, text, slug: slugger.slug(text) })
    }
  }
  return toc
}
