# lalupa.cl, Arquitectura

Una herramienta gratuita para revisar boletas de servicios básicos en Chile. **Privacy-by-design**: el procesamiento ocurre íntegramente en el navegador del usuario, sin uploads ni cuentas.

## Decisiones clave

- **100% browser-side**: PDFs y fotos nunca dejan el dispositivo. El parser corre como JavaScript en el browser.
- **No backend, no DB remota**: Vercel sirve assets estáticos; el histórico vive en IndexedDB local.
- **No login**: sin cuentas remotas. Los formularios conservan borradores validados en sessionStorage; las boletas guardadas viven en IndexedDB. Cloudflare Web Analytics es opcional via env var, sin grabación de sesiones ni cookies de marketing.
- **Self-hosted dependencies**: Tesseract.js (OCR) y pdfjs-dist (PDF) servidos desde el mismo origen, sin CDNs externos.

## Stack

- **Next.js 16** (App Router, RSC, Turbopack) sobre Vercel estático
- **TypeScript estricto** + ESLint
- **Tailwind v4** con tokens custom (`cream`, `ink`, `accent`)
- **Vitest** para unit tests + **Playwright** para E2E
- **pdfjs-dist 6.3.289** + **tesseract.js 7** para extracción de texto; Node `^22.13.0 || >=24.0.0` y pnpm `10.33.4`
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
│   ├── tarifas.ts          # Referencias históricas no verificadas + simulaciones aritméticas
│   ├── elegibilidad-subsidio.ts, internet-planes.ts, comunas.ts, ...
│   └── CHANGELOG-data.md
└── lib/
    ├── parsers/            # Engine de parsing por empresa (ver abajo)
    ├── storage/            # IndexedDB, identidad, respaldos v1/v2 y esquemas de borradores
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
   ├── application/pdf  → extractPdfWithOcr() (pdfjs-dist, hasta 10 páginas)
   │     ↓ por cada página con <50 caracteres alfanuméricos
   │     └→ rasterizar (≤4 MP, lado ≤2400 px) + extractTextFromImage()
   └── JPG/PNG/WebP      → preprocessImageForOcr() + extractTextFromImage()
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
   │     └── heurísticas textuales (Reposición sin corte, Cargo único, etc.)
   └── totales, cliente, fechas
```

### Familias de parsers compartidas

- **`_saesa-family.ts`**: SAESA + Frontel (mismo template Grupo SAESA)
- **`_siss-family.ts`**: Aguas Andinas + ESSBio + Nuevosur (template SISS estándar)
- **CGE, Enel, Chilquinta, Esval, SMAPA, Metrogas, Lipigas, Abastible, Gasco GLP** tienen layouts propios

### Heurísticas de sospecha

Cada parser implementa reglas sobre conceptos y datos extraídos: p. ej. reposición sin mención de corte, ajustes o cambios de consumo. Una alerta pide revisión; no acredita ilegalidad.

**No hay validación automática de precios.** Desde el tercer lote se retiraron las comparaciones CGE/Aguas Andinas contra cifras históricas: `ParsedBoleta` no acredita zona/grupo, impuestos por línea ni referencia aplicable a todo el período. `ResultSummary` informa “Tarifa no verificada” en luz, agua y gas. La ausencia de alertas no certifica una boleta.

`src/data/tarifas.ts` conserva cifras originales para simulaciones, marcadas `historico_no_verificado`. Los componentes ausentes son `number | null`; los helpers rechazan referencias incompletas y consumos inválidos. Antes de reintroducir comparaciones monetarias se necesita un catálogo con documento/página verificables, intervalo de vigencia completo, ámbito geográfico, opción, temporada, unidad y base tributaria coincidentes. Referencia ausente, ambigua o período que atraviesa un cambio deben devolver un resultado no verificable, nunca una selección por defecto.

### Historial y borradores

- `boleta-identity.ts`: SHA-256 del contenido extraído y datos de suministro, sin confiar en IDs importados. Las claves antiguas se conservan; no hay migración destructiva de IndexedDB.
- `historial-schema.ts`: contrato único para guardado e importación. Exportación v2; importación v1/v2; fechas desconocidas como `null`. Límite de respaldo 10 MB/500 registros; una boleta inválida rechaza el lote completo.
- `comparable-boletas.ts`: compara períodos anteriores del mismo suministro identificable. Los resúmenes usan la última variante por suministro/período; las demás siguen visibles. Compras de productos y suministros desconocidos no se fusionan.
- `wizard-state.ts`: valida pasos, tipos y tamaños de borradores. Una boleta nueva se vincula a su reclamo mediante hash; se conserva el borrador anterior. Si falla sessionStorage, el formulario sigue funcionando en memoria con aviso.

## Privacy boundaries

| Boundary | Cómo se enforza |
| --- | --- |
| Boleta nunca sale del browser | `extractTextFromBoleta` corre en cliente; sin `fetch` al backend con el archivo |
| Recursos de lectura same-origin | Workers, modelos, WASM y fuentes en `/public/parser-assets/{motor}-{hash}/`; `scripts/setup-parser-assets.mjs` verifica el modelo y genera las rutas |
| Histórico solo local | `idb` wrapper sin replicación remota; export/import vía JSON manual |
| Sin grabación de sesiones | Clarity retirado; métricas agregadas Cloudflare opcionales, sin texto OCR ni datos de cliente |
| Headers de hardening | `next.config.ts` setea HSTS, X-Frame-Options DENY, CSP same-origin, Permissions-Policy |

## Testing

- **Unit (Vitest)** parsers, helpers, SEO, RUT, OCR/PDF, contratos e IndexedDB con `fake-indexeddb`; ver resultados fechados en `docs/MEJORAS_LOTE_2_2026-09-25.md`.
- **E2E (Playwright)** SEO, a11y, OCR/PDF mixtos, recursos, historial y recuperación de formularios en Chromium.
- **Fixtures**: 13 boletas reales en `src/lib/parsers/__fixtures__/{empresa}-real-{period}.ts`, niveles A+/A/C documentados por fixture

Test sistémicos clave:
- `dataset-sync.test.ts`: cada parser declara el RUT exacto de `empresas.ts`
- `cross-empresa.test.ts`: ningún parser acepta fixtures de otras empresas (53 assertions)
- `fixtures-detect.test.ts`: cada fixture es detectado por el parser correcto

## Deployment

- **Vercel** (estático + edge functions para `/api/og`)
- **postinstall / prebuild / predev** generan recursos con hash de contenido y manifiesto (`src/generated/`, ignorado en Git). Worker y librería corresponden a la misma dependencia instalada. El modelo español tiene SHA-256 fijado; una descarga inválida hace fallar la preparación.
- **Caché**: solo bundles de recursos con hash reciben `immutable`; las URLs antiguas y el icono sin hash revalidan. No garantiza continuidad de pestañas abiertas entre despliegues si el hosting elimina recursos antiguos.
- **CI**: GitHub Actions corre audit (altas/críticas), lint, build/typecheck, cobertura con umbrales y E2E (`.github/workflows/ci.yml`).
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
