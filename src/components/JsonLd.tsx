/**
 * Inyecta un bloque <script type="application/ld+json"> con structured data.
 *
 * Uso:
 *   <JsonLd schema={organizationSchema()} />
 *   <JsonLd schema={[articleSchema(...), breadcrumbsSchema(...)]} />
 *
 * Seguridad: escapa `<` como `<` antes de inyectar para que un campo
 * del schema con `</script>` adentro no cierre el contenedor y permita
 * inyectar markup arbitrario. Es la convención estándar para JSON-LD
 * que se embebe en HTML.
 */
export function JsonLd({
  schema,
}: {
  schema: Record<string, unknown> | Record<string, unknown>[]
}) {
  // Defensive guards: si el schema es undefined/null o si
  // JSON.stringify devuelve undefined (cycle, función embebida),
  // no renderizamos el bloque. Mejor sin schema que crashear el build.
  if (!schema) return null
  const raw = JSON.stringify(schema)
  if (!raw) return null
  // Reemplazo defensivo de cualquier `<` antes de inyectar. Mantiene
  // el JSON estructuralmente válido (los parsers JSON aceptan
  // `<`) y previene escape del contenedor `<script>`.
  const json = raw.replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
