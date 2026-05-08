/**
 * Pipeline mínimo de preprocesado para fotos de boleta:
 *
 *   1. Decode con ImageBitmap (más rápido y privado que Image+URL).
 *   2. Convierte a grayscale (luminance Rec.709).
 *   3. Aplica contrast stretch sobre el percentil 5/95 (similar a "auto contrast"
 *      de Photoshop) — saca el efecto de papel térmico desteñido o sombra
 *      uniforme sin convertir las áreas brillantes en blancos puros.
 *
 * Devuelve un `Blob` PNG listo para pasarle al worker de Tesseract.
 *
 * Heurística: solo procesamos si la imagen es ≥ 800px de lado mayor — ahí
 * casi seguro es foto de celular y vale la pena. Imágenes chicas
 * (capturas de pantalla, miniaturas) se devuelven tal cual.
 */

const MIN_LONG_SIDE_FOR_PREPROCESS = 800

export async function preprocessImageForOcr(file: File): Promise<Blob> {
  if (typeof window === 'undefined') return file
  if (!file.type.startsWith('image/')) return file
  // PNG sin compresión a veces son screenshots — no las preprocesamos.

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // Si decoding falla, devolvemos el original — Tesseract intentará igual.
    return file
  }

  const longSide = Math.max(bitmap.width, bitmap.height)
  if (longSide < MIN_LONG_SIDE_FOR_PREPROCESS) {
    bitmap.close?.()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close?.()
    return file
  }

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close?.()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  // Pasada 1: grayscale + histograma
  const histogram = new Uint32Array(256)
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(
      0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2],
    )
    data[i] = data[i + 1] = data[i + 2] = lum
    histogram[lum] += 1
  }

  // Percentiles 5 y 95 → contrast stretch
  const totalPixels = (data.length / 4)
  const lowCount = totalPixels * 0.05
  const highCount = totalPixels * 0.95
  let cumulative = 0
  let lowCut = 0
  let highCut = 255
  for (let v = 0; v < 256; v++) {
    cumulative += histogram[v]
    if (cumulative >= lowCount && lowCut === 0) lowCut = v
    if (cumulative >= highCount) {
      highCut = v
      break
    }
  }
  const range = Math.max(1, highCut - lowCut)

  // Pasada 2: stretch in-place
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i]
    let stretched = ((v - lowCut) / range) * 255
    if (stretched < 0) stretched = 0
    else if (stretched > 255) stretched = 255
    data[i] = data[i + 1] = data[i + 2] = stretched
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else resolve(file) // fallback
      },
      'image/png',
    )
  })
}
