import type { GuiaFaqItem } from '@/lib/guias'

/**
 * Render colapsable de las preguntas frecuentes de una guía, desde el
 * frontmatter `faqs` (la misma data que alimenta el FAQPage JSON-LD).
 *
 * Antes las FAQs vivían duplicadas: en el frontmatter (para SEO) y como
 * headings `### ¿pregunta?` en el cuerpo MDX (para mostrar). Eso saturaba
 * la tabla de contenidos y no permitía colapsar. Ahora hay una sola
 * fuente (frontmatter) y se muestran como acordeón con `<details>`.
 */
export function FaqAccordion({ faqs }: { faqs: GuiaFaqItem[] }) {
  if (faqs.length === 0) return null
  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="text-2xl font-medium tracking-tight text-ink md:text-3xl"
      >
        Preguntas frecuentes
      </h2>
      <div className="mt-6 flex flex-col gap-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-lg border border-border bg-white px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-medium text-ink">
              {faq.q}
              <span
                className="text-soft transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-body leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
