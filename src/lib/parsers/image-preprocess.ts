/**
 * Pipeline de preprocesado para fotos de boleta.
 *
 *   1. Decode con ImageBitmap (rápido y privado: no usa Image+URL.createObjectURL).
 *   2. Si la imagen excede MAX_LONG_SIDE px, la downscalea para evitar OOM
 *      en mobile. Tesseract no necesita más de ~2400px para leer texto
 *      de boleta correctamente; iPhone 14 saca fotos a 4032px.
 *   3. Si la imagen quedó por debajo de TARGET_LONG_SIDE_FOR_OCR tras decode,
 *      la upscalea con interpolación de alta calidad. Tesseract pierde
 *      precisión cuando el texto cuerpo mide <20px de alto, lo que pasa
 *      con fotos chicas o capturas de pantalla.
 *   4. Convierte a grayscale (luminance Rec.709).
 *   5. Aplica contrast stretch sobre el percentil 5/95 (similar a "auto contrast"
 *      de Photoshop), saca el efecto de papel térmico desteñido o sombra
 *      uniforme sin convertir las áreas brillantes en blancos puros.
 *   6. Binarización Otsu: encuentra el threshold global óptimo y convierte
 *      a blanco/negro puro. Tesseract LSTM funciona mejor con texto
 *      binarizado y maneja los artefactos de iluminación irregular mucho
 *      mejor que un grayscale con contrast stretch (que deja sombras
 *      grises que el modelo confunde con texto).
 *
 * Devuelve un `Blob` PNG listo para pasarle al worker de Tesseract.
 *
 * Heurística: solo procesamos si la imagen es ≥ MIN_LONG_SIDE px de lado
 * mayor. Imágenes chicas (capturas, miniaturas) se devuelven tal cual.
 */

const MIN_LONG_SIDE_FOR_PREPROCESS = 800
/**
 * Cap superior para evitar Out-of-Memory en mobile. Una imagen de
 * 4032×3024 (iPhone 14) son ~48MB en RAM como ImageData (RGBA 4 bytes).
 * Con 2 copias (canvas + imageData) sube a ~100MB, suficiente para
 * crashear el tab en Safari mobile. Bajamos a 2400px de lado mayor:
 * ~17MB por copia, manejable.
 */
const MAX_LONG_SIDE = 2400
/**
 * Si la imagen original es chica (capturas de pantalla, miniaturas),
 * la upscalemos hasta este target. Tesseract LSTM rinde mejor cuando
 * el texto cuerpo mide ≥20px de alto: una boleta escaneada típica con
 * 1500-2000px de lado ancho cumple, debajo de eso pierde precisión.
 */
const TARGET_LONG_SIDE_FOR_OCR = 1500

export async function preprocessImageForOcr(file: File): Promise<Blob> {
  if (typeof window === 'undefined') return file
  if (!file.type.startsWith('image/')) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // Si decoding falla, devolvemos el original, Tesseract intentará igual.
    return file
  }

  const longSide = Math.max(bitmap.width, bitmap.height)

  // Resize: down si excede el cap, up si está debajo del target.
  let workingBitmap: ImageBitmap = bitmap
  let targetW = bitmap.width
  let targetH = bitmap.height
  if (longSide > MAX_LONG_SIDE) {
    const scale = MAX_LONG_SIDE / longSide
    targetW = Math.round(bitmap.width * scale)
    targetH = Math.round(bitmap.height * scale)
  } else if (longSide < TARGET_LONG_SIDE_FOR_OCR) {
    // Upscale: rango común de fotos chicas (300-800px) → 1500px.
    // Cap a 2x para evitar imágenes desproporcionadas si la entrada era
    // muy chica (un thumbnail de 100x100 no se va a volver bueno con
    // upscale, mejor procesarlo tal cual).
    const scale = Math.min(2, TARGET_LONG_SIDE_FOR_OCR / longSide)
    targetW = Math.round(bitmap.width * scale)
    targetH = Math.round(bitmap.height * scale)
  }

  if (targetW !== bitmap.width || targetH !== bitmap.height) {
    try {
      workingBitmap = await createImageBitmap(bitmap, {
        resizeWidth: targetW,
        resizeHeight: targetH,
        resizeQuality: 'high',
      })
      bitmap.close?.()
    } catch {
      // Si el resize falla, seguimos con la original; el preprocesado
      // todavía puede correr aunque consuma más memoria.
    }
  }

  const longSideAfter = Math.max(workingBitmap.width, workingBitmap.height)
  if (longSideAfter < MIN_LONG_SIDE_FOR_PREPROCESS) {
    workingBitmap.close?.()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = workingBitmap.width
  canvas.height = workingBitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    workingBitmap.close?.()
    return file
  }

  ctx.drawImage(workingBitmap, 0, 0)
  workingBitmap.close?.()

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
  const totalPixels = data.length / 4
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

  // Pasada 2: stretch in-place + recalcular histograma para Otsu
  const stretchedHist = new Uint32Array(256)
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i]
    let stretched = ((v - lowCut) / range) * 255
    if (stretched < 0) stretched = 0
    else if (stretched > 255) stretched = 255
    const intensity = Math.round(stretched)
    data[i] = data[i + 1] = data[i + 2] = intensity
    stretchedHist[intensity] += 1
  }

  // Pasada 3: binarización Otsu sobre el histograma post-stretch.
  // Tesseract LSTM rinde mejor con texto puro blanco/negro porque las
  // sombras grises (que el contrast stretch no elimina, solo atenúa)
  // se interpretan como puntos de tinta. Otsu encuentra el threshold
  // global óptimo separando 2 clases (texto vs papel) por varianza.
  const otsuThreshold = computeOtsuThreshold(stretchedHist, totalPixels)
  for (let i = 0; i < data.length; i += 4) {
    const bin = data[i] >= otsuThreshold ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = bin
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else resolve(file) // fallback
    }, 'image/png')
  })
}

/**
 * Otsu's method: encuentra el threshold que maximiza la varianza
 * inter-clase del histograma. Asume que la imagen tiene 2 modos
 * (texto + papel), lo que es cierto para boletas tras grayscale +
 * contrast stretch.
 *
 * Implementación clásica O(256), suficientemente rápida para correr
 * inline antes de pasarle al OCR.
 */
export function computeOtsuThreshold(
  histogram: Uint32Array,
  totalPixels: number,
): number {
  let sum = 0
  for (let v = 0; v < 256; v++) {
    sum += v * histogram[v]
  }

  let sumB = 0
  let wB = 0
  let maxVariance = 0
  let threshold = 127

  for (let v = 0; v < 256; v++) {
    wB += histogram[v]
    if (wB === 0) continue
    const wF = totalPixels - wB
    if (wF === 0) break

    sumB += v * histogram[v]
    const meanB = sumB / wB
    const meanF = (sum - sumB) / wF
    // Varianza inter-clase ω_B * ω_F * (μ_B - μ_F)²
    const variance = wB * wF * (meanB - meanF) * (meanB - meanF)
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = v
    }
  }

  return threshold
}
