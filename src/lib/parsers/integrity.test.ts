/**
 * Integridad de parsers: cada uno de los 14 debe producir un ParsedBoleta
 * con datos críticos válidos cuando se le pasa su propio fixture real.
 *
 * Crítico = lo que el result-view consume para mostrar al usuario:
 *   - empresa (string no vacío)
 *   - servicio ('electricidad' | 'agua' | 'gas')
 *   - periodo.desde y periodo.hasta (Date válida o ambas Invalid pero
 *     consistentes — formatPeriod del UI traduce a "Período no detectado")
 *   - totales.total > 0
 *   - cargos: array (puede estar vacío en gas-cilindro pero suele tener
 *     al menos un cargo mayor a 0)
 *
 * Si un parser pasa el cross-empresa test pero falla acá, significa que
 * acepta el formato pero entrega datos rotos al UI, lo cual cause el
 * "El parser detectó la distribuidora pero no logró extraer los datos"
 * que el usuario reportó.
 */

import { describe, expect, it } from 'vitest'
import { isValidDate } from '@/lib/dates'
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
import type { ParsedBoleta } from './types'

interface Bundle {
  empresa: string
  servicio: 'electricidad' | 'agua' | 'gas'
  parse: (text: string) => ParsedBoleta
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

describe('parser integrity (cada empresa con su propio fixture)', () => {
  for (const b of BUNDLES) {
    describe(b.empresa, () => {
      const boleta = b.parse(b.fixture)

      it('empresa coincide con bundle', () => {
        expect(boleta.empresa).toBe(b.empresa)
      })

      it('servicio coincide', () => {
        expect(boleta.servicio).toBe(b.servicio)
      })

      it('totales.total es número finito > 0', () => {
        expect(Number.isFinite(boleta.totales.total)).toBe(true)
        expect(boleta.totales.total).toBeGreaterThan(0)
      })

      it('cargos es array', () => {
        expect(Array.isArray(boleta.cargos)).toBe(true)
      })

      it('cada cargo tiene concepto y monto numérico', () => {
        for (const cargo of boleta.cargos) {
          expect(typeof cargo.concepto).toBe('string')
          expect(cargo.concepto.length).toBeGreaterThan(0)
          expect(Number.isFinite(cargo.monto)).toBe(true)
        }
      })

      it('periodo.desde y periodo.hasta son Date instances', () => {
        expect(boleta.periodo.desde).toBeInstanceOf(Date)
        expect(boleta.periodo.hasta).toBeInstanceOf(Date)
      })

      // Si periodo es válido, hasta >= desde. Si es inválido, ambos lo son.
      it('periodo es coherente (válido o ambos inválidos)', () => {
        const desdeValid = isValidDate(boleta.periodo.desde)
        const hastaValid = isValidDate(boleta.periodo.hasta)
        // O ambos válidos, o ambos inválidos. No mezcla.
        if (desdeValid !== hastaValid) {
          throw new Error(
            `Periodo mixto en ${b.empresa}: desde=${
              desdeValid ? 'válido' : 'inválido'
            } pero hasta=${hastaValid ? 'válido' : 'inválido'}`,
          )
        }
        if (desdeValid && hastaValid) {
          expect(boleta.periodo.hasta.getTime()).toBeGreaterThanOrEqual(
            boleta.periodo.desde.getTime(),
          )
        }
      })

      // El raw text debe estar presente para reproducibilidad.
      it('raw text se preserva', () => {
        expect(typeof boleta.raw).toBe('string')
        expect(boleta.raw.length).toBeGreaterThan(0)
      })

      // Defensive: el ReclamoPayload del result-view requiere serializar
      // las fechas. Probar que safeISOString no crashea con periodo
      // (ya sea válido o inválido).
      it('serializar fechas a JSON no crashea', () => {
        expect(() =>
          JSON.stringify({
            periodoDesde: isValidDate(boleta.periodo.desde)
              ? boleta.periodo.desde.toISOString()
              : undefined,
            periodoHasta: isValidDate(boleta.periodo.hasta)
              ? boleta.periodo.hasta.toISOString()
              : undefined,
            fechaEmision: isValidDate(boleta.fechaEmision)
              ? boleta.fechaEmision?.toISOString()
              : undefined,
            fechaVencimiento: isValidDate(boleta.fechaVencimiento)
              ? boleta.fechaVencimiento?.toISOString()
              : undefined,
          }),
        ).not.toThrow()
      })
    })
  }
})
