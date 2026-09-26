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

const EDITORIAL_RELATED: Record<string, string[]> = {
  'gas-red-vs-cilindro-cual-conviene': [
    'calefont-gas-elegir-potencia-ahorrar',
    'reclamar-cobro-indebido-paso-a-paso',
    'derechos-consumidor-chile-servicios-basicos',
  ],
  'como-leer-boleta-cge': [
    'por-que-subio-mi-cuenta-de-luz',
    'lectura-estimada-medidor-luz-cuando-es-legal',
    'tarifa-bt1-vs-bt2-cual-conviene',
  ],
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
 * Prefers editorial selection, then category, then remaining guides.
 */
export function pickRelatedGuias<T extends GuiaListItem>(
  all: T[],
  currentSlug: string,
  category: CategoriaGuia,
  limit = 3,
): T[] {
  const curated = (EDITORIAL_RELATED[currentSlug] ?? []).flatMap((slug) =>
    all.filter((g) => g.slug === slug && g.slug !== currentSlug),
  )
  const sameCategory = all.filter(
    (g) => g.slug !== currentSlug && g.category === category,
  )
  const others = all.filter(
    (g) => g.slug !== currentSlug && g.category !== category,
  )
  const seen = new Set<string>()
  return [...curated, ...sameCategory, ...others].filter((g) => {
    if (seen.has(g.slug)) return false
    seen.add(g.slug)
    return true
  }).slice(0, limit)
}

export function formatReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min de lectura`
}

const FAQ_HEADING_REGEX = /preguntas\s+frecuentes|^faq\b/i

export function extractToc(source: string): TocEntry[] {
  const slugger = new GithubSlugger()
  const lines = source.split('\n')
  const toc: TocEntry[] = []
  let inFrontmatter = false
  let inFence = false
  // Dentro de la sección "Preguntas frecuentes" los ### son preguntas
  // (a veces 8 o más) que saturan el TOC y le quitan su función de mapa.
  // Mantenemos el H2 de la sección como ancla pero omitimos sus H3.
  let inFaq = false

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
      if (level === 2) {
        inFaq = FAQ_HEADING_REGEX.test(text)
      } else if (inFaq) {
        // H3 dentro de la sección FAQ: omitir del TOC.
        continue
      }
      toc.push({ level, text, slug: slugger.slug(text) })
    }
  }
  return toc
}
