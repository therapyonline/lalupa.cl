# lalupa.cl

Herramienta web chilena de defensa al consumidor. Subes una boleta de servicios básicos (luz, agua, gas, internet) y la lupa detecta cobros sospechosos contra las tarifas vigentes publicadas por SEC / SISS.

**Privado por construcción**: todo el parsing y el OCR corren en tu propio navegador. Las boletas nunca se suben a un servidor.

## Empresas soportadas

- **Luz**: CGE, Enel, SAESA, Frontel, Chilquinta
- **Agua**: Aguas Andinas, Esval, ESSBio, Nuevosur, SMAPA
- **Gas**: Metrogas (red), Lipigas, Abastible, Gasco GLP (cilindros)
- **Internet**: comparador de planes (Movistar, VTR, GTD, Mundo, Entel)

## Desarrollo

```bash
pnpm install   # corre postinstall (pdfjs worker + tesseract assets)
pnpm dev       # http://localhost:3000
```

### Scripts

```bash
pnpm lint               # ESLint
pnpm test               # Vitest watch
pnpm test:run           # Vitest one-shot
pnpm test:coverage      # Coverage v8
pnpm test:e2e           # Playwright (requiere build previo)
pnpm test:e2e:install   # Instala chromium para Playwright
pnpm build              # next build
pnpm check:bundle-size  # Verifica budget de bundle (3500/600 kB)
```

### CI

GitHub Actions corre lint, typecheck (build), unit tests, E2E y budget de bundle en cada PR a `main`. Ver `.github/workflows/ci.yml`.

## Arquitectura

Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para el mapa del código, pipeline de parsing, decisiones de privacy-by-design y testing.

Stack:

- Next.js 16 (App Router, RSC, Turbopack)
- TypeScript estricto + ESLint
- Tailwind v4 con tokens custom
- pdfjs-dist + tesseract.js (self-hosted)
- idb (IndexedDB para histórico local)
- pdf-lib (carta SERNAC)
- next-mdx-remote (guías editoriales)

## Aportar

1. Lee `ARCHITECTURE.md` y `AGENTS.md`.
2. Para parsers nuevos: ver `src/lib/parsers/__fixtures__/README.md`, el flujo es agregar fixture redactado, escribir `parse()`, sumar tests cross-empresa.
3. Para guías nuevas: agregar MDX en `src/content/guias/` con frontmatter completo.

---

Herramienta referencial. Para reclamos formales: SERNAC, SEC, SISS.
