import { getExtractionIssues } from '@/lib/parsers/extraction-quality'
import type { ParsedBoleta } from '@/lib/parsers/types'

export function ResultSummary({ boleta }: { boleta: ParsedBoleta }) {
  const partial = getExtractionIssues(boleta).length > 0
  const flags = boleta.cargos.filter((c) => c.sospechoso).length
  return (
    <div className="mt-6 max-w-2xl">
      <p className="text-lg leading-relaxed text-body">
        {partial
          ? 'La lectura está incompleta. Revisa los datos faltantes antes de evaluar tu cuenta. '
          : flags
            ? `Hay ${flags} ${flags === 1 ? 'cargo para revisar' : 'cargos para revisar'} en los datos leídos. `
            : 'No detectamos alertas en los datos que logramos leer. '}
        Esto no confirma que la facturación sea correcta. Contrasta el documento
        original y la tarifa de tu período, zona y contrato antes de reclamar.
      </p>
      <p className="mt-3 rounded-xl border border-border bg-cream-warm p-4 text-sm leading-relaxed text-body">
        <strong className="text-ink">Tarifa no verificada.</strong>{' '}
        {boleta.servicio === 'gas'
          ? 'Revisa el precio del contrato o de la compra, el formato, la zona y la fecha. '
          : 'Falta confirmar la tarifa aplicable a tu zona, período y opción contratada, con los impuestos de cada cargo. '}
        Las alertas revisan conceptos y datos extraídos; no certifican los
        precios cobrados.
      </p>
    </div>
  )
}
