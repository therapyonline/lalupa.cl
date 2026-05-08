import { describe, expect, it } from 'vitest'
import {
  type GuiaListItem,
  extractToc,
  filterGuiasForTool,
  formatReadingTime,
  pickRelatedGuias,
} from './guias-utils'

describe('formatReadingTime', () => {
  it('rounds up to a minimum of 1 minute', () => {
    expect(formatReadingTime('hola mundo')).toBe('1 min de lectura')
    expect(formatReadingTime('una palabra')).toBe('1 min de lectura')
  })

  it('counts words and divides by 220 wpm', () => {
    const text = Array.from({ length: 220 }, () => 'palabra').join(' ')
    expect(formatReadingTime(text)).toBe('1 min de lectura')
    const text2 = Array.from({ length: 440 }, () => 'palabra').join(' ')
    expect(formatReadingTime(text2)).toBe('2 min de lectura')
    const text3 = Array.from({ length: 660 }, () => 'palabra').join(' ')
    expect(formatReadingTime(text3)).toBe('3 min de lectura')
  })

  it('treats whitespace-only as a single word', () => {
    expect(formatReadingTime('   ')).toBe('1 min de lectura')
  })
})

describe('extractToc', () => {
  it('extracts h2 and h3 headings, skipping h1 and lower', () => {
    const md = `# H1 ignorado

## Una sección

contenido

### Subsección

contenido

#### H4 ignorado

## Otra sección`
    const toc = extractToc(md)
    expect(toc).toEqual([
      { level: 2, text: 'Una sección', slug: 'una-sección' },
      { level: 3, text: 'Subsección', slug: 'subsección' },
      { level: 2, text: 'Otra sección', slug: 'otra-sección' },
    ])
  })

  it('skips frontmatter blocks', () => {
    const md = `---
title: 'Título'
slug: 'x'
---

## Sección 1`
    const toc = extractToc(md)
    expect(toc).toEqual([
      { level: 2, text: 'Sección 1', slug: 'sección-1' },
    ])
  })

  it('skips fenced code blocks', () => {
    const md = `## Antes

\`\`\`ts
## Esto no es header
\`\`\`

## Después`
    const toc = extractToc(md)
    expect(toc.map((t) => t.text)).toEqual(['Antes', 'Después'])
  })

  it('strips inline markdown formatting', () => {
    const md = `## Sección con \`code\` y *énfasis*`
    const toc = extractToc(md)
    expect(toc[0].text).toBe('Sección con code y énfasis')
  })

  it('disambiguates duplicate slugs with -1, -2 suffixes', () => {
    const md = `## Repetida

## Repetida

## Repetida`
    const toc = extractToc(md)
    expect(toc.map((t) => t.slug)).toEqual([
      'repetida',
      'repetida-1',
      'repetida-2',
    ])
  })

  it('returns empty array for input with no h2/h3', () => {
    expect(extractToc('## Solo')).toHaveLength(1)
    expect(extractToc('contenido')).toEqual([])
    expect(extractToc('')).toEqual([])
  })
})

const GUIAS: GuiaListItem[] = [
  { slug: 'a', category: 'luz', relatedTools: ['/boleta-luz'] },
  { slug: 'b', category: 'luz', relatedTools: ['/boleta-luz', '/reclamar-sernac'] },
  { slug: 'c', category: 'luz' },
  { slug: 'd', category: 'agua', relatedTools: ['/boleta-agua'] },
  { slug: 'e', category: 'gas' },
  { slug: 'f', category: 'derechos', relatedTools: ['/reclamar-sernac'] },
]

describe('filterGuiasForTool', () => {
  it('returns guides whose relatedTools include the path', () => {
    const result = filterGuiasForTool(GUIAS, '/boleta-luz')
    expect(result.map((g) => g.slug)).toEqual(['a', 'b'])
  })

  it('returns empty when no guide references the tool', () => {
    expect(filterGuiasForTool(GUIAS, '/no-existe')).toEqual([])
  })

  it('handles guides without relatedTools field', () => {
    const result = filterGuiasForTool(GUIAS, '/reclamar-sernac')
    expect(result.map((g) => g.slug)).toEqual(['b', 'f'])
  })
})

describe('pickRelatedGuias', () => {
  it('puts same-category guides first when same-category covers the limit', () => {
    // limit=2; same-category has b, c (a excluded), exactly fits
    const result = pickRelatedGuias(GUIAS, 'a', 'luz', 2)
    expect(result.map((g) => g.slug)).toEqual(['b', 'c'])
  })

  it('fills with other-category guides when same-category is short of limit', () => {
    const result = pickRelatedGuias(GUIAS, 'a', 'luz', 5)
    expect(result).toHaveLength(5)
    expect(result.slice(0, 2).map((g) => g.slug)).toEqual(['b', 'c'])
    expect(result.slice(2).every((g) => g.category !== 'luz')).toBe(true)
  })

  it('respects the limit', () => {
    expect(pickRelatedGuias(GUIAS, 'a', 'luz', 1)).toHaveLength(1)
  })

  it('handles empty input', () => {
    expect(pickRelatedGuias([], 'x', 'luz')).toEqual([])
  })

  it('does not include the current slug', () => {
    const result = pickRelatedGuias(GUIAS, 'b', 'luz')
    expect(result.find((g) => g.slug === 'b')).toBeUndefined()
  })
})
