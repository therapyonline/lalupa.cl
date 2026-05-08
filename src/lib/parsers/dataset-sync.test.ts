/**
 * Test sistémico: cada parser cuya empresa esté **verificada** en
 * `EMPRESAS_SERVICIOS` debe incluir el RUT exacto en su fingerprint.
 *
 * Esto detecta drift entre `src/data/empresas.ts` (fuente de verdad
 * de identidad legal) y los parsers, si alguien actualiza el RUT
 * en empresas.ts pero olvida tocar el parser, este test falla.
 *
 * Empresas con `rut === 'PENDIENTE'` se excluyen porque no tenemos
 * verificación para imponerles esa restricción todavía.
 */

import { describe, expect, it } from 'vitest'
import { EMPRESAS_SERVICIOS } from '@/data/empresas'
import { listParsers } from './registry'
import './engine' // side-effect: registra todos los parsers

/** Mapeo de id en empresas.ts → nombre `empresa` en el parser. */
const EMPRESA_ID_TO_PARSER_NAME: Record<string, string> = {
  cge: 'CGE',
  enel: 'Enel',
  chilquinta: 'Chilquinta',
  saesa: 'SAESA',
  frontel: 'Frontel',
  'aguas-andinas': 'Aguas Andinas',
  esval: 'Esval',
  essbio: 'ESSBio',
  nuevosur: 'Nuevosur',
  smapa: 'SMAPA',
  metrogas: 'Metrogas',
  lipigas: 'Lipigas',
  abastible: 'Abastible',
  'gasco-glp': 'Gasco GLP',
}

describe('parsers ↔ EMPRESAS_SERVICIOS', () => {
  const parsers = listParsers()
  const eligibles = EMPRESAS_SERVICIOS.filter(
    (e) =>
      EMPRESA_ID_TO_PARSER_NAME[e.id] &&
      e.rut !== 'PENDIENTE' &&
      !e.rut.startsWith('No aplica'),
  )

  it('cubre todas las empresas con parser registrado', () => {
    for (const empresa of eligibles) {
      const parserName = EMPRESA_ID_TO_PARSER_NAME[empresa.id]
      const parser = parsers.find((p) => p.empresa === parserName)
      expect(parser, `falta parser para ${empresa.id}`).toBeDefined()
    }
  })

  for (const empresa of EMPRESAS_SERVICIOS.filter(
    (e) =>
      EMPRESA_ID_TO_PARSER_NAME[e.id] &&
      e.rut !== 'PENDIENTE' &&
      !e.rut.startsWith('No aplica'),
  )) {
    const parserName = EMPRESA_ID_TO_PARSER_NAME[empresa.id]
    it(`${empresa.id}: el parser declara el RUT ${empresa.rut} en sus keywords`, () => {
      const parser = parsers.find((p) => p.empresa === parserName)
      expect(parser).toBeDefined()
      expect(parser!.fingerprint.keywords).toContain(empresa.rut)
    })
  }
})
