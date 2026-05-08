import { Inter_Tight, JetBrains_Mono } from 'next/font/google'

// Solo cargamos los pesos que efectivamente usa el design system.
// Inter Tight: 400 body default, 500 medium (h1/h2), 600 semibold (UI strong), 700 bold (CTAs).
// JetBrains Mono: 400 base, 500 medium para eyebrow/kickers.
// `display: swap` evita FOIT y deja el texto visible mientras carga la fuente.
// `preload: true` en sans porque es la fuente del LCP (h1 hero).

export const interTight = Inter_Tight({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

export const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
})
