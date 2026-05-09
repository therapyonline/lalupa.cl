import { Alert } from '@/components/ui/Alert'
import { isValidDate } from '@/lib/dates'
import type { ParsedBoleta } from '@/lib/parsers'
import { AddPagesButton } from './AddPagesButton'

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
 */
export function PartialExtractionAlert({
  boleta,
  onAddText,
}: {
  boleta: ParsedBoleta
  onAddText?: (newText: string) => void
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

  return (
    <Alert variant="warning">
      <Alert.Title>Lectura parcial</Alert.Title>
      <Alert.Body>
        Pudimos identificar la empresa y el total, pero no logramos extraer{' '}
        {issues.length === 1
          ? issues[0]
          : issues.length === 2
            ? `${issues[0]} ni ${issues[1]}`
            : `${issues.slice(0, -1).join(', ')} ni ${issues[issues.length - 1]}`}
        . Si tu boleta tiene el detalle al reverso, agregá esa foto acá
        abajo. También puedes subir el PDF original descargado del sitio
        de la empresa para análisis completo.
      </Alert.Body>
      {onAddText && <AddPagesButton onAddText={onAddText} />}
    </Alert>
  )
}
