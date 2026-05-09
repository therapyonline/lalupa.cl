import { Alert } from '@/components/ui/Alert'
import { isValidDate } from '@/lib/dates'
import type { ParsedBoleta } from '@/lib/parsers'
import { AddPagesButton } from './AddPagesButton'

/**
 * A partir de cuántos intentos consideramos que "ya probaron varias
 * veces" y conviene escalar el copy a "subí el PDF original" en vez
 * de seguir empujando fotos. Pico empírico: 2 add-page = 3 fotos
 * intentadas en total (la inicial + 2 sumadas), suficiente para
 * detectar que el OCR no va a llegar.
 */
const ESCALATION_THRESHOLD = 2

/**
 * Banner que aparece cuando el parser produjo un resultado pero faltan
 * datos críticos. Pasa cuando el usuario sube una foto de baja calidad
 * (OCR mangled) o solo la primera página del PDF físico (cargos quedan
 * al reverso).
 *
 * Aparece sobre el bloque de resultado, sin reemplazarlo: lo que sí
 * pudimos extraer (empresa, total, fechas) sigue visible y es útil.
 *
 * Si el caller pasa `onAddText`, mostramos un botón "Agregar foto del
 * reverso" que corre OCR sobre nuevas imágenes y devuelve el texto
 * combinado para que el caller re-parsee.
 *
 * Después de `ESCALATION_THRESHOLD` intentos fallidos cambiamos el
 * mensaje a "subí el PDF original" y escondemos el botón. La realidad
 * es que si OCR no leyó cargos en 3 fotos, no los va a leer en la 4ta.
 *
 * El `<details>` con el texto OCR ayuda al usuario a entender por qué
 * no extraemos cargos: si el texto está completamente roto, sabe que
 * el problema es la calidad de la foto y no nuestra herramienta.
 */
export function PartialExtractionAlert({
  boleta,
  onAddText,
  addAttempts = 0,
}: {
  boleta: ParsedBoleta
  onAddText?: (newText: string) => void
  /**
   * Cuántas veces el usuario ya intentó agregar páginas en esta sesión.
   * Si supera el umbral, ocultamos el botón y empujamos hacia el PDF.
   */
  addAttempts?: number
}) {
  const issues: string[] = []

  if (!isValidDate(boleta.periodo.desde) || !isValidDate(boleta.periodo.hasta)) {
    issues.push('el período facturado')
  }
  if (boleta.cargos.length === 0) {
    issues.push('el detalle de cargos')
  }
  if (
    boleta.servicio !== 'gas' ||
    boleta.tipoVenta !== 'producto'
  ) {
    // Para luz/agua/gas red, esperamos consumo > 0. En cilindros no.
    if (boleta.consumo && (!boleta.consumo.valor || boleta.consumo.valor === 0)) {
      issues.push('el consumo del período')
    }
  }

  if (issues.length === 0) return null

  const escalated = addAttempts >= ESCALATION_THRESHOLD
  const issuesText =
    issues.length === 1
      ? issues[0]
      : issues.length === 2
        ? `${issues[0]} ni ${issues[1]}`
        : `${issues.slice(0, -1).join(', ')} ni ${issues[issues.length - 1]}`

  return (
    <Alert variant="warning">
      <Alert.Title>Lectura parcial</Alert.Title>
      <Alert.Body>
        {escalated ? (
          <>
            Probamos con varias fotos pero el OCR no logra leer{' '}
            {issuesText}. Lo más confiable es subir el{' '}
            <strong className="font-medium">
              PDF original descargado del sitio de la empresa
            </strong>
            : el texto se procesa al 100% sin pasar por OCR. También
            puede ayudar usar menos fotos pero más nítidas, sin sombras
            ni recortes.
          </>
        ) : (
          <>
            Pudimos identificar la empresa y el total, pero no logramos
            extraer {issuesText}. Si tu boleta tiene el detalle al
            reverso, agrega esa foto acá abajo. También puedes subir el
            PDF original descargado del sitio de la empresa para
            análisis completo.
          </>
        )}
      </Alert.Body>
      {onAddText && !escalated && <AddPagesButton onAddText={onAddText} />}
      {boleta.raw && <RawOcrDetails text={boleta.raw} />}
    </Alert>
  )
}

/**
 * Disclosure colapsado con el texto OCR crudo. El usuario puede ver
 * exactamente qué leyó Tesseract, lo que ayuda a entender por qué un
 * cargo no aparece (probablemente porque el texto OCR no contiene la
 * palabra esperada).
 *
 * Pre-recortado a 2000 chars: una boleta típica genera 1500-3000 chars
 * de texto OCR; el extra solo agrega ruido si el usuario sumó páginas.
 */
function RawOcrDetails({ text }: { text: string }) {
  const PREVIEW_LIMIT = 2000
  const truncated = text.length > PREVIEW_LIMIT
  const preview = truncated ? text.slice(0, PREVIEW_LIMIT) : text

  return (
    <details className="mt-4 text-xs">
      <summary className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">
        Ver texto leído por OCR (debug)
      </summary>
      <p className="mt-2 text-soft">
        Esto es exactamente lo que el OCR leyó de tus fotos. Si los
        cargos no aparecen acá, no los podemos detectar; conviene subir
        el PDF original.
      </p>
      <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-ink/5 p-3 font-mono text-[11px] leading-relaxed text-ink">
        {preview}
        {truncated && '\n\n[…texto recortado para previsualización]'}
      </pre>
    </details>
  )
}
