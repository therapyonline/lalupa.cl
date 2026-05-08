# lalupa.cl — Arquitectura

Una herramienta gratuita para revisar boletas de servicios básicos en Chile. **Privacy-by-design**: el procesamiento ocurre íntegramente en el navegador del usuario, sin uploads ni cuentas.

## Decisiones clave

- **100% browser-side**: PDFs y fotos nunca dejan el dispositivo. El parser corre como JavaScript en el browser.
- **No backend, no DB remota**: Vercel sirve assets estáticos; el histórico vive en IndexedDB local.
- **No login**: cero registros, cero forms que persistan datos. Analytics es opt-in via env var (Cloudflare WA + Clarity en mask mode, sin cookies de marketing).
- **Self-hosted dependencies**: Tesseract.js (OCR) y pdfjs-dist (PDF) servidos desde el mismo origen — sin CDNs externos.

## Stack

- **Next.js 16** (App Router, RSC, Turbopack) sobre Vercel estático
- **TypeScript estricto** + ESLint
- **Tailwind v4** con tokens custom (`cream`, `ink`, `accent`)
- **Vitest** para unit tests + **Playwright** para E2E
- **pdfjs-dist** + **tesseract.js** para extracción de texto
- **idb** para IndexedDB
- **pdf-lib** para generar carta SERNAC en browser
- **next-mdx-remote** para guías editoriales

## Mapa del código

```
src/
├── app/                    # Next.js App Router
│   ├── api/og/             # OG image dinámica (Edge runtime)
│   ├── api/health/         # Health check
│   ├── boleta-{luz,agua,gas}/
│   │   ├── page.tsx        # Upload landing
│   │   └── [empresa]/      # Resultado parseado por empresa
│   ├── guias/              # Editorial (15+ MDX guides)
│   │   ├── [slug]/
│   │   ├── categoria/[categoria]/
│   │   └── rss.xml/
│   ├── tracker/            # Histórico personal (IndexedDB)
│   ├── reclamar-sernac/    # Wizard 5 pasos → PDF
│   ├── subsidio-electrico/ # Calculadora elegibilidad
│   ├── comparador-internet-hogar/
│   ├── como-funciona/      # Trust page con FAQ + CSP verification
│   ├── privacidad/, terminos/, contacto/, sobre/
│   └── loading.tsx, error.tsx, not-found.tsx
├── components/
│   ├── ui/                 # Button, Alert, Card, Skeleton, FileDrop, ...
│   ├── layout/             # Header, Footer, Container
│   ├── parsers/            # ResultBlock, Comparativa, OcrPhotoTips, ...
│   ├── guias/              # Toc, RelatedGuias
│   └── mdx/                # Custom MDX components (Callout, DataPoint, ...)
├── content/guias/          # 16 MDX files (long-tail SEO)
├── data/
│   ├── empresas.ts         # 14 distribuidoras: RUT, razón social, dirección legal
│   ├── tarifas.ts          # Tarifas SEC/SISS publicadas + helpers validarCobro
│   ├── elegibilidad-subsidio.ts, internet-planes.ts, comunas.ts, ...
│   └── CHANGELOG-data.md
└── lib/
    ├── parsers/            # Engine de parsing por empresa (ver abajo)
    ├── storage/historial.ts# Wrapper IndexedDB
    ├── sernac/letter.ts    # PDF generation con pdf-lib
    ├── seo.ts              # buildMetadata + JSON-LD generators
    ├── guias.ts, guias-utils.ts
    └── validators/rut.ts   # Algoritmo módulo 11
```

## Pipeline de parsing

```
File (PDF | image)
   ↓
extractTextFromBoleta()
   ├── application/pdf  → extractTextFromPDF()  (pdfjs-dist)
   │     ↓ si texto < 50 chars (escaneo)
   │     └→ rasterizePdfFirstPage() + extractTextFromImage()
   └── image/*          → preprocessImageForOcr() + extractTextFromImage()
         ↓
       Tesseract.js (Web Worker, español)
   ↓
detectParser(text)
   1. RUT-first (regex tolerante a OCR: espacios/comas como separadores)
   2. Per-parser detect()
   3. Fallback: substring match normalizado (sin acentos ni puntuación)
   ↓
ParserModule.parse(text) → ParsedBoleta
   ├── extractPeriodo, extractConsumo, extractCargos
   ├── detectarSospecha por cargo
   │     ├── heurísticas textuales (Reposición sin corte, Cargo único, etc.)
   │     └── tarifa-aware (compara contra tarifas.ts via validarCobro)
   └── totales, cliente, fechas
```

### Familias de parsers compartidas

- **`_saesa-family.ts`**: SAESA + Frontel (mismo template Grupo SAESA)
- **`_siss-family.ts`**: Aguas Andinas + ESSBio + Nuevosur (template SISS estándar)
- **CGE, Enel, Chilquinta, Esval, SMAPA, Metrogas, Lipigas, Abastible, Gasco GLP** tienen layouts propios

### Heurísticas de sospecha

Cada parser implementa `detectarSospecha(cargo, text, ...)` con dos tipos de regla:

1. **Textuales**: e.g. "Reposición" sin contexto de "corte" → flag
2. **Tarifa-aware** (CGE, Aguas Andinas): compara cargo extraído vs valor regulatorio publicado por SEC/SISS via `validarCobro()`. Bandas: ±5% OK, 5-20% sospechoso, >20% cobro indebido probable.

## Privacy boundaries

| Boundary | Cómo se enforza |
| --- | --- |
| Boleta nunca sale del browser | `extractTextFromBoleta` corre en cliente; sin `fetch` al backend con el archivo |
| OCR worker same-origin | Tesseract assets en `/public/tesseract/`, copiados via `scripts/setup-tesseract.mjs` en postinstall |
| Histórico solo local | `idb` wrapper sin replicación remota; export/import vía JSON manual |
| Sin tracking | No analytics, no pixel, no cookies de marketing |
| Headers de hardening | `next.config.ts` setea HSTS, X-Frame-Options DENY, CSP same-origin, Permissions-Policy |

## Testing

- **Unit (Vitest)** ~390 tests cubriendo parsers, helpers, SEO, RUT validator, OCR guards, dataset-sync, cross-empresa rejection, sospechas
- **E2E (Playwright)** ~45 tests cubriendo SEO metadata, a11y, OCR pipeline end-to-end, security headers, health check
- **Fixtures**: 13 boletas reales en `src/lib/parsers/__fixtures__/{empresa}-real-{period}.ts` — niveles A+/A/C documentados por fixture

Test sistémicos clave:
- `dataset-sync.test.ts`: cada parser declara el RUT exacto de `empresas.ts`
- `cross-empresa.test.ts`: ningún parser acepta fixtures de otras empresas (53 assertions)
- `fixtures-detect.test.ts`: cada fixture es detectado por el parser correcto

## Deployment

- **Vercel** (estático + edge functions para `/api/og`)
- **postinstall** copia worker de `pdfjs-dist` y assets de `tesseract.js` a `public/`
- **CI**: GitHub Actions corre lint, typecheck, unit, E2E (`.github/workflows/ci.yml`)
- **Bundle budget guard**: `pnpm check:bundle-size` falla CI si supera 3500 kB total / 600 kB chunk más grande (overrideable via `BUDGET_KB_TOTAL` / `BUDGET_KB_FIRST`)
- **Health check**: `GET /api/health` para uptime monitoring

## Cosas que NO debe hacer la app

- Subir archivos a un servidor (rompe la promesa privacy-by-design)
- Agregar tracking / analytics third-party (mismo)
- Acceptar como input boletas con datos personales no anonimizados en commits o issues
- Embedearse en iframes (CSP `frame-ancestors 'none'`)

## Contribuir

1. Lee este doc + `AGENTS.md`
2. `pnpm install` (corre postinstall que setea pdfjs + tesseract)
3. `pnpm dev`
4. Para agregar un parser nuevo: ver `src/lib/parsers/__fixtures__/README.md`
5. Para agregar una guía: nuevo MDX en `src/content/guias/` con frontmatter completo
