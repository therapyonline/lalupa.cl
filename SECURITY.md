# Política de seguridad

## Reportar una vulnerabilidad

Si encontraste una vulnerabilidad de seguridad en lalupa.cl, sea en el código, en el pipeline de parsing, en la cadena de dependencias o en headers de hardening, agradecemos un reporte privado antes de divulgarla públicamente.

**Canal**: enviar email a [seguridad@lalupa.cl](mailto:seguridad@lalupa.cl).

Por favor incluí:

- Descripción del problema y por qué creés que es un riesgo de seguridad.
- Pasos reproducibles (commit / URL / payload mínimo).
- Si aplica, una propuesta de fix.

## Qué considerar como vulnerabilidad

Lalupa.cl es **privacy-by-design**: las boletas se procesan íntegramente en el navegador del usuario y no se envían a servidores de la app. Son particularmente críticos los reportes que afecten esa garantía:

- Cualquier filtración de datos del usuario (boleta, RUT, dirección) hacia un origen no controlado.
- Bypass de la CSP, HSTS, X-Frame-Options o `frame-ancestors 'none'`.
- XSS, inyección de markup en MDX, smuggling vía PDF/imagen.
- Asset de OCR (Tesseract) servido desde origen externo o tampered.
- Vulnerabilidades de dependencias (alto / crítico) sin patch disponible.

## Qué NO es vulnerabilidad

- Falsos positivos del parser (esos son bugs de exactitud, abrir issue normal).
- Diferencias entre tarifa publicada y tarifa esperada (los datos regulatorios cambian; mantenelos actualizados via PR a `src/data/tarifas.ts`).
- Falta de soporte para una empresa específica (es feature request).
- Comportamiento dependiente de extensiones de browser que el usuario instaló.

## Tiempos de respuesta

Como proyecto chico, no comprometemos SLA estricto. Aspiramos a:

- **Acuse de recibo**: 72 horas hábiles.
- **Triage inicial**: 1 semana.
- **Patch para issues críticos**: dentro de 30 días desde confirmación.

Si tu reporte se considera válido, te acreditamos en el commit / changelog (si querés) o lo dejamos anónimo.

## Versiones soportadas

Solo la rama `main` recibe parches de seguridad. La app es un sitio estático servido desde Vercel; cada deploy es la única versión vigente.

---

Gracias por ayudar a mantener lalupa.cl segura para sus usuarios.
