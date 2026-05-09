const TIPS = [
  {
    icon: '🔆',
    title: 'Buena luz',
    body: 'Cerca de una ventana o con luz cenital. Evita sombras de tu propia mano sobre la boleta.',
  },
  {
    icon: '📐',
    title: 'Boleta plana y derecha',
    body: 'Apóyala en una mesa, no en tu falda. Que esté lo más recta posible, sin perspectiva.',
  },
  {
    icon: '🔍',
    title: 'Llena el cuadro',
    body: 'La boleta debería ocupar al menos 80% de la foto. Si está chica, el OCR adivina y se equivoca.',
  },
  {
    icon: '🤚',
    title: 'Pulso firme',
    body: 'Apoya los codos. Una foto movida es ilegible incluso para Tesseract.',
  },
  {
    icon: '📄',
    title: 'Frente y reverso',
    body: 'Si tu boleta tiene el detalle de cargos al reverso, sube ambas fotos juntas (hasta 5). Las procesamos en orden.',
  },
] as const

export function OcrPhotoTips({ className }: { className?: string }) {
  return (
    <details
      className={
        className ?? 'mt-4 rounded-md border border-border bg-cream-warm/30 p-4'
      }
    >
      <summary className="cursor-pointer text-sm font-medium text-ink hover:text-primary">
        Tips para una foto que el OCR pueda leer
      </summary>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TIPS.map((t) => (
          <li
            key={t.title}
            className="flex gap-3 rounded-md bg-white p-3 text-sm"
          >
            <span aria-hidden className="text-xl leading-none">
              {t.icon}
            </span>
            <div>
              <p className="font-medium text-ink">{t.title}</p>
              <p className="mt-1 text-body">{t.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-soft">
        Si tienes el PDF original (descargado del sitio de la empresa), preferilo
        siempre, es más exacto que cualquier foto.
      </p>
    </details>
  )
}
