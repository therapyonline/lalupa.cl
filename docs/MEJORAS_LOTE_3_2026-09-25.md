# Mejoras implementadas: tercer lote

Fecha: 25 de septiembre de 2026. Continuación de `docs/SEO_Y_PLAN_REVISADO_2026-09-24.md` y `docs/MEJORAS_LOTE_2_2026-09-25.md`.

**Resultado:** se retiraron comparaciones monetarias que producían alertas sin una referencia aplicable; se revisaron íntegramente cinco guías prioritarias; se alinearon portada, descripciones estructuradas y resultados con las capacidades reales del lector. Implementado y verificado localmente; no desplegado.

## 1. Referencias tarifarias y corrección de alertas

### Problema comprobado

- `src/lib/parsers/electricidad/cge.ts` contrastaba todo cargo fijo con $1.048,46, independientemente del período, sector e impuestos. En `src/lib/parsers/sospechas.test.ts`, una boleta de abril de 2026 se comparaba con el importe atribuido a mayo: un cargo de $1.300 o $1.500 se marcaba como sospechoso.
- `src/lib/parsers/agua/_siss-family.ts` asignaba automáticamente Aguas Andinas al grupo 1. Contrastaba cargo fijo, agua y alcantarillado con una tabla histórica, incluso sin grupo confirmado y usando precio no punta para lecturas de febrero-marzo.
- `src/lib/parsers/types.ts` no contiene datos acreditados de zona/red/grupo, base tributaria por cargo o vigencia de una referencia. El nombre de la empresa y la cantidad consumida no completan ese contexto.

### Cambio implementado

Se retiraron esas comparaciones de los parsers. Se mantienen las reglas sobre conceptos y datos extraídos. No se sustituyó una constante antigua por otro precio supuesto.

`src/components/parsers/ResultSummary.tsx` muestra **“Tarifa no verificada”** en luz, agua y gas, explica qué falta contrastar y distingue ausencia de alertas de facturación correcta. Las pruebas `tests/e2e/tariff-review.spec.ts` verifican que se conservan cargos altos sin generar una alerta tarifaria injustificada y que el alcance es visible en móvil.

En agua se corrigió además una condición imposible: la palabra “reposición” estaba dentro del patrón que buscaba antecedentes de corte, de modo que el propio nombre del cargo desactivaba la alerta. Ahora se busca contexto de corte/suspensión/desconexión/reconexión y se prueban ambos casos en `src/lib/parsers/agua/aguasandinas.test.ts`. La explicación de ajustes por estimación ya no promete una relectura gratuita sin comprobar las condiciones.

### Estado real del catálogo

`src/data/tarifas.ts` conserva los importes originales **como referencias históricas no verificadas para simulaciones**. No hay nuevos precios acreditados en este lote.

- Los componentes ausentes son `number | null`; se eliminaron conversiones `null as unknown as number`.
- Los helpers rechazan consumos negativos/no finitos, límites inválidos y referencias incompletas o con componentes corruptos.
- Se corrigió la descripción de los helpers y se añadió estado `historico_no_verificado`, uso `simulacion`, revisión de alcance y vigencia final desconocida. La fecha original de los importes no se sustituyó por la fecha de revisión del código.
- Se retiraron insinuaciones de precios estimados y recargos no cotejados de las notas pendientes.

El [PDF CGE que citaba el catálogo](https://www.cge.cl/wp-content/uploads/2026/04/Tarifas_de_Suministro_Electrico_vigentes_a_partir_del_1_de_mayo_2026.pdf) respondió HTTP 403 durante la consulta. Esto no demuestra que sus importes sean incorrectos; impide presentar esa consulta como una verificación. Las demás cifras del catálogo tampoco se revalidaron en este lote.

**Límite:** todavía no existe un catálogo completo con selección de referencias aplicables. El estado mostrado es “no verificado”; no se implementó una certificación automática ni un motor nuevo de matching tarifario.

## 2. SEO y revisión editorial

Se preservaron las cinco URLs y sus fechas de publicación. `updatedAt` cambió a `2026-09-25` por revisión sustancial del contenido, no por una actualización artificial de fechas.

| Archivo bajo `src/content/guias/` | Corrección principal |
| --- | --- |
| `por-que-subio-mi-cuenta-de-luz.mdx` | Se eliminó texto placeholder, un promedio nacional sin respaldo y la promesa de diagnosticar exactamente el alza en 14 segundos. Nueva guía de consumo/días/precios/ajustes/deuda, con ejemplo de kWh por día. |
| `tarifa-bt1-vs-bt2-cual-conviene.mdx` | Se separan kW y kWh, medición y componentes de potencia. Se retiró el umbral universal de conveniencia y la promesa de recomendar automáticamente un cambio. Comparación anual y ejemplo expresamente inventado. |
| `cambiar-comercializadora-electrica-chile.mdx` | Se corrigieron umbral, unidades y condiciones de cambio con fuentes oficiales. Se eliminaron el uso incorrecto de PMG, precios y ahorros no acreditados, la supuesta portabilidad residencial por planes verdes y el HowTo que reproducía esos errores. |
| `deuda-electrica-convenios-pago-chile.mdx` | Se retiraron condonaciones y tasas prometidas sin fundamento, así como condiciones temporales presentadas como universales. Se explica cómo comparar una oferta y documentar discrepancias; fuentes CGE, BCN, SERNAC y SEC. |
| `lectura-estimada-medidor-luz-cuando-es-legal.mdx` | Revisión contra la norma de facturación provisoria. Se eliminaron fórmulas alternativas y umbrales de ilegalidad inventados, y se distingue el ajuste de energía de la conciliación de pagos. |

Cada guía incluye respuesta inicial a su intención de búsqueda, fuentes junto a las afirmaciones materiales, revisión fechada, enlaces internos y un alcance realista del lector. Las preguntas frecuentes del frontmatter se muestran en el acordeón existente y alimentan el JSON-LD desde el mismo contenido (`src/app/guias/[slug]/page.tsx`).

La prioridad viene del diagnóstico anterior: alza, BT-1/BT-2, comercializadora y deuda sumaban **400 impresiones sin clics**; lectura estimada, **104 impresiones y 2 clics**. Son cifras del export previo, **no resultados de estas mejoras**. No se consultó un nuevo período de Search Console.

El registro `docs/mejoras/2026-09-25-lote-3/fuentes-editoriales.json` identifica las fuentes y el alcance de cada consulta. Se evitó aplicar medidas extraordinarias de pandemia como reglas actuales y citar como vigente una versión legal con entrada en vigor futura.

## 3. Portada, mensajes y diseño

- `src/data/indicadores.ts` reemplaza cuatro cifras sin evidencia suficiente por recursos prácticos de consumo, tarifa, lecturas e historial. Se eliminó el helper que promediaba una muestra incompleta de tarifas como candidato a indicador nacional.
- `src/app/page.tsx` enlaza esos recursos, corrige el número de lectores a 17 (5 electricidad, 6 agua y 6 gas) y elimina la promesa de validar tarifas vigentes. Los módulos existentes en `src/lib/parsers/electricidad/index.ts`, `agua/index.ts` y `gas/index.ts` respaldan la cobertura declarada.
- `src/app/boleta-luz/page.tsx`, `boleta-agua/page.tsx` y `boleta-gas/page.tsx` corrigen las descripciones de aplicación en JSON-LD y las afirmaciones tarifarias afectadas. La página de gas ya no ofrece una comparación automática con precios SEC.
- `src/app/como-funciona/page.tsx` y `src/app/terminos/page.tsx` describen el alcance actual. Los términos muestran su fecha real de revisión.
- `src/app/tracker/_components/tracker.tsx` identifica las alertas almacenadas como tales y explica que no se recalculan al abrir el historial. **No se migraron ni borraron boletas o alertas antiguas.** Una nueva carga permite revisar el documento con el lector actual; el historial sigue conservando su lectura anterior.

Se reutilizaron tipografía, colores y componentes existentes. Las capturas móviles muestran el alcance tarifario junto al resumen del resultado; los artículos conservan índice móvil y tablas sin desbordamiento horizontal a 390 px.

## 4. Verificación

| Comprobación | Resultado final |
| --- | --- |
| `pnpm build` | Correcto, Next.js 16.3.6/Turbopack, TypeScript y prerender completos |
| `pnpm lint`, `pnpm lint:tono`, `pnpm exec tsc --noEmit` | Correctos |
| `pnpm test:coverage` | **811 pruebas / 46 archivos**, todas correctas |
| Cobertura del ámbito de parsers | Statements **89,43%**, ramas **78,32%**, funciones **91,62%**, líneas **90,42%** |
| `PORT=3101 CI=1 pnpm exec playwright test --workers=3 --retries=0` | **114/114 en Chromium**, servidor de producción nuevo, sin reintentos |
| `pnpm check:bundle-size` | **2.267 kB** de chunks JS; mayor **455 kB**, dentro de 3.500/600 kB |
| `git diff --check` | Correcto |

Se ampliaron las regresiones de referencias inaplicables y entradas aritméticas inválidas; se añadieron dos pruebas de reposición. El navegador cubre las cinco nuevas guías, además de las dos revisadas previamente: índice, destinos de anclas, enlaces internos, fecha de modificación, autor editorial, sitemap y ausencia de overflow. Los tres casos nuevos de resultados verifican el aviso tarifario y la ausencia de las falsas alertas de importe. La suite previa de OCR, almacenamiento, seguridad y accesibilidad sigue pasando.

Se revisaron visualmente las capturas de la guía de alza y el resultado CGE. Los ejemplos son sintéticos. Axe mantiene su exclusión previa de contraste: esto no es una certificación completa de accesibilidad, ni una prueba de Safari/iOS.

La primera compilación falló por el puerto de trabajo de Turbopack dentro del sandbox; un reintento mantuvo el fallo de caché. Se apartó únicamente la caché generada de Turbopack a una carpeta temporal y se recompiló con permisos locales autorizados. La compilación final pasó sin cambiar la configuración de Next.js.

Evidencia: `docs/mejoras/2026-09-25-lote-3/`. No se cambiaron dependencias, no se volvió a ejecutar auditoría de paquetes ni se midieron CWV de usuarios reales. Las cifras de bundle son archivos generados, no transferencia inicial ni prueba de un aumento de tráfico.

## 5. Siguiente orden de trabajo

| Iniciativa | Área | Impacto | Esfuerzo | Riesgo de regresión |
| --- | --- | --- | --- | --- |
| Referencias tarifarias verificadas por componente y ámbito, con selección temporal | Datos/Frontend | Alto | L | Alto: afecta conclusiones monetarias |
| Revisión del simulador de subsidio y demás contenido económico pendiente contra fuentes actuales | Datos/Contenido | Alto | M–L | Alto: beneficios y decisiones del usuario |
| Publicar versión revisada y comprobar HTML, canonical, sitemap, noindex y recursos | DevOps/SEO | Alto | S | Medio: caché e indexación |
| Medir consultas y páginas en ventanas GSC equivalentes tras recrawl | SEO | Alto | S más espera | Bajo; volumen pequeño limita inferencias |
| Revisión o recálculo explícito de alertas antiguas con versión del analizador | Datos/UI | Medio | M | Alto: conservar historial y datos originales |
| Corpus de documentos anonimizados, Safari/iOS y equipos con poca memoria | Frontend/QA | Alto | M | Medio |
| Retención de assets entre despliegues y fuentes de build locales | DevOps | Medio | M | Medio |

### Condiciones para reactivar comparaciones tarifarias

1. Fuente oficial archivada con URL, página, fecha de revisión y hash; importe y base tributaria por componente.
2. Intervalo de vigencia completo y correspondencia de empresa, zona/red/grupo, opción, unidad y temporada cuando aplique. No equiparar una fecha de inicio con vigencia indefinida.
3. Contexto acreditado de la boleta: datos ausentes o ambiguos producen “no verificable”. Un período que atraviesa un cambio exige cálculo documentado por tramos o permanece sin comparación.
4. Casos de prueba que cubran coincidencia válida, fecha anterior/posterior, zona distinta, impuestos incompatibles, referencias múltiples y datos incompletos.
5. Mostrar fuente y alcance al usuario, diferenciando discrepancia aritmética de cobro indebido.

Estos requisitos quedan documentados; no se presenta ese motor como implementado. La siguiente revisión de contenido debe cubrir los beneficios del simulador y las guías restantes antes de ampliar promesas públicas.

La publicación sigue pendiente. Después de ella, registrar la fecha efectiva y comparar al menos 28 días completos tras el recrawl, separando las páginas cambiadas. La corrección simultánea de errores factuales es prioritaria, pero no permite atribuir una variación futura del CTR a un único título.
