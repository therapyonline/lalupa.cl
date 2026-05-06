# lalupa.cl

Herramienta web chilena de defensa al consumidor. Subes una boleta de servicios básicos (luz, agua, gas, internet) y la lupa detecta cobros sospechosos.

Privado por construcción: todo el parsing ocurre en tu navegador. Las boletas nunca se suben a un servidor.

## Stack

- Next.js 16 — App Router
- TypeScript estricto
- Tailwind CSS v4
- pdfjs-dist (parsing de PDF)
- tesseract.js (OCR de imágenes, lazy)
- zod, date-fns, lucide-react, clsx, tailwind-merge

## Desarrollo

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

Herramienta referencial. Para reclamos formales: SERNAC, SEC, SISS.
