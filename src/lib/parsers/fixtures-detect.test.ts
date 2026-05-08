/**
 * Test cross-cutting: cada fixture real debe ser detectado por
 * su parser correspondiente vía `detectParser`.
 *
 * Si alguien actualiza un fixture (nueva versión de boleta) o cambia
 * el formato de keywords/regex de un parser, este test falla y avisa
 * que la cascada de detección se rompió.
 */

import { describe, expect, it } from 'vitest'
import { ENEL_REAL_2024_06 } from './__fixtures__/enel-real-2024-06'
import { SAESA_REAL_2024_09 } from './__fixtures__/saesa-real-2024-09'
import { FRONTEL_REAL_2022_09 } from './__fixtures__/frontel-real-2022-09'
import { CHILQUINTA_REAL_2023_07 } from './__fixtures__/chilquinta-real-2023-07'
import { AGUASANDINAS_REAL_2026_03 } from './__fixtures__/aguasandinas-real-2026-03'
import { ESVAL_REAL_2021_04 } from './__fixtures__/esval-real-2021-04'
import { ESSBIO_REAL_2021_10 } from './__fixtures__/essbio-real-2021-10'
import { NUEVOSUR_REAL_2021_10 } from './__fixtures__/nuevosur-real-2021-10'
import { SMAPA_REAL_2025_10 } from './__fixtures__/smapa-real-2025-10'
import { METROGAS_REAL_2025_08 } from './__fixtures__/metrogas-real-2025-08'
import { LIPIGAS_REAL_2021_08 } from './__fixtures__/lipigas-real-2021-08'
import { GASCO_REAL_2024_06 } from './__fixtures__/gasco-real-2024-06'
import { ABASTIBLE_REAL_2022_06 } from './__fixtures__/abastible-real-2022-06'
import { detectParser } from './registry'
import './engine' // side-effect: registra todos los parsers

interface Case {
  name: string
  fixture: string
  expectedEmpresa: string
  expectedServicio: 'electricidad' | 'agua' | 'gas'
}

const CASES: Case[] = [
  {
    name: 'Enel',
    fixture: ENEL_REAL_2024_06,
    expectedEmpresa: 'Enel',
    expectedServicio: 'electricidad',
  },
  {
    name: 'SAESA',
    fixture: SAESA_REAL_2024_09,
    expectedEmpresa: 'SAESA',
    expectedServicio: 'electricidad',
  },
  {
    name: 'Frontel',
    fixture: FRONTEL_REAL_2022_09,
    expectedEmpresa: 'Frontel',
    expectedServicio: 'electricidad',
  },
  {
    name: 'Chilquinta',
    fixture: CHILQUINTA_REAL_2023_07,
    expectedEmpresa: 'Chilquinta',
    expectedServicio: 'electricidad',
  },
  {
    name: 'Aguas Andinas',
    fixture: AGUASANDINAS_REAL_2026_03,
    expectedEmpresa: 'Aguas Andinas',
    expectedServicio: 'agua',
  },
  {
    name: 'Esval',
    fixture: ESVAL_REAL_2021_04,
    expectedEmpresa: 'Esval',
    expectedServicio: 'agua',
  },
  {
    name: 'ESSBio',
    fixture: ESSBIO_REAL_2021_10,
    expectedEmpresa: 'ESSBio',
    expectedServicio: 'agua',
  },
  {
    name: 'Nuevosur',
    fixture: NUEVOSUR_REAL_2021_10,
    expectedEmpresa: 'Nuevosur',
    expectedServicio: 'agua',
  },
  {
    name: 'SMAPA',
    fixture: SMAPA_REAL_2025_10,
    expectedEmpresa: 'SMAPA',
    expectedServicio: 'agua',
  },
  {
    name: 'Metrogas',
    fixture: METROGAS_REAL_2025_08,
    expectedEmpresa: 'Metrogas',
    expectedServicio: 'gas',
  },
  {
    name: 'Lipigas',
    fixture: LIPIGAS_REAL_2021_08,
    expectedEmpresa: 'Lipigas',
    expectedServicio: 'gas',
  },
  {
    name: 'Gasco GLP',
    fixture: GASCO_REAL_2024_06,
    expectedEmpresa: 'Gasco GLP',
    expectedServicio: 'gas',
  },
  {
    name: 'Abastible',
    fixture: ABASTIBLE_REAL_2022_06,
    expectedEmpresa: 'Abastible',
    expectedServicio: 'gas',
  },
]

describe('fixtures reales → detección por parser', () => {
  for (const c of CASES) {
    it(`${c.name}: detect retorna el parser correcto`, () => {
      const result = detectParser(c.fixture)
      expect(result, `${c.name} no fue detectado`).not.toBeNull()
      expect(result!.empresa).toBe(c.expectedEmpresa)
      expect(result!.servicio).toBe(c.expectedServicio)
    })
  }

  it('cada fixture es un string no vacío', () => {
    for (const c of CASES) {
      expect(typeof c.fixture).toBe('string')
      expect(c.fixture.trim().length).toBeGreaterThan(100)
    }
  })

  it('los fixtures NO se confunden entre sí (cada uno detecta solo a su empresa)', () => {
    for (const c of CASES) {
      const result = detectParser(c.fixture)
      expect(result?.empresa).toBe(c.expectedEmpresa)
    }
  })
})
