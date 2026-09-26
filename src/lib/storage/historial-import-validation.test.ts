import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { historialSchema, MAX_IMPORT_BYTES } from './historial-schema'
import { comparableBoletas, latestPeriodReadings } from './comparable-boletas'
import type { ParsedBoleta } from '@/lib/parsers'

export function boleta(): ParsedBoleta {
  return {
    empresa: 'CGE',
    servicio: 'electricidad',
    periodo: { desde: new Date('2026-01-01'), hasta: new Date('2026-01-31') },
    cliente: { numeroCliente: '12345678-9', direccion: 'Casa 1' },
    consumo: { unidad: 'kWh', valor: 250, tarifa: 'BT-1' },
    cargos: [{ concepto: 'Cargo fijo', monto: 1048 }],
    totales: { subtotal: 41985, iva: 7977, total: 49962 },
    raw: 'Boleta de prueba CGE',
  }
}
const record = () =>
  JSON.parse(
    JSON.stringify({
      ...boleta(),
      id: 'legacy-id',
      guardadoEn: new Date('2026-02-01'),
    }),
  )
const backup = (records = [record()], version = 1) =>
  new File([JSON.stringify({ version, boletas: records })], 'backup.json')
let history: typeof import('./historial')
beforeEach(async () => {
  vi.resetModules()
  vi.stubGlobal('window', {})
  vi.stubGlobal('indexedDB', new IDBFactory())
  history = await import('./historial')
})
afterEach(() => vi.unstubAllGlobals())

describe('historial real en IndexedDB', () => {
  it('deduplica la misma lectura sin reemplazar otra cuenta del mismo período/total', async () => {
    const a = boleta(),
      b = { ...a, cliente: { numeroCliente: 'OTRO' } }
    const id = await history.guardarBoleta(a)
    expect(await history.guardarBoleta(a)).toBe(id)
    expect(await history.guardarBoleta(b)).not.toBe(id)
    expect(await history.listarBoletas()).toHaveLength(2)
  })
  it('preserva variantes del contenido y nunca confía en un ID importado', async () => {
    const a = record(),
      b = record()
    b.raw = 'Otra lectura, mismo ID externo'
    expect(await history.importarHistorial(backup([a, b]))).toEqual({
      agregadas: 2,
      omitidas: 0,
    })
    expect(await history.importarHistorial(backup([a, b], 2))).toEqual({
      agregadas: 0,
      omitidas: 2,
    })
    expect(await history.listarBoletas()).toHaveLength(2)
  })
  it('exporta/reimporta fechas desconocidas sin inventar períodos', async () => {
    const a = boleta()
    a.periodo = { desde: new Date(NaN), hasta: new Date(NaN) }
    a.fechaEmision = new Date(NaN)
    await history.guardarBoleta(a)
    const blob = await history.exportarHistorial()
    const json = JSON.parse(await blob.text())
    expect(json.version).toBe(2)
    expect(json.boletas[0].periodo).toEqual({ desde: null, hasta: null })
    await history.eliminarTodasLasBoletas()
    expect(
      await history.importarHistorial(new File([blob], 'respaldo.json')),
    ).toEqual({ agregadas: 1, omitidas: 0 })
    const [saved] = await history.listarBoletas()
    expect(Number.isNaN(saved.periodo.desde.getTime())).toBe(true)
    expect(saved.totales).toEqual(a.totales)
  })
  it('acepta respaldos v1 con null y conserva IDs antiguos al guardar otra vez', async () => {
    const { openDB } = await import('idb')
    await history.guardarBoleta(boleta())
    await history.eliminarTodasLasBoletas()
    const db = await openDB('lalupa', 1)
    await db.put('boletas', {
      ...boleta(),
      id: 'old-fnv',
      guardadoEn: new Date(),
    })
    db.close()
    expect(await history.guardarBoleta(boleta())).toBe('old-fnv')
    const a = record()
    a.periodo = { desde: null, hasta: null }
    expect((await history.importarHistorial(backup([a]))).agregadas).toBe(1)
  })
  it('rechaza todo el lote si una boleta no valida', async () => {
    await history.guardarBoleta(boleta())
    const invalid = record()
    invalid.empresa = 'Inventada'
    await expect(
      history.importarHistorial(backup([record(), invalid])),
    ).rejects.toThrow('No se importó ninguna')
    expect(await history.listarBoletas()).toHaveLength(1)
  })
  it('limita bytes antes de leer el archivo y rechaza JSON roto', async () => {
    const file = new File(['{}'], 'grande.json')
    Object.defineProperty(file, 'size', { value: MAX_IMPORT_BYTES + 1 })
    const read = vi.spyOn(file, 'text')
    await expect(history.importarHistorial(file)).rejects.toThrow('10 MB')
    expect(read).not.toHaveBeenCalled()
    await expect(
      history.importarHistorial(new File(['{'], 'roto.json')),
    ).rejects.toThrow('JSON válido')
  })
  it('permite reintentar después de fallar la apertura de IndexedDB', async () => {
    const real = indexedDB.open.bind(indexedDB)
    vi.spyOn(indexedDB, 'open')
      .mockImplementationOnce(() => {
        throw new DOMException('blocked', 'SecurityError')
      })
      .mockImplementation(real)
    await expect(history.listarBoletas()).rejects.toThrow('blocked')
    expect(await history.listarBoletas()).toEqual([])
  })
  it('guardar en paralelo no duplica y eliminar afecta solo el registro elegido', async () => {
    const ids = await Promise.all([
      history.guardarBoleta(boleta()),
      history.guardarBoleta(boleta()),
    ])
    expect(ids[0]).toBe(ids[1])
    expect(await history.listarBoletas('CGE', 'electricidad')).toHaveLength(1)
    expect(await history.listarBoletas(undefined, 'agua')).toHaveLength(0)
    await history.eliminarBoleta(ids[0])
    expect(await history.listarBoletas()).toHaveLength(0)
  })
})

describe('contrato de importación utilizado por producción', () => {
  it.each([
    [
      'demasiadas boletas',
      () => ({ version: 1, boletas: Array.from({ length: 501 }, record) }),
    ],
    [
      'servicio',
      () => ({ version: 1, boletas: [{ ...record(), servicio: 'otro' }] }),
    ],
    [
      'unidad incompatible',
      () => ({
        version: 1,
        boletas: [{ ...record(), consumo: { unidad: 'kg', valor: 2 } }],
      }),
    ],
    [
      'empresa incompatible',
      () => ({ version: 1, boletas: [{ ...record(), servicio: 'agua' }] }),
    ],
    [
      'monto infinito',
      () => ({
        version: 1,
        boletas: [
          { ...record(), totales: { subtotal: 1, iva: 0, total: Infinity } },
        ],
      }),
    ],
    [
      'texto gigante',
      () => ({
        version: 1,
        boletas: [{ ...record(), raw: 'a'.repeat(200_001) }],
      }),
    ],
    [
      'fecha imposible',
      () => ({
        version: 1,
        boletas: [
          { ...record(), periodo: { desde: '2026-02-30', hasta: null } },
        ],
      }),
    ],
    [
      'período invertido',
      () => ({
        version: 1,
        boletas: [
          {
            ...record(),
            periodo: { desde: '2026-02-01', hasta: '2026-01-01' },
          },
        ],
      }),
    ],
    [
      'tipoVenta incompatible',
      () => ({ version: 1, boletas: [{ ...record(), tipoVenta: 'producto' }] }),
    ],
  ] as const)('rechaza %s', (_name, make) => {
    expect(historialSchema.safeParse(make()).success).toBe(false)
  })
  it('elimina campos no reconocidos', () => {
    const parsed = historialSchema.parse({
      version: 2,
      boletas: [{ ...record(), inesperado: 'no copiar' }],
    })
    expect(parsed.boletas[0]).not.toHaveProperty('inesperado')
  })
})

describe('comparaciones del mismo suministro', () => {
  it('excluye clientes distintos, fechas desconocidas, períodos solapados y variantes antiguas', () => {
    const actual = boleta()
    actual.periodo = {
      desde: new Date('2026-03-01'),
      hasta: new Date('2026-03-31'),
    }
    const first = { ...boleta(), id: '1', guardadoEn: new Date('2026-02-01') }
    const latest = { ...first, id: '2', guardadoEn: new Date('2026-02-02') }
    const other = { ...first, id: 'other', cliente: { numeroCliente: 'OTRO' } }
    const unknown = {
      ...first,
      id: 'unknown',
      periodo: { desde: new Date(NaN), hasta: new Date(NaN) },
    }
    const overlap = { ...first, id: 'overlap', periodo: actual.periodo }
    expect(
      comparableBoletas([first, latest, other, unknown, overlap], actual).map(
        (b) => b.id,
      ),
    ).toEqual(['2'])
    expect(
      latestPeriodReadings([first, latest, other, unknown])
        .map((b) => b.id)
        .sort(),
    ).toEqual(['2', 'other', 'unknown'])
    expect(comparableBoletas([first], { ...actual, cliente: {} })).toEqual([])
    expect(comparableBoletas([first], { ...actual, tipoVenta: 'producto' })).toEqual([])
    expect(
      comparableBoletas([first], { ...actual, periodo: unknown.periodo }),
    ).toEqual([])
  })
})
