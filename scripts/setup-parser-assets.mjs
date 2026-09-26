#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const require = createRequire(import.meta.url)
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const spanishHash =
  '6cd52c545bceeacb2e43fad64fc0703a711c482ba20d1ca4b6915c09de9973e6'
const spanishUrl = 'https://tessdata.projectnaptha.com/4.0.0/spa.traineddata.gz'

async function atomicWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.${process.pid}.tmp`
  await writeFile(tmp, bytes)
  await rename(tmp, path)
}

async function spanishModel() {
  const cache = join(root, '.cache/parser-assets', `${spanishHash}.gz`)
  for (const path of [
    cache,
    join(root, 'public/tesseract/lang/spa.traineddata.gz'),
  ]) {
    try {
      const bytes = await readFile(path)
      if (digest(bytes) === spanishHash) {
        await atomicWrite(cache, bytes)
        return bytes
      }
    } catch {
      /* Descarga verificada si no existe una copia válida. */
    }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(spanishUrl, {
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok)
        throw new Error(`Modelo español: HTTP ${response.status}`)
      const reader = response.body.getReader()
      const chunks = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.length
        if (size > 12 * 1024 * 1024) {
          await reader.cancel()
          throw new Error('Modelo español excede tamaño esperado')
        }
        chunks.push(value)
      }
      const bytes = Buffer.concat(chunks)
      if (digest(bytes) !== spanishHash)
        throw new Error('SHA-256 del modelo español no coincide')
      await atomicWrite(cache, bytes)
      return bytes
    } catch (error) {
      if (attempt === 2) throw error
    }
  }
}

async function directoryFiles(base, folder) {
  return Promise.all(
    (await readdir(join(base, folder))).sort().map(async (name) => ({
      name: `${folder}/${name}`,
      bytes: await readFile(join(base, folder, name)),
    })),
  )
}

async function publish(prefix, files, versions) {
  files.sort((a, b) => a.name.localeCompare(b.name, 'en'))
  const inventory = files.map(({ name, bytes }) => ({
    name,
    bytes: bytes.length,
    sha256: digest(bytes),
  }))
  const hash = digest(JSON.stringify(inventory)).slice(0, 24)
  const base = `/parser-assets/${prefix}-${hash}`
  for (const { name, bytes } of files)
    await atomicWrite(join(root, 'public', base, name), bytes)
  return { base, versions, files: inventory }
}

const pdfPackage = require.resolve('pdfjs-dist/package.json')
const pdfRoot = dirname(pdfPackage)
const pdf = JSON.parse(await readFile(pdfPackage, 'utf8'))
const tessPackage = require.resolve('tesseract.js/package.json')
const tessRoot = dirname(tessPackage)
// Resuelve la dependencia efectivamente enlazada, no la primera copia de pnpm.
const corePackage = createRequire(tessPackage).resolve(
  'tesseract.js-core/package.json',
)
const coreRoot = dirname(corePackage)
const tess = JSON.parse(await readFile(tessPackage, 'utf8'))
const core = JSON.parse(await readFile(corePackage, 'utf8'))
const coreNames = (await readdir(coreRoot))
  .filter((name) => name.includes('lstm') && /\.(?:js|wasm)$/.test(name))
  .sort()
for (const name of [
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
]) {
  if (!coreNames.includes(name))
    throw new Error(`Falta core obligatorio: ${name}`)
}
const pdfFiles = [
  {
    name: 'pdf.worker.min.mjs',
    bytes: await readFile(join(pdfRoot, 'build/pdf.worker.min.mjs')),
  },
  { name: 'LICENSE', bytes: await readFile(join(pdfRoot, 'LICENSE')) },
  ...(await directoryFiles(pdfRoot, 'cmaps')),
  ...(await directoryFiles(pdfRoot, 'standard_fonts')),
  ...(await directoryFiles(pdfRoot, 'wasm')),
]
const ocrFiles = [
  {
    name: 'worker.min.js',
    bytes: await readFile(join(tessRoot, 'dist/worker.min.js')),
  },
  {
    name: 'LICENSE-tesseract',
    bytes: await readFile(join(tessRoot, 'LICENSE.md')),
  },
  { name: 'LICENSE-core', bytes: await readFile(join(coreRoot, 'LICENSE')) },
  { name: 'lang/spa.traineddata.gz', bytes: await spanishModel() },
  ...(await Promise.all(
    coreNames.map(async (name) => ({
      name: `core/${name}`,
      bytes: await readFile(join(coreRoot, name)),
    })),
  )),
]
const pdfAssets = await publish('pdf', pdfFiles, {
  pdfjs: pdf.version,
  license: pdf.license,
})
const ocrAssets = await publish('ocr', ocrFiles, {
  tesseract: tess.version,
  core: core.version,
  model: spanishHash,
  license: tess.license,
})
const assets = {
  pdfBase: pdfAssets.base,
  pdfWorker: `${pdfAssets.base}/pdf.worker.min.mjs`,
  ocrBase: ocrAssets.base,
}
await atomicWrite(
  join(root, 'src/generated/parser-assets.ts'),
  `// Generado por scripts/setup-parser-assets.mjs; no editar.\nexport const PARSER_ASSETS = ${JSON.stringify(assets, null, 2)} as const\n`,
)
const manifestPath = join(root, 'src/generated/parser-assets-manifest.json')
await atomicWrite(
  manifestPath,
  JSON.stringify({ pdf: pdfAssets, ocr: ocrAssets }, null, 2) + '\n',
)
console.log(
  `Recursos verificados: PDF.js ${pdf.version}, Tesseract ${tess.version}/${core.version}. ${relative(root, manifestPath)}`,
)
