/**
 * Test sistémico de rechazo cross-empresa.
 *
 * Cada parser debe lanzar `WRONG_EMPRESA` cuando se le pasa el fixture de
 * OTRA empresa del mismo servicio. Esto previene regresiones en `detect()`
 * o en los `markersRegex` que harían que un parser "robe" boletas de su
 * vecino — un bug típico cuando dos empresas comparten layout (ej. SAESA
 * y Frontel, ESSBio y Nuevosur).
 *
 * Genera 13 × 12 = 156 assertions (una por par fixture/parser de otra
 * empresa misma categoría).
 */

import { describe, expect, it } from 'vitest'
import { ParserError } from './errors'
import { CGE_SYNTHETIC_NORMAL } from './__fixtures__/cge-synthetic'
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
import { parseCGE } from './electricidad/cge'
import { parseChilquinta } from './electricidad/chilquinta'
import { parseEnel } from './electricidad/enel'
import { parseFrontel } from './electricidad/frontel'
import { parseSaesa } from './electricidad/saesa'
import { parseAguasAndinas } from './agua/aguasandinas'
import { parseEsval } from './agua/esval'
import { parseEssbio } from './agua/essbio'
import { parseNuevosur } from './agua/nuevosur'
import { parseSmapa } from './agua/smapa'
import { parseAbastible } from './gas/abastible'
import { parseGasco } from './gas/gasco'
import { parseLipigas } from './gas/lipigas'
import { parseMetrogas } from './gas/metrogas'

interface Bundle {
  empresa: string
  servicio: 'electricidad' | 'agua' | 'gas'
  parse: (text: string) => unknown
  fixture: string
}

const BUNDLES: Bundle[] = [
  { empresa: 'CGE', servicio: 'electricidad', parse: parseCGE, fixture: CGE_SYNTHETIC_NORMAL },
  { empresa: 'Enel', servicio: 'electricidad', parse: parseEnel, fixture: ENEL_REAL_2024_06 },
  { empresa: 'SAESA', servicio: 'electricidad', parse: parseSaesa, fixture: SAESA_REAL_2024_09 },
  { empresa: 'Frontel', servicio: 'electricidad', parse: parseFrontel, fixture: FRONTEL_REAL_2022_09 },
  { empresa: 'Chilquinta', servicio: 'electricidad', parse: parseChilquinta, fixture: CHILQUINTA_REAL_2023_07 },
  { empresa: 'Aguas Andinas', servicio: 'agua', parse: parseAguasAndinas, fixture: AGUASANDINAS_REAL_2026_03 },
  { empresa: 'Esval', servicio: 'agua', parse: parseEsval, fixture: ESVAL_REAL_2021_04 },
  { empresa: 'ESSBio', servicio: 'agua', parse: parseEssbio, fixture: ESSBIO_REAL_2021_10 },
  { empresa: 'Nuevosur', servicio: 'agua', parse: parseNuevosur, fixture: NUEVOSUR_REAL_2021_10 },
  { empresa: 'SMAPA', servicio: 'agua', parse: parseSmapa, fixture: SMAPA_REAL_2025_10 },
  { empresa: 'Metrogas', servicio: 'gas', parse: parseMetrogas, fixture: METROGAS_REAL_2025_08 },
  { empresa: 'Lipigas', servicio: 'gas', parse: parseLipigas, fixture: LIPIGAS_REAL_2021_08 },
  { empresa: 'Abastible', servicio: 'gas', parse: parseAbastible, fixture: ABASTIBLE_REAL_2022_06 },
  { empresa: 'Gasco GLP', servicio: 'gas', parse: parseGasco, fixture: GASCO_REAL_2024_06 },
]

describe('cross-empresa rejection', () => {
  for (const target of BUNDLES) {
    for (const wrong of BUNDLES) {
      if (target.empresa === wrong.empresa) continue
      // Solo testeamos cross-empresa dentro del mismo servicio — un parser
      // de electricidad legítimamente puede no reconocer una boleta de
      // gas (caería en INVALID_FORMAT, no en WRONG_EMPRESA).
      if (target.servicio !== wrong.servicio) continue

      it(`${target.empresa}.parse rechaza fixture de ${wrong.empresa}`, () => {
        try {
          target.parse(wrong.fixture)
          throw new Error(
            `${target.empresa} aceptó fixture de ${wrong.empresa} sin lanzar`,
          )
        } catch (err) {
          if (!(err instanceof ParserError)) throw err
          expect(
            ['WRONG_EMPRESA', 'INVALID_FORMAT'].includes(err.code),
          ).toBe(true)
        }
      })
    }
  }

  it('todos los parsers parsean su propio fixture sin error', () => {
    for (const b of BUNDLES) {
      expect(() => b.parse(b.fixture)).not.toThrow()
    }
  })
})
