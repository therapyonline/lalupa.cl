/**
 * Inyecta un bloque <script type="application/ld+json"> con structured data.
 *
 * Uso:
 *   <JsonLd schema={organizationSchema()} />
 *   <JsonLd schema={[articleSchema(...), breadcrumbsSchema(...)]} />
 */
export function JsonLd({
  schema,
}: {
  schema: Record<string, unknown> | Record<string, unknown>[]
}) {
  const json = JSON.stringify(schema)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
