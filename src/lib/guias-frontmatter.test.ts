import { readdirSync, readFileSync } from 'node:fs'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { validateGuiaFrontmatter } from './guias-frontmatter'

const valid = { title: 'Guía', slug: 'prueba', description: 'Descripción',
  publishedAt: '2026-05-01', updatedAt: '2026-09-25', category: 'luz', keywords: [] }

describe('publicación de guías', () => {
  it('valida todos los documentos reales antes de construir el sitemap', () => {
    const dir = 'src/content/guias'
    for (const filename of readdirSync(dir).filter((file) => file.endsWith('.mdx'))) {
      expect(() => validateGuiaFrontmatter(matter(readFileSync(`${dir}/${filename}`, 'utf8')).data, filename)).not.toThrow()
    }
  })
  it.each([
    { category: 'otro' }, { updatedAt: '2026-02-31' }, { updatedAt: '2025-01-01' },
    { relatedTools: ['/ruta-inexistente'] }, { faqs: [{ q: 'Pregunta' }] },
  ])('impide publicar metadatos inválidos: %j', (patch) => {
    expect(() => validateGuiaFrontmatter({ ...valid, ...patch }, 'prueba.mdx')).toThrow('Guía inválida')
  })
  it('rechaza URL distinta del nombre de archivo', () => {
    expect(() => validateGuiaFrontmatter(valid, 'otra.mdx')).toThrow('slug')
  })
})
