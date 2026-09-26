const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export function normalizeBoletaFile(file: File): File {
  if (file.size > MAX_FILE_BYTES)
    throw new Error('El archivo supera el máximo de 10 MB.')
  if (!file.size) throw new Error('El archivo está vacío.')
  const extension = file.name.toLowerCase().split('.').at(-1) ?? ''
  const type = file.type || MIME_BY_EXTENSION[extension]
  if (!Object.values(MIME_BY_EXTENSION).includes(type)) {
    throw new Error('Formato no soportado. Aceptamos PDF, JPG, PNG y WebP.')
  }
  return file.type
    ? file
    : new File([file], file.name, { type, lastModified: file.lastModified })
}
