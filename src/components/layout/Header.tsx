'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Container } from './Container'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Boletas', href: '/boleta-luz' },
  { label: 'Subsidios', href: '/subsidio-electrico' },
  { label: 'Comparador', href: '/comparador-internet-hogar' },
  { label: 'Guías', href: '/guias' },
] as const

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  // "Boletas" pill activa en /boleta-luz, /boleta-agua, /boleta-gas
  if (href === '/boleta-luz') {
    return /^\/boleta-(luz|agua|gas)(\/|$)/.test(pathname)
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const pillBase =
    'rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors'

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-ink"
          aria-label="lalupa.cl"
        >
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">
            lalupa.cl
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  pillBase,
                  active
                    ? 'bg-cream-warm text-ink'
                    : 'text-body hover:bg-cream-warm/50 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/boleta-luz"
          className="hidden rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-primary-dark md:inline-block"
        >
          Revisar boleta
        </Link>

        <button
          type="button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-6 w-6" strokeWidth={1.5} />
          ) : (
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          )}
        </button>
      </Container>

      {open && (
        <div className="border-t border-ink/5 bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    pillBase,
                    'text-center',
                    active
                      ? 'bg-cream-warm text-ink'
                      : 'text-body',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/boleta-luz"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-ink px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-cream"
            >
              Revisar boleta
            </Link>
          </Container>
        </div>
      )}
    </header>
  )
}

function LogoMark() {
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
        stroke="#222222"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9" stroke="#222222" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#FF6B35" />
    </svg>
  )
}
