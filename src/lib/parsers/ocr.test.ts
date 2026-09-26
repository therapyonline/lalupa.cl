import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createWorker: vi.fn(),
  setParameters: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(),
}))
vi.mock('tesseract.js', () => ({
  createWorker: mocks.createWorker,
  PSM: { SINGLE_BLOCK: 6 },
}))
vi.mock('./image-preprocess', () => ({
  preprocessImageForOcr: async (file: File) => file,
}))

import { PARSER_ASSETS } from '@/generated/parser-assets'

let ocr: typeof import('./ocr')
const file = new File(['image'], 'boleta.png', { type: 'image/png' })
const text = 'CGE DISTRIBUCION RUT 99.513.400-4 Total 45000 Cliente 1234567'

beforeEach(async () => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.stubGlobal('window', {})
  mocks.terminate.mockResolvedValue(undefined)
  mocks.setParameters.mockResolvedValue(undefined)
  mocks.createWorker.mockResolvedValue({
    setParameters: mocks.setParameters,
    recognize: mocks.recognize,
    terminate: mocks.terminate,
  })
  mocks.recognize.mockResolvedValue({ data: { text } })
  ocr = await import('./ocr')
})
afterEach(async () => {
  await ocr.disposeOcrWorker()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('ciclo de vida OCR', () => {
  it('reutiliza worker y procesa imágenes con assets locales', async () => {
    expect(await ocr.extractTextFromImage(file)).toContain('CGE')
    expect(await ocr.extractTextFromImage(file)).toContain('45000')
    expect(mocks.createWorker).toHaveBeenCalledOnce()
    expect(mocks.createWorker).toHaveBeenCalledWith(
      'spa',
      1,
      expect.objectContaining({
        workerPath: `${PARSER_ASSETS.ocrBase}/worker.min.js`,
        langPath: `${PARSER_ASSETS.ocrBase}/lang`,
      }),
    )
    expect(mocks.recognize).toHaveBeenCalledTimes(2)
  })
  it('transmite progreso de arranque y reconocimiento', async () => {
    const progress = vi.fn()
    mocks.recognize.mockImplementationOnce(async () => {
      mocks.createWorker.mock.calls[0][2].logger({
        status: 'recognizing text',
        progress: 0.5,
      })
      return { data: { text } }
    })
    await ocr.extractTextFromImage(file, progress)
    expect(progress).toHaveBeenCalledWith({
      status: 'recognizing text',
      progress: 0.5,
    })
  })
  it.each(['', '... __ , ;', '123'])(
    'rechaza texto insuficiente y permite reintentar: %s',
    async (raw) => {
      mocks.recognize.mockResolvedValueOnce({ data: { text: raw } })
      await expect(ocr.extractTextFromImage(file)).rejects.toThrow(
        'no logró leer texto',
      )
      await ocr.disposeOcrWorker()
      expect(mocks.terminate).toHaveBeenCalledOnce()
      await expect(ocr.extractTextFromImage(file)).resolves.toContain('CGE')
      expect(mocks.createWorker).toHaveBeenCalledTimes(2)
    },
  )
  it('se recupera si el worker falla al cargar', async () => {
    mocks.createWorker.mockRejectedValueOnce(new Error('boot'))
    await expect(ocr.extractTextFromImage(file)).rejects.toThrow('boot')
    await expect(ocr.extractTextFromImage(file)).resolves.toContain('CGE')
  })
  it('descarta worker tras timeout sin esperar 90 segundos reales', async () => {
    vi.useFakeTimers()
    mocks.recognize.mockImplementationOnce(() => new Promise(() => {}))
    const pending = expect(ocr.extractTextFromImage(file)).rejects.toThrow(
      'timeout',
    )
    await vi.advanceTimersByTimeAsync(90_000)
    await pending
    expect(mocks.terminate).toHaveBeenCalledOnce()
    await expect(ocr.extractTextFromImage(file)).resolves.toContain('CGE')
  })
  it('rechaza archivos que no son imágenes antes de crear un worker', async () => {
    await expect(
      ocr.extractTextFromImage(
        new File(['pdf'], 'a.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toThrow('imagen')
    expect(mocks.createWorker).not.toHaveBeenCalled()
  })
  it('tolera fallos al terminar el worker', async () => {
    await ocr.extractTextFromImage(file)
    mocks.terminate.mockRejectedValueOnce(new Error('already terminated'))
    await expect(ocr.disposeOcrWorker()).resolves.toBeUndefined()
  })
  it('serializa llamadas y envía progreso al consumidor de cada imagen', async () => {
    const firstProgress = vi.fn(),
      secondProgress = vi.fn()
    let finishFirst!: () => void
    const gate = new Promise<void>((resolve) => {
      finishFirst = resolve
    })
    mocks.recognize
      .mockImplementationOnce(async () => {
        await gate
        mocks.createWorker.mock.calls[0][2].logger({
          status: 'recognizing text',
          progress: 0.3,
        })
        return { data: { text } }
      })
      .mockImplementationOnce(async () => {
        mocks.createWorker.mock.calls[0][2].logger({
          status: 'recognizing text',
          progress: 0.7,
        })
        return { data: { text } }
      })
    const first = ocr.extractTextFromImage(file, firstProgress)
    const second = ocr.extractTextFromImage(file, secondProgress)
    await vi.waitFor(() => expect(mocks.recognize).toHaveBeenCalledOnce())
    finishFirst()
    await Promise.all([first, second])
    expect(firstProgress).toHaveBeenCalledExactlyOnceWith({
      status: 'recognizing text',
      progress: 0.3,
    })
    expect(secondProgress).toHaveBeenCalledExactlyOnceWith({
      status: 'recognizing text',
      progress: 0.7,
    })
    mocks.createWorker.mock.calls[0][2].logger({ status: 'late', progress: 1 })
    expect(secondProgress).toHaveBeenCalledTimes(1)
  })
  it('libera el worker si falla su configuración inicial', async () => {
    mocks.setParameters.mockRejectedValueOnce(new Error('config failed'))
    await expect(ocr.extractTextFromImage(file)).rejects.toThrow(
      'config failed',
    )
    expect(mocks.terminate).toHaveBeenCalledOnce()
    await expect(ocr.extractTextFromImage(file)).resolves.toContain('CGE')
  })
})
