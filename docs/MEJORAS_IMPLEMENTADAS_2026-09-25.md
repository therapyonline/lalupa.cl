# Primer lote de mejoras: SEO, confianza y confiabilidad

Fecha: 25 de septiembre de 2026. Implementación local sobre el commit base `7976a8d`, conforme al orden de `docs/SEO_Y_PLAN_REVISADO_2026-09-24.md`. No es un despliegue ni el cierre del roadmap completo. Los informes del 24 de septiembre conservan su carácter de diagnóstico previo.

## Cambios implementados

### 1. Contenido con mayor adquisición orgánica

- **Gas:** corregida la equivalencia de consumo y la recuperación de inversión. Ejemplo coherente: cinco cilindros al año, 1.020 kWh, costo de red supuesto de $89.400/año frente a $125.000 en cilindros, ahorro de $35.600; una inversión de $200.000 tarda 5,62 años en recuperarse bajo esos supuestos. Precios y factores se identifican como ilustrativos. Se retiraron porcentajes de ahorro, precios nacionales, plazos y afirmaciones regulatorias universales sin respaldo. Fuentes CNE y SEC enlazadas en contexto. `src/content/guias/gas-red-vs-cilindro-cual-conviene.mdx`.
- **CGE:** distingue precio de cada componente, costo promedio, unidades, impuestos y saldos. Se retiró la cifra de mayo presentada como vigente universal y se explica cómo localizar opción, zona y período en la fuente oficial. No se afirma haber verificado un tarifario vigente de CGE: su sitio bloqueó la consulta automatizada. Se corrigieron promesas de validación y plazos generales. `src/content/guias/como-leer-boleta-cge.mdx`.
- Las dos guías mantienen URL, fecha de publicación y anclas anteriores; CGE conserva un alias para el encabezado antiguo de servicio público. Cambió `updatedAt` a la fecha de esta revisión sustantiva. Sus FAQ, descripciones, OG y cuerpo reflejan el mismo alcance.
- Se agregó criterio editorial y enlace desde la firma colectiva. La firma no se presenta como un experto individual ni como acreditación jurídica. `src/app/sobre/page.tsx`, `src/app/guias/[slug]/page.tsx`, `src/lib/seo.ts`.

Fuentes principales utilizadas: [Gas de Red CNE](https://gasdered.cne.cl/), [Gas en Línea CNE](https://gasenlinea.gob.cl/), [régimen de gas CNE](https://www.cne.cl/tarificacion/hidrocarburos/informe-tecnico-bienes-eficientes/), [reclamos SEC](https://www.sec.cl/area-ciudadana/reclamos-y-la-sec/), [instaladores SEC](https://www.sec.cl/area-ciudadana/licencia-de-instaladora-o-instalador/), [IVA SII](https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_0572.htm), [consumidores SERNAC](https://www.sernac.cl/portal/617/w3-propertyvalue-518.html). No se extrajeron precios actuales de esos portales para los ejemplos.

### 2. Descubrimiento y recorrido móvil

- Índice desplegable nativo y enlaces a herramientas disponibles en móvil; no necesitan JavaScript adicional. `src/app/guias/[slug]/page.tsx`.
- Portada destaca gas, CGE y alza eléctrica; selección editorial de artículos relacionados para gas y CGE. `src/app/page.tsx`, `src/lib/guias-utils.ts`.
- El sitemap deja de inventar una fecha actual para rutas estáticas en cada build. Las guías usan su revisión real y las categorías, la revisión más reciente de sus guías. `src/app/sitemap.ts`.
- Robots permite rastrear las pantallas con `noindex`, para que el buscador lea esa directiva. Resultados y tracker siguen fuera del sitemap. Sus datos personales permanecen en el navegador; robots no constituye un control de privacidad. `src/app/robots.ts` y páginas dinámicas de boletas.
- La descripción del comparador ya no promete filtrar por cobertura comunal. `src/app/comparador-internet-hogar/page.tsx`.
- Se usa efectivamente `ogTitle`. La firma Equipo lalupa se representa como `Organization`. Los comentarios de FAQ/HowTo ya no prometen resultados enriquecidos. `src/lib/seo.ts`, `src/app/guias/[slug]/page.tsx`.
- Metadatos editoriales validados con Zod: fechas de calendario, orden de fechas, categoría, herramientas y concordancia de slug/archivo. Los errores de contenido interrumpen el build; no eliminan silenciosamente documentos del listado. Solo un archivo inexistente genera el retorno normal de ausencia. `src/lib/guias-frontmatter.ts`, `src/lib/guias.ts`.

### 3. Resultados y reclamos que reflejan lo realmente comprobado

- Resumen común para luz, agua y gas. Una lectura incompleta no informa que todos los cargos se verificaron contra tarifas vigentes. Se explicitan los límites aun cuando no se detectan alertas. `src/components/parsers/ResultSummary.tsx`.
- Detección compartida de período inválido/invertido, cargos ausentes o no finitos, consumo ambiguo y total no finito. Las compras de cilindros no requieren período de consumo. El modelo aún representa ausencia de consumo con cero: se informa como ambigüedad, no se certifica completitud. `src/lib/parsers/extraction-quality.ts`, `src/components/parsers/PartialExtractionAlert.tsx`.
- Una diferencia negativa se distingue de un posible exceso; entradas no finitas no generan conclusiones tarifarias. Diferencias grandes ya no equivalen automáticamente a cobros indebidos. Las referencias antiguas se identifican como históricas. `src/data/tarifas.ts`, `src/lib/parsers/electricidad/cge.ts`, `src/lib/parsers/agua/_siss-family.ts`.
- El cálculo de agua ya no recorta volumen fuera de punta ni duplica consumo cuando no se conoce un límite. Esto corrige el algoritmo; no actualiza ni certifica las tablas históricas. `src/data/tarifas.ts`.
- El borrador no inventa una gestión previa con la empresa, no confunde emisión con recepción y no pide devolver el total de todos los cargos señalados. Solicita aclaración y corrección de la diferencia que se determine. El usuario debe completar y verificar sus hechos. `src/lib/sernac/letter.ts`.

### 4. PDF, OCR y fechas

- Se conservan saltos explícitos y cambios de línea del PDF, necesarios para extraer cargos separados. Se liberan páginas y documento tras extraer texto, incluso ante error. `src/lib/parsers/pdf-text.ts`, `src/lib/parsers/engine.ts`.
- Se corrigió el límite inclusivo de Otsu que podía transformar tinta negra en blanco, el centinela del percentil inferior y el tratamiento de imágenes uniformes. `src/lib/parsers/image-preprocess.ts`.
- Fechas imposibles como 31/02 o 01/13 se rechazan en vez de convertirse en otro día válido. `src/lib/parsers/_helpers.ts`.
- Pruebas nuevas de OCR cubren reutilización, progreso, error de arranque, reconocimiento insuficiente, timeout y liberación de worker. No equivalen a validar todos los modelos de boleta ni todos los navegadores.

### 5. Privacidad, dependencias y CI

- Se retiró Microsoft Clarity del componente global y sus permisos de CSP. Una variable antigua configurada en el hosting ya no carga ese script. Se actualizaron la política y la documentación; Cloudflare Web Analytics sigue siendo opcional. `src/components/Analytics.tsx`, `next.config.ts`, `src/app/privacidad/page.tsx`, `ARCHITECTURE.md`.
- Next.js y `eslint-config-next`: **16.2.5 → 16.3.6**, con lockfile actualizado. La [publicación oficial 16.3.6](https://github.com/vercel/next.js/releases/tag/v16.3.6) y el [boletín de agosto](https://nextjs.org/blog/august-2026-security-release) sustentan la actualización. No se atribuye una explotación al sitio anterior ni se cambia el runtime Edge de OG. `package.json`, `pnpm-lock.yaml`.
- CI ejecuta ahora cobertura, con los umbrales existentes: líneas/funciones/statements 80% y ramas 75%. Se añadieron pruebas útiles en vez de reducir umbrales o excluir código. Artefactos de fallo incluyen `test-results/`. `.github/workflows/ci.yml`.
- Se reparó el selector de HEIC y la expectativa antigua que exigía bloquear por robots las rutas con noindex. `tests/e2e/ocr.spec.ts`, `tests/e2e/seo.spec.ts`.

## Verificación

| Comprobación | Resultado |
| --- | --- |
| `pnpm build` | Correcto con Next.js 16.3.6; TypeScript y prerender completados |
| `pnpm lint` y `pnpm lint:tono` | Correctos |
| `pnpm test:coverage` | 755 pruebas, 43 archivos, todas correctas |
| Cobertura de parsers | Statements 88,67%; ramas 76,99%; funciones 90,90%; líneas 89,59% |
| `pnpm exec playwright test --workers=3` | 95/95 correctas en Chromium, sin reintentos |
| `pnpm check:bundle-size` | 2.195 kB totales; chunk mayor 432 kB; dentro del presupuesto |
| `pnpm perf:audit:ci` | Pasa las cuatro rutas del script; medición local sintética |
| `git diff --check` | Sin errores de whitespace |

La cobertura de ramas previa era 70,87%; ahora supera el 75% ya configurado. El reporte se limita al ámbito de parsers definido por `vitest.config.ts`; no representa cobertura del repositorio completo.

Las pruebas E2E cubren el flujo de carga de un PDF nativo generado con `pdf-lib`, OCR real con Tesseract para imágenes sintéticas y la ausencia de garantías falsas en una lectura parcial. Las guías gas/CGE se comprueban a 390 px: índice visible al desplegar, destinos de anclas existentes, enlaces internos con respuesta correcta, autoría, fechas y ausencia de overflow horizontal. La suite también incluye axe en sus 14 rutas existentes; no es una certificación completa de accesibilidad de todos los artículos.

El rendimiento medido por el script es local, en escritorio y sin emulación de una red móvil. **No son Core Web Vitals de usuarios reales ni prueba de un aumento de ranking.**

Evidencia reproducible: `docs/mejoras/2026-09-25/` contiene logs de build, lint, unitarias/cobertura, navegador, bundle y rendimiento, más capturas móviles de ambas guías y el audit de dependencias. Los dos fallos de la primera ejecución E2E se corrigieron: la expectativa antigua de robots y un selector de alerta demasiado específico reutilizado en el caso de imagen blanca. La ejecución final completa pasó.

El build requiere acceso a Google Fonts durante la compilación. La restricción de red del sandbox impidió el primer intento; la comprobación definitiva se ejecutó con acceso de red autorizado. La independencia de fuentes externas en build sigue siendo una mejora pendiente.

## Próximos entregables y límites

**Actualización posterior:** los puntos 1 y 2 se abordaron en `docs/MEJORAS_LOTE_2_2026-09-25.md`, con sus límites explícitos. Ese informe contiene la validación vigente (799 unitarias, 106 E2E y audit sin avisos conocidos). Los resultados de este documento se conservan como evidencia del primer lote.

1. **PDF.js y assets:** migrar la versión mayor con su worker, comprobar compatibilidad y caché caliente; acotar rasterización antes de reservar canvas y mejorar OCR multipágina. La mejora de texto de este lote no cierra esas tareas.
2. **Datos y resiliencia:** identidad de boletas, importación/exportación de historial, validación de payloads persistidos y recuperación de los wizards. Mantener prioridad por posible pérdida o mezcla de información.
3. **Tarifas y revisión editorial:** fuentes con fecha, zona, régimen e impuestos; resultado explícito de “no verificable” cuando no existe referencia aplicable. Revisar alza eléctrica, BT-1/BT-2, deuda y demás guías antes de extender sus afirmaciones.
4. **SEO medible:** después de desplegar, comprobar HTML público, sitemap e indexación de gas/CGE. Anotar la fecha real de publicación y comparar ventanas equivalentes de 28 días en Search Console; el tamaño de la muestra no permite prometer aumento de CTR o atribuir causalidad. No hay mejoras de tráfico medidas todavía.
5. **Conversión con privacidad:** medir transiciones guía → herramienta y finalización útil sin texto OCR, datos de cliente ni grabación de sesiones. Ese sistema no se implementó en este lote.

El audit de dependencias de producción posterior conserva **9 avisos: 6 altos, 2 moderados y 1 bajo; ninguno crítico en la respuesta del registro**. Incluye PDF.js, js-yaml y dependencias de tooling. Es un inventario, no prueba de explotación. Revisar alcance y parches compatibles por dependencia. Evidencia: `docs/mejoras/2026-09-25/dependencias-produccion.json`. No se declara “cero vulnerabilidades”.
