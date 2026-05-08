#!/usr/bin/env node
/**
 * Copia los assets de tesseract.js a public/tesseract/ para que el OCR
 * cargue 100% desde el mismo origen que el sitio.
 *
 * Resultados:
 *   public/tesseract/worker.min.js
 *   public/tesseract/core/tesseract-core-*.js + .wasm
 *   public/tesseract/lang/spa.traineddata.gz   (descargado si falta)
 *
 * Idempotente: salta si los archivos ya existen.
 */

import { mkdir, copyFile, access, writeFile, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC_DIR = join(ROOT, 'public', 'tesseract')

const WORKER_SRC = join(
  ROOT,
  'node_modules',
  'tesseract.js',
  'dist',
  'worker.min.js',
)
const TRAINEDDATA_URL =
  'https://tessdata.projectnaptha.com/4.0.0/spa.traineddata.gz'

/**
 * Resuelve el directorio de tesseract.js-core de manera version-agnostic.
 * Busca en node_modules/.pnpm/tesseract.js-core@<x.y.z>/node_modules/tesseract.js-core
 * para no romperse cuando pnpm bumpea la versión transitiva.
 */
async function resolveCoreSrcDir() {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm')
  if (!(await exists(pnpmDir))) return null
  const entries = await readdir(pnpmDir)
  const match = entries.find((e) => /^tesseract\.js-core@/.test(e))
  if (!match) return null
  return join(pnpmDir, match, 'node_modules', 'tesseract.js-core')
}

async function exists(p) {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function copyIfMissing(src, dest) {
  if (await exists(dest)) return false
  await mkdir(dirname(dest), { recursive: true })
  await copyFile(src, dest)
  return true
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true })
  await mkdir(join(PUBLIC_DIR, 'core'), { recursive: true })
  await mkdir(join(PUBLIC_DIR, 'lang'), { recursive: true })

  // 1. Worker
  if (!(await exists(WORKER_SRC))) {
    console.error(
      'tesseract.js no está instalado — saltando setup (postinstall en pnpm install).',
    )
    return
  }
  const copiedWorker = await copyIfMissing(
    WORKER_SRC,
    join(PUBLIC_DIR, 'worker.min.js'),
  )
  if (copiedWorker) console.log('· worker.min.js copiado')

  // 2. Core (todas las variantes — tesseract.js elige la mejor en runtime)
  const coreSrcDir = await resolveCoreSrcDir()
  if (coreSrcDir && (await exists(coreSrcDir))) {
    const files = await readdir(coreSrcDir)
    // Solo LSTM (oem: 1). tesseract.js elige la variante en runtime según
    // soporte SIMD del navegador.
    const wanted = files.filter(
      (f) =>
        f.includes('lstm') &&
        (f.endsWith('.js') || f.endsWith('.wasm')),
    )
    let coreCopied = 0
    for (const f of wanted) {
      const did = await copyIfMissing(
        join(coreSrcDir, f),
        join(PUBLIC_DIR, 'core', f),
      )
      if (did) coreCopied += 1
    }
    if (coreCopied > 0)
      console.log(`· core: ${coreCopied} archivos copiados (${wanted.length} totales)`)
  } else {
    console.error(
      'tesseract.js-core no encontrado bajo node_modules/.pnpm/tesseract.js-core@*/ — saltando core.',
    )
  }

  // 3. Modelo de español (descarga única)
  const langDest = join(PUBLIC_DIR, 'lang', 'spa.traineddata.gz')
  if (await exists(langDest)) {
    console.log('· spa.traineddata.gz ya presente — skip download')
  } else {
    console.log(`· descargando spa.traineddata.gz desde ${TRAINEDDATA_URL}…`)
    try {
      const res = await fetch(TRAINEDDATA_URL)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(langDest, buf)
      console.log(`· spa.traineddata.gz descargado (${buf.length} bytes)`)
    } catch (err) {
      console.error(
        `! No pudimos descargar el modelo de español. El OCR caerá al CDN público.`,
        err instanceof Error ? err.message : err,
      )
    }
  }

  console.log('Setup tesseract listo.')
}

main().catch((err) => {
  console.error('Setup tesseract falló:', err)
  process.exitCode = 1
})
