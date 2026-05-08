import Link from 'next/link'
import { Container } from './Container'

const TOOLS = [
  { label: 'Boleta de luz', href: '/boleta-luz' },
  { label: 'Boleta de agua', href: '/boleta-agua' },
  { label: 'Boleta de gas', href: '/boleta-gas' },
  { label: 'Comparador internet', href: '/comparador-internet-hogar' },
  { label: 'Subsidio eléctrico', href: '/subsidio-electrico' },
  { label: 'Reclamar a SERNAC', href: '/reclamar-sernac' },
  { label: 'Tracker', href: '/tracker' },
  { label: 'Guías', href: '/guias' },
  { label: 'RSS de guías', href: '/guias/rss.xml' },
] as const

const LEGAL = [
  { label: 'Sobre lalupa', href: '/sobre' },
  { label: 'Cómo funciona', href: '/como-funciona' },
  { label: 'Privacidad', href: '/privacidad' },
  { label: 'Términos', href: '/terminos' },
  { label: 'Contacto', href: '/contacto' },
] as const

export function Footer() {
  return (
    <footer className="bg-ink text-cream/60">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-cream"
              aria-label="lalupa.cl"
            >
              <LogoMarkLight />
              <span className="text-lg font-semibold tracking-tight">
                lalupa.cl
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Lo que esconden bajo la letra chica. Una herramienta para revisar
              tus boletas en tu propio celular, en privado.
            </p>
          </div>

          <FooterColumn title="Herramientas" items={TOOLS} />
          <FooterColumn title="Legal" items={LEGAL} />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-cream/10 pt-8 text-xs md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl">
            Herramienta referencial. Para reclamos formales: SERNAC, SEC, SISS.
          </p>
          <p>© {new Date().getFullYear()} lalupa.cl</p>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({
  title,
  items,
}: {
  title: string
  items: ReadonlyArray<{ label: string; href: string }>
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-cream">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {items.map(({ label, href }) => (
          <li key={href}>
            <Link href={href} className="transition-colors hover:text-cream">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LogoMarkLight() {
  return (
    <svg
      viewBox="0 0 28 28"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className="h-7 w-7"
      aria-hidden
    >
      <line
        x1="20"
        y1="20"
        x2="26"
        y2="26"
        stroke="#FFFCF5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9" stroke="#FFFCF5" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#FF6B35" />
    </svg>
  )
}

