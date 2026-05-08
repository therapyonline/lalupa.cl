#!/usr/bin/env node
/**
 * Bundle size budget guard.
 *
 * Mide el tamaño total de los chunks JS de Next y falla si excede el
 * budget. Se corre en CI después de `next build`. Si el bundle crece
 * mucho, este script bloquea el merge y obliga a investigar la causa.
 *
 * Configurable via env:
 *   - BUDGET_KB_TOTAL (default 3500)  — total chunks/JS
 *   - BUDGET_KB_FIRST (default 600)   — single largest chunk
 *
 * Excluye:
 *   - tesseract worker / core (servidos desde /tesseract/, no son entry de la app)
 *   - pdf.worker.min.mjs (servido desde /, no es entry de la app)
 */

import { stat, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CHUNKS_DIR = join(ROOT, '.next', 'static', 'chunks')

const BUDGET_KB_TOTAL = Number(process.env.BUDGET_KB_TOTAL ?? 3500)
const BUDGET_KB_FIRST = Number(process.env.BUDGET_KB_FIRST ?? 600)

async function* walkJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      yield* walkJsFiles(full)
    } else if (e.name.endsWith('.js')) {
      yield full
    }
  }
}

async function main() {
  let totalBytes = 0
  let largestBytes = 0
  let largestPath = ''
  let count = 0

  try {
    for await (const file of walkJsFiles(CHUNKS_DIR)) {
      const s = await stat(file)
      totalBytes += s.size
      count += 1
      if (s.size > largestBytes) {
        largestBytes = s.size
        largestPath = file.replace(ROOT + '/', '')
      }
    }
  } catch (err) {
    console.error('No pude leer .next/static/chunks. Corré `next build` primero.')
    console.error(err)
    process.exit(1)
  }

  const totalKb = Math.round(totalBytes / 1024)
  const largestKb = Math.round(largestBytes / 1024)

  console.log(`\n📦 Bundle size report`)
  console.log(`   Total JS chunks:  ${count} archivos, ${totalKb} kB`)
  console.log(`   Largest chunk:    ${largestKb} kB → ${largestPath}`)
  console.log(`   Budget total:     ${BUDGET_KB_TOTAL} kB`)
  console.log(`   Budget largest:   ${BUDGET_KB_FIRST} kB`)

  let failed = false
  if (totalKb > BUDGET_KB_TOTAL) {
    console.error(
      `\n❌ Total bundle (${totalKb} kB) excede budget (${BUDGET_KB_TOTAL} kB).`,
    )
    failed = true
  }
  if (largestKb > BUDGET_KB_FIRST) {
    console.error(
      `\n❌ Chunk más grande (${largestKb} kB) excede budget (${BUDGET_KB_FIRST} kB): ${largestPath}`,
    )
    failed = true
  }
  if (failed) {
    console.error(
      `\nSi el aumento es justificado, ajustá los budgets en CI o pasá BUDGET_KB_TOTAL/BUDGET_KB_FIRST como env.`,
    )
    process.exit(1)
  }
  console.log(`\n✓ Within budget`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
