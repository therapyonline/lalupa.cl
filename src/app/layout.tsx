import type { Metadata } from 'next'
import { interTight, jetbrainsMono } from './fonts'
import { Analytics } from '@/components/Analytics'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/JsonLd'
import {
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  buildOgImageUrl,
  organizationSchema,
  websiteSchema,
} from '@/lib/seo'
import './globals.css'

const DEFAULT_TITLE = 'Lalupa.cl, Lo que esconden bajo la letra chica'
const DEFAULT_DESCRIPTION =
  'Revisa tus boletas de luz, agua, gas e internet en tu propio celular. Detecta cobros sospechosos en segundos.'
const DEFAULT_OG_IMAGE = buildOgImageUrl(
  'Lo que esconden bajo la letra chica',
  'home',
)

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s · ${SITE_NAME}`,
    default: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  alternates: {
    canonical: '/',
    languages: { 'es-CL': SITE_URL },
    types: {
      'application/rss+xml': [
        { url: '/guias/rss.xml', title: 'Guías de lalupa.cl' },
      ],
    },
  },
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  generator: 'Next.js',
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFCF5' },
    { media: '(prefers-color-scheme: dark)', color: '#222222' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es-CL"
      className={`${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-cream focus:outline-none focus:ring-4 focus:ring-primary/40"
        >
          Saltar al contenido
        </a>
        <JsonLd schema={[organizationSchema(), websiteSchema()]} />
        <Header />
        {/* `contents` hace que el div no genere box, así el children
            (que es un <main>) se posiciona como hijo directo del body
            para layout flex. El skip link salta al main interno (el
            que cada page renderiza), no a este wrapper invisible.
            `tabIndex={-1}` mantiene el target programático para AT. */}
        <div id="contenido-principal" tabIndex={-1} className="contents">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
