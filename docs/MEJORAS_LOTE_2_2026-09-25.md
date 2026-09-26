# Segundo lote: lectura de documentos y protección de datos locales

Fecha: 25 de septiembre de 2026. Cambios implementados y verificados en el repositorio local; no se desplegó ni publicó una nueva versión. Continúa los dos primeros pendientes de `docs/MEJORAS_IMPLEMENTADAS_2026-09-25.md`. Las mejoras editoriales y SEO del primer lote se mantienen.

## 1. PDF.js, OCR y recursos reproducibles

### Dependencias y distribución

- **PDF.js 5.7.284 → 6.3.289**, con worker de la misma instalación. Next.js permanece en 16.3.6 y Tesseract en 7.0.0. Runtime declarado: Node `^22.13.0 || >=24.0.0`; pnpm 10.33.4 alineado con CI. Evidencia: `package.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`.
- El [aviso oficial GHSA-hq66-cqwq-w95j](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) explica el parche incorporado desde 6.2.108. Sus condiciones incluyen scripting del visor y ausencia de CSP; este repositorio usa extracción de documentos. La actualización no demuestra que el sitio anterior fuera explotable. [Versión oficial adoptada](https://github.com/mozilla/pdf.js/releases/tag/v6.3.289).
- `scripts/setup-parser-assets.mjs` resuelve las dependencias enlazadas por pnpm; no elige una carpeta arbitraria de `.pnpm`. Prepara worker PDF, CMaps, fuentes estándar, WASM, worker/core OCR y modelo español. Conserva las licencias distribuidas por los paquetes.
- Las URLs contienen una huella del contenido: `/parser-assets/pdf-<hash>/` y `/parser-assets/ocr-<hash>/`. Librería y worker dejan de depender de una URL mutable con un año de caché. `next.config.ts` aplica `immutable` a estos bundles; el icono y las rutas antiguas revalidan.
- El modelo español se descarga de `https://tessdata.projectnaptha.com/4.0.0/spa.traineddata.gz`, con SHA-256 fijado, límite de descarga, timeout y reintentos. Hash esperado: `6cd52c545bceeacb2e43fad64fc0703a711c482ba20d1ca4b6915c09de9973e6`. Un archivo ausente o incorrecto hace fallar la preparación. No se descarga ese modelo de un tercero durante la lectura del usuario.
- `postinstall`, `prebuild` y `predev` ejecutan la preparación. `src/generated/parser-assets.ts` contiene solo las rutas; el manifiesto con tamaños y hashes no se importa desde la aplicación. Los recursos generados y la caché local se excluyen de Git. `scripts/setup-tesseract.mjs` mantiene compatibilidad con el comando anterior.

### Lectura de archivos

- `src/lib/parsers/pdf.ts` procesa cada página. Las páginas con menos de 50 caracteres alfanuméricos pasan por rasterización y OCR, aunque otras páginas del mismo PDF tengan texto. Conserva los saltos de línea del primer lote mediante `pdf-text.ts`.
- Entrada máxima **10 MB**, PDF máximo **10 páginas**, fotos máximo **5 por carga**. Un PDF más largo se rechaza explícitamente. El canvas se limita antes de reservarlo a **4 millones de píxeles y 2.400 px por lado**; se libera tras crear la imagen. Las páginas y el documento se liberan también ante errores. `src/lib/parsers/file-input.ts`, `pdf.ts`, `engine.ts`.
- Si falla una página/foto, la operación informa cuál falló; no devuelve silenciosamente solo las páginas exitosas. El progreso incluye número de página. Se infiere MIME por extensión únicamente cuando el navegador no aporta MIME. `engine.ts`, `use-boleta-upload.ts`.
- `src/lib/parsers/ocr.ts` serializa los trabajos del worker y dirige el progreso al consumidor actual. Descarta el worker ante fallo y conserva timeout global de 90 segundos por trabajo OCR. Un trabajo que vence durante el arranque no inicia reconocimiento tardío tras recuperar el worker.

## 2. Historial: evitar sobrescrituras, mezclas y dobles totales

- La identidad anterior podía colisionar entre suministros con empresa, período y total iguales. `src/lib/storage/boleta-identity.ts` calcula SHA-256 de la lectura y datos del suministro, incluyendo cargos, consumo y texto. Repetir una lectura se deduplica; lecturas distintas se conservan. El hash es identidad, **no cifrado**.
- No se borraron ni reescribieron registros existentes. IndexedDB sigue en versión 1; guardar de nuevo una lectura con clave antigua devuelve esa clave. La exportación JSON cambia a **formato 2**, que es independiente de la versión de IndexedDB. `src/lib/storage/historial.ts`.
- `historial-schema.ts` es el contrato utilizado por producción y pruebas. Valida empresas/servicios/unidades compatibles, fechas reales, períodos ordenados, números finitos y tamaños. Acepta respaldos **v1 y v2**, con `null` para fechas desconocidas. Una fecha inventada o imposible se rechaza.
- Importación limitada a **10 MB y 500 registros**, antes de cargar el contenido completo. Valida todo el lote antes de escribir; recalcula identidades en lugar de confiar en los IDs suministrados y escribe en una transacción. No se sobrescriben boletas locales por repetir un ID externo. `historial.ts`.
- El camino habitual consulta claves v2 sin volver a calcular hashes de todo el historial. La compatibilidad con registros antiguos sigue necesitando leer y comparar su contenido.
- `src/lib/storage/comparable-boletas.ts` compara solamente períodos anteriores de un suministro identificable, usando empresa, servicio y cliente/dirección normalizados. Sin identidad o fechas suficientes, no ofrece una comparación potencialmente mezclada. `src/components/parsers/ComparativaSection.tsx` añade reintento y descarta respuestas de cargas obsoletas.
- El tracker usa la última lectura guardada por suministro/período para sus totales. Las versiones anteriores se conservan en una sección accesible; las fechas desconocidas se muestran aparte y no se asignan artificialmente a un mes. Las compras de productos y suministros sin identificación no se fusionan. `src/app/tracker/_components/tracker.tsx`.
- **Importar ya está disponible con el tracker vacío**. Si falla IndexedDB, la conexión puede reintentarse; la UI no asegura que los datos sigan intactos sin poder leerlos. `historial.ts`, `tracker.tsx`.
- `src/components/parsers/SaveButton.tsx` asocia el estado de guardado con la lectura concreta. Agregar una foto permite guardar la nueva versión, aunque la anterior ya estuviera guardada. Una respuesta asíncrona antigua no sustituye el estado de otra operación de guardado.

## 3. Recuperación de formularios

- `src/lib/storage/wizard-state.ts` valida versiones, límites de pasos, estructura y tamaño de los borradores. Las respuestas del subsidio deben corresponder al tipo, opciones y límites de las preguntas reales de `src/data/subsidio-electrico.ts`; se admiten borradores parciales válidos del formato anterior.
- JSON malformado, pasos negativos/fuera de rango y almacenamiento bloqueado dejan un formulario utilizable con aviso. Si no se puede persistir, se puede continuar en memoria, avisando del riesgo de perder cambios al salir. `src/app/subsidio-electrico/_components/wizard.tsx`, `src/app/reclamar-sernac/_components/wizard.tsx`.
- Un borrador SERNAC se vincula a la boleta de origen mediante hash de su payload validado. Al recibir otra boleta, se regeneran empresa, hechos y petición conservando los datos personales. El borrador anterior queda recuperable mediante botón; se conserva una sola versión anterior.
- Reiniciar limpia también la boleta de origen y el borrador anterior, evitando que reaparezcan al recargar. El PDF generado se invalida al editar, reiniciar o recuperar otro borrador; sus object URLs se liberan. Una generación pendiente no publica un PDF desactualizado.

## 4. Seguridad de dependencias y CI

`pnpm audit --json`, incluyendo dependencias de desarrollo, devuelve **0 avisos conocidos** en la consulta guardada. No equivale a ausencia de vulnerabilidades propias, problemas no publicados ni vulnerabilidades en la versión desplegada.

- Se actualizaron transitivas compatibles y Vitest/UI/cobertura a 4.1.11.
- `package.json` declara overrides acotados para rangos vulnerables de `brace-expansion` (1.1.18 y 5.0.9), Vite (8.0.16) y PostCSS (8.5.23). Revisarlos al actualizar sus dependencias padre y retirarlos cuando ya no sean necesarios; no forzar un único major de `brace-expansion` sobre todos los consumidores.
- CI añade `pnpm audit --audit-level=high`. La ejecución remota de GitHub Actions queda pendiente de publicar los cambios; se verificaron localmente sus comandos relevantes.
- Se añadió `fake-indexeddb` **solo para desarrollo**. Los tests anteriores de importación comprobaban constantes conceptuales, sin ejecutar el contrato real. Ahora prueban schema y operaciones de IndexedDB: deduplicación, respaldo/restauración, compatibilidad, límites, errores y reintentos. `src/lib/storage/historial-import-validation.test.ts`.

## 5. Validación y evidencia

| Comprobación | Resultado final |
| --- | --- |
| `pnpm install --frozen-lockfile --offline` | Correcto; lockfile consistente y postinstall completo con caché local |
| Preparación de recursos en carpeta temporal vacía | Descarga oficial del modelo; 213 archivos verificados contra tamaño/SHA-256; manifiesto igual al del proyecto |
| Segunda preparación de recursos | Manifiesto idéntico; reutiliza modelo verificado |
| `pnpm build` | Correcto; Next.js 16.3.6, TypeScript y prerender completos |
| `pnpm lint`, `pnpm lint:tono` | Correctos |
| `pnpm test:coverage` | **799 pruebas, 46 archivos, todas correctas** |
| Cobertura del ámbito de parsers | Statements **89,30%**, ramas **78,22%**, funciones **91,62%**, líneas **90,25%** |
| `PORT=3101 CI=1 pnpm exec playwright test --workers=3 --retries=0` | **106/106 en Chromium**, servidor nuevo y sin reintentos |
| `pnpm check:bundle-size` | **2.270 kB** de chunks JS; mayor **455 kB**; presupuestos de 3.500/600 kB cumplidos |
| Auditoría local de rendimiento | Pasan las cuatro rutas; FCP/LCP 56–64 ms, CLS máximo 0,0002 en esta ejecución local de escritorio |
| `pnpm audit --json` | **0 avisos conocidos** en todas las severidades reportadas |
| `git diff --check` | Correcto |

Las pruebas de navegador incluyen PDF nativo, PDF mixto con cargos en página escaneada, segunda lectura en la misma sesión, rechazo explícito de 11 páginas, bytes del worker coincidentes con el manifiesto, guardado después de agregar una foto, importación/exportación sin fechas, reintento de IndexedDB y recuperación de ambos formularios con storage bloqueado. La suite existente de SEO, OCR y axe permanece activa; axe excluye contraste y no constituye una certificación completa de accesibilidad.

Los presupuestos y la cobertura no se relajaron. El JS agregado pasó de 2.195 a 2.270 kB frente al primer lote; el mayor chunk, de 432 a 455 kB. La actualización y validaciones añaden tamaño, aunque siguen dentro del presupuesto. Los recursos OCR/PDF publicados ocupan aproximadamente 33 MB en disco y no equivalen al JS inicial transferido a una página.

**Estas mediciones son sintéticas, locales y de escritorio: no son CWV de usuarios reales, Lighthouse móvil ni mejora de ranking.** No hay nuevos datos de Search Console ni incremento de tráfico medido. La instalación offline presupone caché ya disponible; una instalación realmente nueva requiere descargar dependencias y el modelo. El build todavía obtiene Google Fonts.

Logs y manifiesto: `docs/mejoras/2026-09-25-lote-2/`. Los borradores y boletas usados en las pruebas son sintéticos. No se copiaron datos de usuarios al informe.

## 6. Límites y siguiente orden de trabajo

1. **Tarifas y revisión editorial**: validar referencias por fecha, zona, régimen e impuestos; mantener resultado no verificable cuando no haya referencia aplicable. Revisar las restantes guías priorizadas en `docs/SEO_Y_PLAN_REVISADO_2026-09-24.md` antes de extender afirmaciones. Este lote no cambia precios ni reglas de elegibilidad.
2. **Publicación y SEO medible**: desplegar una versión revisada, comprobar HTML público, sitemap y canonical/noindex; anotar la fecha efectiva y comparar ventanas equivalentes de 28 días en Search Console para gas/CGE. Nada de esto se presenta como ya publicado.
3. **Corpus y compatibilidad**: ampliar PDF reales anonimizados, Safari/iOS y dispositivos móviles con poca memoria. El umbral por página no detecta todas las mezclas de imagen y texto dentro de una misma página; el límite de canvas no limita toda la memoria interna del decodificador. Una página vacía que no produzca texto OCR puede rechazar el documento completo.
4. **Continuidad de despliegues**: las rutas con hash evitan mezclar bytes de versiones distintas, pero no aseguran que una pestaña antigua encuentre assets retirados por el hosting. Definir retención de recursos o recarga guiada al publicar. La segunda lectura del test no simula un despliegue entre dos versiones.
5. **Modelo de datos**: la identidad es una huella de lectura, no un folio fiscal ni prueba de que dos OCR diferentes sean el mismo documento. Sin identificación fiable, el tracker conserva las lecturas separadas. Versiones históricas numerosas todavía requieren trabajo adicional para indexación y selección manual.
6. **Operación y conversión**: conservar métricas agregadas sin OCR/datos personales; separar fallos técnicos de baja calidad del archivo. La cancelación total de trabajos OCR en cola al navegar y un sistema de seguimiento de conversiones con privacidad no se implementaron aquí.

| Próxima iniciativa | Área | Impacto | Esfuerzo | Riesgo de regresión |
| --- | --- | --- | --- | --- |
| Referencias tarifarias aplicables y revisión editorial priorizada | Frontend/datos/contenido | Alto | L | Alto: cambia conclusiones y mensajes |
| Publicación verificable y medición GSC de gas/CGE | DevOps/SEO | Alto | S | Medio: caché, indexación y cambios de contenido |
| Corpus PDF y validación Safari/iOS de baja memoria | Frontend/QA | Alto | M | Medio: OCR y formatos heterogéneos |
| Política de retención de recursos entre despliegues | DevOps | Medio | M | Medio: interacción entre hosting y caché |
| Identidad por folio y revisión de versiones ambiguas | Frontend/datos/UI | Medio | M | Alto: historial existente |
| Fuentes de build locales y métricas de conversión privadas | DevOps/Frontend | Medio | M | Bajo/medio |
