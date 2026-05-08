# Fixtures de boletas

Strings extraídos con `extractTextFromPDF` desde PDFs reales, para usar en
los tests de cada parser. Convivimos con dos categorías:

| Sufijo | Significado |
| --- | --- |
| `-synthetic.ts` | Texto inventado a partir de FINGERPRINTS.md. Sirve hasta que llegue una boleta real. |
| `-real-YYYY-MM.ts` | Boleta real de un período específico. Reemplaza al sintético cuando llegue. |
| `-normal.ts` | Slot de "boleta típica" que apunta al fixture preferido (real si existe, sintético si no). |

## Estado actual (2026-05-07)

| Empresa | Estado | Archivo |
| --- | --- | --- |
| CGE | Sintético basado en FINGERPRINTS | [`cge-synthetic.ts`](./cge-synthetic.ts) |
| Enel | **FIXTURE PENDIENTE** | [`enel-normal.ts`](./enel-normal.ts) |
| SAESA | **FIXTURE PENDIENTE** | [`saesa-normal.ts`](./saesa-normal.ts) |
| Frontel | **FIXTURE PENDIENTE** | [`frontel-normal.ts`](./frontel-normal.ts) |
| Chilquinta | **FIXTURE PENDIENTE** | [`chilquinta-normal.ts`](./chilquinta-normal.ts) |

## Cómo agregar un fixture real

1. Descargar el PDF oficial desde el sitio de la distribuidora (no escaneado, debe ser nativo).
2. En la consola del navegador en `pnpm dev`, correr:
   ```ts
   const file = /* el File del input */
   const text = await extractTextFromPDF(file)
   navigator.clipboard.writeText(JSON.stringify(text))
   ```
3. Pegar el JSON en `__fixtures__/{empresa}-real-{año-mes}.ts` como `export const X_REAL_YYYY_MM = '...'`.
4. Actualizar `{empresa}-normal.ts` para que re-exporte el real.
5. Activar los `it.todo()` correspondientes en `{empresa}.test.ts`.

## Privacidad

Los fixtures pueden contener datos personales (RUT cliente, dirección, número de cliente). Antes de commitear, **anonimizar**:

- RUT cliente → `11.111.111-1`
- Dirección → `Av. Ejemplo 123, Comuna, Región`
- Número de cliente → `12345678-9`
- Email/teléfono → omitir o reemplazar

Los datos legales de la empresa (RUT, razón social, dirección) son públicos y se pueden mantener.
