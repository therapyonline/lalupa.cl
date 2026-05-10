#!/usr/bin/env node
/**
 * Lint de tono editorial: detecta voseo argentino y em-dashes.
 *
 * El proyecto usa tuteo chileno estándar (tú + verbos sin acento final
 * como imperativo: "Sube", "Prueba", "Elige"). Voseo argentino ("Subí",
 * "Probá", "Elegí", "vos") suena raro al usuario chileno y delata copy
 * generado por LLM con sesgo rioplatense.
 *
 * Em-dashes (—) son AI-tells: pegamos coma o paréntesis.
 *
 * Corre en CI y en local. Falla si encuentra ocurrencias en src/, no
 * cuenta tests, fixtures, ni `recibí` (que es válido en primera persona
 * en cartas formales: "Con fecha X recibí boleta...").
 *
 * Uso: node scripts/lint-tono.mjs
 *      node scripts/lint-tono.mjs --quiet  # solo exit code, sin output
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

// Lista de imperativos voseo más comunes en español rioplatense.
// Cada uno tiene su forma chilena (tuteo) en el comentario.
const VOSEO_IMPERATIVES = [
  'agregá', 'aceptá', 'abrí', 'adjuntá', 'andá', 'anotá', 'apretá', 'arrastrá', 'asegurá', 'asegurate',
  'borrá', 'borrame', 'buscá',
  'cambiá', 'cargá', 'chequeá', 'comunicate', 'completá', 'considerá', 'consultá', 'contactá', 'continuá',
  'copiá', 'cuestioná',
  'declará', 'denunciá', 'descargá', 'describí', 'detené',
  'editalo', 'editala', 'elegí', 'elegila', 'elegilo', 'enviá', 'escribí', 'escribime', 'esperá', 'exportá',
  'firmá', 'fijate', 'fíjate',
  'guardá', 'guardame',
  'hacé', 'hacelo',
  'imprimí', 'inscribite', 'iniciá', 'ingresá', 'intentá',
  'leélo', 'levantá', 'limpiá', 'llamá', 'llevá',
  'mandá', 'mirá', 'mostrame',
  'pegá', 'pedí', 'preferilo', 'preguntá', 'preparate', 'prepará', 'presioná', 'probá', 'probalo',
  'reclamá', 'recordá', 'regularizá', 'registrá', 'reportá', 'respaldate', 'revisá',
  'sacale', 'seguí', 'sentate', 'subí', 'subila', 'subilo', 'sumá', 'sumalo', 'sumale',
  'tené', 'tenelo', 'teneme', 'tomá', 'traé',
  'usá', 'usalo',
  'verificá', 'verifiqué',
]

// Verbos voseo en presente indicativo (2da persona).
const VOSEO_INDICATIVE = [
  'querés', 'tenés', 'sabés', 'podés', 'debés', 'salís', 'venís', 'sentís', 'preferís',
  'elegís', 'seguís', 'conocés', 'leés', 'comés', 'escribís', 'hacés', 'tirás', 'empezás',
  'terminás', 'pensás', 'necesitás', 'encontrás', 'reclamás', 'sos',
]

// Patrón final: pronombre "vos" + todos los verbos.
const PATTERNS = [
  ...VOSEO_IMPERATIVES,
  ...VOSEO_INDICATIVE,
  'vos', // pronombre rioplatense
]

// Excepción: "recibí" es válido en primera persona pasado ("yo recibí")
// y aparece en plantillas de carta SERNAC. NO incluido en PATTERNS.

// Em-dashes (U+2014) y guillemets (U+00AB / U+00BB) son AI-tells.
const FORBIDDEN_CHARS = [
  { char: '—', name: 'em-dash', alt: 'usa coma o paréntesis' },
  { char: '«', name: 'guillemet apertura', alt: 'usa comilla curly "' },
  { char: '»', name: 'guillemet cierre', alt: 'usa comilla curly "' },
]

// Construir regex agrupando para una sola pasada por archivo.
//
// `\b` en JS regex se basa en \w (ASCII), lo que produce falsos
// positivos en palabras con letras tildadas: "usándose" matchea "usá"
// porque después de "á" hay un `\b` (la "á" no es \w pero "n" sí es).
//
// Solución: lookbehind/lookahead que excluyan letras del español
// completo (incluyendo tildes y ñ) en ambos lados.
const SPANISH_LETTER = '[A-Za-zÁÉÍÓÚÑáéíóúñ]'
const escapedPatterns = PATTERNS.map(
  (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
).join('|')
const VOSEO_REGEX = new RegExp(
  `(?<!${SPANISH_LETTER})(${escapedPatterns})(?!${SPANISH_LETTER})`,
  'g',
)

function listFiles() {
  // Files versionados: solo lo que está en git para evitar caches y node_modules.
  const out = execSync(
    'git ls-files src/',
    { cwd: ROOT, encoding: 'utf8' },
  )
  return out
    .trim()
    .split('\n')
    .filter((f) => /\.(ts|tsx|mdx|md|json)$/.test(f))
    .filter((f) => !/(test|spec|fixture|__tests__|__fixtures__)/.test(f))
}

function lintFile(relPath) {
  const fullPath = resolve(ROOT, relPath)
  const content = readFileSync(fullPath, 'utf8')
  const findings = []

  // Voseo
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let m
    VOSEO_REGEX.lastIndex = 0
    while ((m = VOSEO_REGEX.exec(line)) !== null) {
      findings.push({
        file: relPath,
        line: i + 1,
        col: m.index + 1,
        match: m[0],
        kind: 'voseo',
      })
    }
  }

  // Em-dashes y guillemets. Opt-out explícito en dos formas:
  //   - `lint-tono-disable-line` en la MISMA línea
  //   - `lint-tono-disable-next-line` en la línea ANTERIOR
  // Útil para em-dash funcional dentro de character class de regex
  // (matcheo de separadores OCR), donde no es copy editorial.
  for (const { char, name } of FORBIDDEN_CHARS) {
    let searchFrom = 0
    while (true) {
      const idx = content.indexOf(char, searchFrom)
      if (idx === -1) break
      let line = 1
      let lastNl = -1
      for (let i = 0; i < idx; i++) {
        if (content[i] === '\n') { line++; lastNl = i }
      }
      const sameLine = lines[line - 1] ?? ''
      const prevLine = lines[line - 2] ?? ''
      const disabled =
        sameLine.includes('lint-tono-disable-line') ||
        prevLine.includes('lint-tono-disable-next-line')
      if (!disabled) {
        findings.push({
          file: relPath,
          line,
          col: idx - lastNl,
          match: char,
          kind: name,
        })
      }
      searchFrom = idx + 1
    }
  }

  return findings
}

const quiet = process.argv.includes('--quiet')
const files = listFiles()
const allFindings = []
for (const f of files) {
  allFindings.push(...lintFile(f))
}

if (allFindings.length === 0) {
  if (!quiet) {
    console.log(`✓ Lint tono OK (${files.length} archivos revisados)`)
  }
  process.exit(0)
}

if (!quiet) {
  console.error(`✗ Lint tono encontró ${allFindings.length} ocurrencias:`)
  console.error('')
  for (const f of allFindings) {
    console.error(
      `  ${f.file}:${f.line}:${f.col}  [${f.kind}]  "${f.match}"`,
    )
  }
  console.error('')
  console.error('  Voseo argentino → tuteo chileno (Subí→Sube, Probá→Prueba, vos→tú).')
  console.error('  Em-dashes (—) → coma o paréntesis. Guillemets («») → comillas curly.')
}
process.exit(1)
