import { Inter_Tight, JetBrains_Mono } from 'next/font/google'

export const interTight = Inter_Tight({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
