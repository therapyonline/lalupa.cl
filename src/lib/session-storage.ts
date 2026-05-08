/**
 * Wrapper para sessionStorage con manejo defensivo:
 *
 *   - QuotaExceededError (5MB cap típico): rethrow con mensaje claro al
 *     usuario, sugerimos subir el PDF más chico o reintentar.
 *   - SecurityError (Safari Private Mode bloquea storage): rethrow con
 *     mensaje útil.
 *   - Storage no disponible (SSR / browser sin cookies third-party): no
 *     crashea la app, devuelve null y deja que el caller decida.
 *
 * Esto vive separado de los upload-hubs para que las 3 (luz/agua/gas)
 * compartan la misma lógica defensiva.
 */

export class StorageQuotaError extends Error {
  constructor() {
    super(
      'No queda espacio en este navegador para guardar tu boleta. Prueba refrescar la pestaña o subir un archivo más chico.',
    )
    this.name = 'StorageQuotaError'
  }
}

export class StorageBlockedError extends Error {
  constructor() {
    super(
      'Este navegador tiene el almacenamiento bloqueado (modo privado o cookies third-party deshabilitadas). lalupa necesita guardar la boleta brevemente en este celular para mostrarte el resultado.',
    )
    this.name = 'StorageBlockedError'
  }
}

/**
 * Guarda un valor en sessionStorage con todas las protecciones.
 *
 * Lanza:
 *   - StorageQuotaError si el browser está lleno
 *   - StorageBlockedError si el browser bloquea storage
 *   - Error genérico para otros fallos imprevistos
 *
 * Devuelve true cuando el guardado es exitoso.
 */
export function safeSessionSet(key: string, value: string): true {
  if (typeof window === 'undefined') {
    throw new Error('safeSessionSet solo corre en navegador.')
  }
  try {
    sessionStorage.setItem(key, value)
    return true
  } catch (err) {
    // QuotaExceededError: name === 'QuotaExceededError' || code === 22
    // En Firefox: NS_ERROR_DOM_QUOTA_REACHED.
    if (err instanceof DOMException) {
      if (
        err.name === 'QuotaExceededError' ||
        err.code === 22 ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) {
        throw new StorageQuotaError()
      }
      if (err.name === 'SecurityError') {
        throw new StorageBlockedError()
      }
    }
    throw err
  }
}

/**
 * Lee un valor de sessionStorage. Devuelve null si no existe o si el
 * navegador bloquea acceso (Safari Private Mode).
 */
export function safeSessionGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Borra una clave. Silencioso si falla (no es crítico).
 */
export function safeSessionRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}
