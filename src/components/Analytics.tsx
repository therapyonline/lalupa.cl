/**
 * Analytics opt-in via env vars.
 *
 * Solo carga scripts si las variables están seteadas, default no carga
 * nada (privacy-first en local/dev).
 *
 *   NEXT_PUBLIC_CLOUDFLARE_WA_TOKEN  → Cloudflare Web Analytics (cookie-less)
 *   NEXT_PUBLIC_CLARITY_PROJECT_ID   → Microsoft Clarity (cookie-less, sin form inputs)
 *
 * Cualquier ad-blocker o navegador en strict mode (Brave, Firefox) los
 * bloquea sin afectar la funcionalidad de la app.
 */

import Script from 'next/script'

export function Analytics() {
  const cfToken = process.env.NEXT_PUBLIC_CLOUDFLARE_WA_TOKEN
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

  return (
    <>
      {cfToken && (
        <Script
          strategy="afterInteractive"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cfToken })}
        />
      )}
      {clarityId && (
        <Script
          id="clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
              // Cookie-less mode + masking de inputs (privacy-first).
              if (window.clarity) {
                window.clarity("set", "cookies", "false");
                window.clarity("set", "mask", "all");
              }
            `,
          }}
        />
      )}
    </>
  )
}
