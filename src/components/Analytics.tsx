import Script from 'next/script'

/** Métricas agregadas opcionales. No se carga ningún grabador de sesiones. */
export function Analytics() {
  const cfToken = process.env.NEXT_PUBLIC_CLOUDFLARE_WA_TOKEN
  if (!cfToken) return null
  return (
    <Script
      strategy="afterInteractive"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: cfToken })}
    />
  )
}
