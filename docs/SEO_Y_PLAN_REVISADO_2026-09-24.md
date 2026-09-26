# SEO actual y plan de mejoras revisado — lalupa.cl

**Análisis:** 24 de septiembre de 2026. **Search Console:** búsqueda Web, 26 de agosto–22 de septiembre de 2026, 28 días. **Base de código:** commit `7976a8d`. Se analizaron los siete CSV entregados, la implementación del repositorio y el HTML público de las 34 URLs del sitemap, además de seis comprobaciones de variantes/rutas. No se modificó ni publicó código funcional.

## Estado de implementación posterior

El 25 de septiembre se implementó un primer lote local: revisión de gas/CGE, recorrido móvil, robots/noindex, lastmod, autoría, validación editorial y correcciones de confiabilidad, privacidad y CI. Next.js se actualizó a 16.3.6. El detalle y las tareas aún abiertas están en [Mejoras implementadas](MEJORAS_IMPLEMENTADAS_2026-09-25.md). Este diagnóstico conserva la evidencia anterior al cambio; no representa resultados de tráfico posteriores ni un despliegue.

## 1. Diagnóstico y cambio de dirección

**El sitio ya tiene visibilidad orgánica, concentrada en contenido editorial. La primera inversión debe proteger y mejorar ese contenido y su utilidad, acompañada de las correcciones de confiabilidad de las herramientas.** No hay evidencia de un bloqueo técnico general que justifique comenzar por una migración de hosting, un rediseño completo o generar muchas páginas nuevas.

Las guías aportan **34 de 36 clics, el 94,4%**. Dos artículos —gas red versus cilindro y boleta CGE— generan **29 clics, el 80,6% del total**. Las tres landings de revisión de boletas suman cero clics en este período. Esto mide entradas desde Google, no uso interno de las herramientas: todavía no hay datos para saber cuántos lectores terminan usando el analizador. Fuente: `Páginas.csv`.

El plan técnico anterior sigue siendo válido para exactitud, privacidad y conservación de datos, pero cambia su secuencia:

1. **Adelantar la revisión editorial de gas y electricidad.** Se encontraron contradicciones concretas en el artículo con más tráfico y referencias tarifarias antiguas en el segundo.
2. **Mantener las correcciones críticas de producto.** Las guías conducen a los analizadores; amplificar una promesa que estos no cumplen agrava el problema.
3. **Optimizar páginas existentes con señales de demanda**, antes de abrir más categorías o perseguir términos amplios de internet hogar.
4. **Mejorar navegación y medición del recorrido móvil**, respetando el procesamiento privado de documentos.
5. **Posponer refactors extensos y optimización de infraestructura sin efecto demostrado en adquisición o utilidad.** Los parches de seguridad y checks rotos no se posponen.

La referencia histórica es `docs/AUDITORIA_TECNICA_2026-09-24.md`; este documento reemplaza su orden de inversión estratégico, no sus hallazgos técnicos pendientes.

## 2. Qué dicen los datos

### 2.1 Línea base

| Indicador | Resultado | Interpretación |
| --- | ---: | --- |
| Clics orgánicos | 36 | Volumen pequeño; unos pocos clics cambian mucho los porcentajes. |
| Impresiones | 2.376 | Visibilidad real de la propiedad en este período, no volumen de búsqueda del mercado. |
| CTR | 1,52% | Calculado como 36 / 2.376; no como promedio de CTR diarios. |
| Posición media aproximada | 11,05 | Ponderada por impresiones diarias; las posiciones de origen ya están redondeadas. No significa estar en el puesto 11 para todas las consultas. |
| Clics desde Chile | 36 de 36 | El tráfico observado coincide con el país objetivo. |
| Impresiones desde Chile | 2.224, el 93,6% | No hay señal que justifique internacionalización ahora. |
| Impresiones móviles | 1.561, el 65,7% | El móvil debe ser el recorrido principal de lectura y acción. |
| Clics móviles | 21, el 58,3% | CTR móvil 1,35%, frente a 1,85% en ordenador. No demuestra por sí solo una causa de UX. |

Fuentes: `Gráfico.csv`, `Países.csv`, `Dispositivos.csv`. Los totales de estas tres dimensiones concilian: 36 clics y 2.376 impresiones. La posición se aproxima con `Σ(posición × impresiones) / Σ(impresiones)`.

### 2.2 La última semana cae, pero no se puede atribuir a una penalización

| Ventana de siete días | Clics | Impresiones | CTR calculado | Posición ponderada aproximada |
| --- | ---: | ---: | ---: | ---: |
| 26 ago–1 sep | 12 | 705 | 1,70% | 13,14 |
| 2–8 sep | 10 | 649 | 1,54% | 10,36 |
| 9–15 sep | 11 | 561 | 1,96% | 9,98 |
| 16–22 sep | 3 | 461 | 0,65% | 10,13 |

Comparando mitades de igual duración: **22 → 14 clics (−36,4%)** y **1.354 → 1.022 impresiones (−24,5%)**. La posición agregada pasa de 11,81 a 10,05, mientras el CTR pasa de 1,62% a 1,37%.

La pérdida de clics no coincide con un deterioro general de la posición agregada. Eso no descarta pérdidas en consultas concretas: puede cambiar la mezcla de consultas y páginas. La última semana incluye el período de Fiestas Patrias, pero atribuirle la caída sería una hipótesis, no un resultado de estos archivos. No hay serie del período anterior, desglose diario por página/consulta ni historial de despliegues para aislar causas. Fuente: `Gráfico.csv`.

**Decisión:** investigar con 8–12 semanas y segmentos comparables; no reescribir todo el sitio por siete días de bajo volumen. La página oficial de [anomalías de Search Console](https://support.google.com/webmasters/answer/6211453) consultada registra incidencias de agosto en otras ventanas/superficies, sin aportar una explicación directa para esta serie Web del 26 de agosto al 22 de septiembre.

### 2.3 Páginas: proteger ganadoras y trabajar oportunidades cercanas

Se conservan las métricas de las filas sin fragmento; no se les suman las filas `#...`.

| Página, bajo `https://lalupa.cl` | Clics | Impresiones | CTR exportado | Posición | Decisión |
| --- | ---: | ---: | ---: | ---: | --- |
| `/guias/gas-red-vs-cilindro-cual-conviene` | 17 | 728 | 2,34% | 10,54 | Prioridad máxima: revisar cálculos, fuentes y conclusión; conservar URL e intención. |
| `/guias/como-leer-boleta-cge` | 12 | 611 | 1,96% | 9,03 | Proteger y ampliar respuestas sobre componentes/precio con referencias aplicables. |
| `/comparador-internet-hogar` | 2 | 207 | 0,97% | 20,37 | Corregir promesas y costes; experimento secundario, con competencia/intención por estudiar. |
| `/guias/por-que-subio-mi-cuenta-de-luz` | 0 | 161 | 0% | 8,30 | Primera prueba editorial de intención, resumen y snippet. |
| `/guias/calefont-gas-elegir-potencia-ahorrar` | 1 | 120 | 0,83% | 11,43 | Segunda ola, después de revisar precisión y seguridad del contenido. |
| `/guias/lectura-estimada-medidor-luz-cuando-es-legal` | 2 | 104 | 1,92% | 8,30 | Mejorar explicación y enlaces desde CGE/alza, con revisión normativa. |
| `/guias/como-leer-boleta-agua` | 1 | 103 | 0,97% | 8,11 | Oportunidad secundaria; corregir primero extracción PDF sanitaria. |
| `/guias/tarifa-bt1-vs-bt2-cual-conviene` | 0 | 89 | 0% | 10,08 | Responder diferencias, alcance y ejemplos verificables sin prometer ahorro universal. |
| `/guias/cambiar-comercializadora-electrica-chile` | 0 | 76 | 0% | 8,61 | Revisar elegibilidad y afirmaciones antes de promoción. |
| `/guias/deuda-electrica-convenios-pago-chile` | 0 | 74 | 0% | 8,31 | Aclarar condiciones reales de convenios; evitar prometer condonación/descuentos. |

Fuente: `Páginas.csv`. Las cuatro guías con cero clics sobre alza, BT-1/BT-2, cambio de comercializadora y deuda suman **400 impresiones de filas de página**. Es una lista priorizada para investigar, no 400 búsquedas únicas ni tráfico recuperable garantizado. La media de posición tampoco demuestra que el snippet sea la causa del cero: hace falta el cruce página–consulta–dispositivo.

### 2.4 Consultas: señales útiles con cobertura muy incompleta

`Consultas.csv` contiene **127 filas, 294 impresiones y cero clics**. Sus impresiones equivalen a solo **12,4%** del total de la propiedad. Por tanto, **ninguno de los 36 clics puede atribuirse a una consulta visible en este export**. No se puede calcular una distribución fiable de clics por marca, intención o tema.

Google documenta la omisión de consultas anonimizadas y diferencias por agregación/recorte. Es una explicación compatible con la discrepancia, pero los CSV no permiten determinar exactamente cómo se compone lo omitido. No se llegó al límite de 1.000 filas en este archivo. [Documentación de discrepancias de Search Console](https://support.google.com/webmasters/answer/17010575?hl=en).

| Señal visible | Impresiones | Posición | Uso propuesto, pendiente de cruce por página |
| --- | ---: | ---: | --- |
| `valor kwh cge 2026` | 17 | 10,35 | Mejor explicación del precio según fecha, zona y componentes. |
| `valor kilowatt cge 2026` | 7 | 8,86 | Misma intención; no crear una página para cada variante. |
| `valor de 1 kwh en chile cge 2026` | 2 | 11,00 | Las tres variantes suman 26 impresiones visibles. |
| `cargo potencia base distribución cge` | 9 | 6,89 | Sección concreta con ejemplo de boleta y desglose verificable. |
| `bt1 vs bt2` | 3 | 7,33 | Mejorar la guía existente; muestra pequeña. |
| `tarifa bt2 cge` | 2 | 7,00 | Aclarar alcance CGE y condiciones aplicables. |
| `red de gas` | 53 | 28,13 | Término amplio; no desviar toda la guía comparativa para perseguirlo. |
| `boleta de gas` | 12 | 29,33 | La intención puede ser obtener/pagar una boleta, distinta de analizarla. |
| `que gas es mas barato en chile` | 4 | 9,50 | Comparación condicionada a consumo, lugar, precio y costes fijos. |

El grupo orientativo de internet contiene 48 impresiones visibles, con posición ponderada cercana a 57. La página del comparador tiene posición 20,37 en su propio agregado: **son poblaciones distintas, no datos contradictorios**. No se debe asignar automáticamente cada consulta a esa URL. Tampoco se considera `pagar cge con rut` una oportunidad para fingir que lalupa es un portal de pago: si se responde esa necesidad, debe orientarse al canal oficial.

### 2.5 Fragmentos, indexación y datos que faltan

- `Páginas.csv` suma **2.754 impresiones**. Hay seis filas con fragmento y **376 impresiones**, sin clics: cuatro de gas (374) y dos de lectura estimada (2). Las 25 filas sin fragmento suman **2.378**, dos más que el total de propiedad. La [agregación por página difiere de la agregación por propiedad](https://support.google.com/webmasters/answer/7576553?hl=en). No borrar índices/encabezados ni tratar esos fragmentos como seis artículos duplicados. Conservar IDs útiles al editar títulos de sección.
- `Aparición en búsquedas.csv` solo contiene encabezados. **No hay desglose disponible**; no prueba que el JSON-LD esté roto ni que haya que añadir más schemas.
- Nueve URLs del sitemap no tienen fila en el export: `/subsidio-electrico`, `/privacidad`, las guías de fibra y subsidio eléctrico, y las cinco categorías. **Ausencia de impresiones no equivale a ausencia de indexación.** Verificarlas mediante Inspección de URLs/Indexación, priorizando las comerciales/editoriales; privacidad no necesita una campaña de captación.
- No hay datos de enlaces externos, conversiones, sesiones, engagement, consultas por página ni Core Web Vitals de campo. No se diagnostican penalizaciones, falta de backlinks o abandono usando estos archivos.

## 3. SEO técnico: base comprobada y correcciones concretas

### 3.1 Lo que funciona en producción

La comprobación HTTP pública del 24 de septiembre encontró:

- **34/34 URLs de sitemap con respuesta 200**, canonical autorreferente, descripción, un H1 y `lang="es-CL"`; sin títulos duplicados ni JSON-LD inválido en esas respuestas.
- Contenido y encabezados de las guías presentes en HTML, sin requerir OCR ni una sesión privada para acceder a ellos.
- `robots.txt` y `sitemap.xml` accesibles con 200. El sitemap contiene 13 rutas generales, 16 guías y cinco categorías.
- Las variantes HTTP y `www` consultadas terminan en HTTPS sin `www`; la variante con barra final de la guía CGE termina en la URL sin barra. Se comprobó el destino final, sin afirmar aquí el código de cada salto.
- Article en las 16 guías, breadcrumbs y metadatos sociales. No hace falta reconstruir el sistema SEO de Next.

Evidencia: `docs/seo/2026-09-24/crawl-publico.json`; implementación en `src/lib/seo.ts`, `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/guias/[slug]/page.tsx`. Esto comprueba accesibilidad/metadatos HTTP, **no sustituye la versión indexada que Google conserva** ni una medición de disponibilidad histórica.

### 3.2 Correcciones técnicas priorizadas

| ID / prioridad | Hallazgo respaldado por código | Cambio y aceptación |
| --- | --- | --- |
| T01 · P2 | `src/app/robots.ts` bloquea `/tracker` y `/boleta-*/...`, mientras esas páginas emiten `noindex`. El crawl confirma ambos mecanismos en tracker/CGE. | Para shells públicos sin datos de usuario en servidor, permitir que el crawler lea `noindex`, manteniéndolos fuera del sitemap. Revisar las tres familias y comprobar HTML sin sesión; no indexar resultados ni confiar en robots para privacidad. |
| T02 · P2 | `src/app/sitemap.ts:35` usa `new Date()` para rutas estáticas y categorías. El sitemap publicado comparte `2026-06-21T00:11:25.926Z` en esas entradas. | Usar fecha de modificación significativa; categorías derivadas de cambios reales o sin fecha si no se conoce. Las guías ya usan `updatedAt`. |
| T03 · P2 | `src/lib/seo.ts:166` convierte cualquier autor string en `Person`; las 16 guías publicadas declaran `Person: Equipo lalupa`. | Representar al equipo como Organization, con URL de información editorial, o autores reales verificables cuando existan. No inventar personas o acreditaciones. |
| T04 · P3 | `src/lib/seo.ts:242`, `src/lib/guias.ts` y comentarios de `src/app/guias/[slug]/page.tsx` prometen rich results FAQ/HowTo. Producción emite FAQPage en nueve páginas y HowTo en dos. | Corregir expectativa y documentación; mantener FAQ visibles si ayudan. No invertir en más marcado para conseguir esas apariencias. |
| T05 · P2 | Metadata del comparador promete «filtros por ... comuna» en `src/app/comparador-internet-hogar/page.tsx:12`, pero la comuna se presenta como informativa en el componente. | Alinear snippet y capacidad real; no prometer disponibilidad domiciliaria ni coste completo si no se calcula. |
| T06 · P2 | `tests/e2e/seo.spec.ts` verifica metadatos de una guía de ejemplo y parte del catálogo. El test llamado «tracker, dynamic resultados» solo abre tracker. | Validar catálogo completo, exclusiones/noindex de las tres familias, esquema de autores, fechas y enlaces internos. No convertir longitud arbitraria de title en una regla SEO infalible. |

Google necesita rastrear una página para ver `noindex`; un bloqueo por robots puede impedirlo. [Documentación oficial](https://developers.google.com/search/docs/crawling-indexing/block-indexing). Es una inconsistencia de control, no evidencia de que hoy Google esté publicando boletas privadas.

Google recomienda `lastmod` verificable e ignora `priority` y `changefreq`; ajustar estos dos últimos no es una palanca de ranking. [Guía de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

**Actualización relevante:** Google dejó de mostrar FAQ rich results desde el **7 de mayo de 2026** y retiró su documentación en junio. HowTo dejó de mostrarse en 2023. [Historial oficial de 2026](https://developers.google.com/search/updates), [retirada de HowTo](https://developers.google.com/search/blog/2023/08/howto-faq-changes). La falta de filas en Aparición no autoriza a atribuir toda la situación a este cambio.

Se probó también una guía inexistente: respondió 200 con título «Guía no encontrada» y `noindex`. La documentación local de Next explica esa combinación en respuestas con streaming: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md:105`. No se clasifica automáticamente como fallo crítico de indexación; ampliar pruebas de estados de error y, si se requiere 404 HTTP estricto, resolver existencia antes del streaming.

### 3.3 Rendimiento y autoridad: no atribuir causas sin medición

La auditoría técnica previa midió páginas locales, no Core Web Vitals de visitantes. Las consultas y el HTML revisados no demuestran un problema de LCP/INP como causa de la captación limitada. Medir guías de gas/CGE en móvil y carga fría antes de invertir en optimización general del bundle. El tamaño de Tesseract afecta al uso del analizador, no implica que cada visita editorial descargue todo OCR.

Tampoco se ha medido autoridad de enlaces. Una futura revisión de Enlaces de Search Console puede orientar colaboración editorial legítima y referencias a recursos útiles. No recomendar compra de backlinks ni cantidades de enlaces arbitrarias. En esta fase aporta más corregir el material que ya se consulta.

## 4. Contenido, credibilidad y experiencia: dónde está el mayor trabajo

### E01 · P1 · La guía ganadora de gas tiene contradicciones demostrables

Archivo: `src/content/guias/gas-red-vs-cilindro-cual-conviene.mdx`.

- Declara que un cilindro de 15 kg equivale aproximadamente a **204 kWh**, pero describe **80–200 kWh/mes** como «uno a dos cilindros mensuales». Dos cilindros serían unos 408 kWh usando su propia equivalencia.
- El cierre recomienda cambiarse a partir de más de cuatro cilindros al año, con recuperación de inversión en 12–24 meses. En otras secciones exige >200 o >250 kWh mensuales; no son umbrales equivalentes.
- Con un caso de **cinco cilindros/año**, al precio ilustrativo del artículo de $25.000 cada uno, se gastan $125.000/año y se consumen 1.020 kWh. Usando los valores más favorables publicados para red —$70/kWh y $1.500 de cargo fijo mensual— el coste anual sería $89.400: ahorro de $35.600. La instalación mínima de $200.000 tardaría **5,62 años** en recuperarse, antes de conversión/mantenimiento. No 12–24 meses. Es una comprobación de consistencia interna, **no una cotización vigente del mercado**; una promoción de instalación gratis sería otro escenario y debe identificarse.
- La tabla resume la regulación de todo gas de red como «SEC tarifa fija». La CNE describe un régimen de libertad tarifaria regulada con tarificación eventual; esa etiqueta universal debe corregirse y explicarse por ámbito. [Fuente primaria CNE](https://www.cne.cl/tarificacion/hidrocarburos/informe-tecnico-bienes-eficientes/).

**Trabajo concreto:** reconstruir comparación con una sola fórmula, consumo equivalente, zona, precio de fecha identificada, cargo fijo e instalación. Separar ejemplos de tarifas vigentes. Revisar el cuerpo, FAQ, tablas, conclusión y CTA como un conjunto. Mantener URL y anclas valiosas; no eliminar la página que aporta 17 clics.

Una calculadora sencilla podría aportar valor propio después de esa revisión: introducir precios reales y consumo, mostrar coste anual y plazo de recuperación, incluyendo casos sin ahorro. Su justificación es ayudar a decidir, no insertar una herramienta para aumentar palabras clave. No requiere backend ni base de datos remota.

### E02 · P1 · La guía CGE necesita trazabilidad de tarifas y límites de la revisión

Archivo: `src/content/guias/como-leer-boleta-cge.mdx`, publicado el 10 de mayo y actualizado el 26 de mayo. Conserva cifras de mayo de 2026 y referencias concretas junto a afirmaciones generales sobre periodicidad tarifaria, plazos, subsidios y anomalías.

No se concluye que toda cifra de mayo sea inválida en septiembre; sí que **la página no verifica su aplicabilidad actual para cada usuario**. La auditoría anterior ya identificó referencias sin selección temporal/geográfica, cargos negativos tratados como indebidos y conclusiones favorables con extracción incompleta (C02–C04). Una CTA editorial que promete validar cada componente contra tarifas vigentes debe corresponder a una capacidad comprobada.

**Trabajo concreto:** tabla de componentes con unidad, IVA, zona/régimen, vigencia y documento fuente exacto; ejemplo reconciliado; revisión de afirmaciones regulatorias; separar lectura de la boleta de verificación tarifaria. Añadir una sección que explique por qué no hay un único «valor kWh CGE» sin contexto. Responder «potencia base de distribución» con un ejemplo contrastado, sin asumir que cualquier cargo ambiguo es ilegal.

Las consultas visibles respaldan investigar esas preguntas, pero no prueban que todas hayan mostrado esta URL. Conservar el propósito «cómo leer la boleta» y su URL. Considerar una página específica de tarifas solo cuando tenga datos propios mantenibles, intención diferenciada y cruce de consultas confirmado.

### E03 · P1/P2 · Revisión editorial y autoría deben ser verificables

Las 16 guías declaran «Equipo lalupa» y fechas entre mayo y junio de 2026; no hay una fecha posterior al 4 de junio en su frontmatter. `/sobre` describe experiencia en software, producto y derecho, sin identificar responsables o un procedimiento editorial verificable. Evidencia: `src/content/guias/*.mdx`, `src/app/sobre/page.tsx`, `src/lib/guias.ts`.

Para contenido que guía gastos, reclamos y seguridad de instalaciones, añadir responsable real o equipo identificable, metodología, alcance, fuente por afirmación material, revisión y canal de corrección. La firma de equipo es válida; debe describir quién verifica el contenido y cómo. No basta añadir un schema o cambiar fechas. Google pone énfasis en información original, fuentes claras y autoría, sin tratar E-E-A-T como una puntuación técnica única. [Guía oficial de contenido útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

La prioridad de revisión sigue el tráfico: gas, CGE, alza eléctrica, lectura estimada y después las otras guías. Los artículos de cambio de comercializadora y deuda merecen revisión antes de promoción porque sus descripciones plantean opciones/beneficios que dependen del caso. Las fechas `updatedAt` deben cambiar solo tras una revisión o modificación real.

### E04 · P2 · Mejorar respuestas y snippets de oportunidades existentes

La hipótesis es que una respuesta inicial más concreta y un título coherente con la necesidad pueden mejorar selección/utilidad. No está demostrado que el título actual cause el bajo CTR. Propuestas para probar después de verificar el contenido:

| URL existente | Propuesta editorial | Título propuesto, sin sufijo automático de marca |
| --- | --- | --- |
| `/guias/por-que-subio-mi-cuenta-de-luz` | Diagnóstico breve: separar más consumo, cambio de precio, lectura estimada y otros cargos; checklist y ejemplo comparable. | `¿Por qué subió tu cuenta de luz? Qué revisar en la boleta` |
| `/guias/tarifa-bt1-vs-bt2-cual-conviene` | Tabla de diferencias, condiciones, unidades y casos; explicar qué comprobar antes de pedir cambio. | `BT1 y BT2 en Chile: diferencias y cómo comparar tu tarifa` |
| `/guias/deuda-electrica-convenios-pago-chile` | Documentos/pasos y diferencias entre condiciones publicadas y beneficios negociables, con enlaces oficiales vigentes. | `Deuda de luz en Chile: cómo solicitar un convenio de pago` |
| `/comparador-internet-hogar` | Precios revisados, promociones, permanencia y costes de instalación; retirar «filtro por comuna» mientras no haga esa función. | `Compara planes de internet hogar en Chile: precios y condiciones` |

Ejemplo de descripción para alza, condicionado a que el contenido cumpla lo prometido: «Compara consumo, precio por kWh, lectura estimada y cargos adicionales. Te mostramos qué revisar en tu boleta de luz y qué antecedentes reunir si algo no cuadra».

No cambiar todas las páginas simultáneamente. Empezar por alza; registrar fecha/cambios y observar 28 días completos después del recrawl. Con bajo volumen puede requerirse más tiempo; un clic adicional no valida causalidad. Google puede construir el título desde varias señales, no solo `<title>`. [Guía oficial de títulos](https://developers.google.com/search/docs/appearance/title-link).

### E05 · P2 · Enlazado y lectura móvil deben seguir las necesidades reales

- La portada muestra las tres guías más recientes por `publishedAt`, no las de mayor utilidad o demanda: calefont, cambio de comercializadora y deuda. Gas y CGE no aparecen en ese bloque. Evidencia: `src/app/page.tsx:93`, `src/lib/guias.ts`, HTML público. Introducir selección editorial explícita de guías clave; no reordenar por fechas artificiales.
- `pickRelatedGuias` prioriza categoría y toma los primeros elementos; si faltan, rellena desde otras categorías. `src/lib/guias-utils.ts:29`. Permitir relaciones curadas por problema: CGE → alza → lectura estimada → reclamo; gas comparativo → entender costes → analizador apropiado. Conservar enlaces contextuales en el cuerpo.
- El índice y la lista lateral de herramientas se ocultan bajo `lg` mediante `hidden lg:block`. `src/app/guias/[slug]/page.tsx:187`. Ya existen CTAs dentro de los artículos; **no se afirma que el móvil carezca de enlaces**. Añadir índice colapsable y una acción contextual junto a la respuesta principal beneficia al dispositivo que aporta 65,7% de impresiones. Su efecto en conversión todavía debe medirse.
- Sustituir enlaces visibles como `/boleta-luz` por texto que describa la acción. `src/content/guias/como-leer-boleta-cge.mdx`, `src/components/mdx/RelatedTool.tsx`. Mantener HTML accesible, navegación por teclado y lectura sin necesidad de subir una boleta.
- En las 34 respuestas HTML no se encontraron imágenes `<img>`; sí existen SVG/iconos y OG. Una boleta sanitizada y anotada aportaría evidencia visual original a CGE/agua. No es una exigencia de ranking ni una invitación a añadir imágenes decorativas pesadas.

### E06 · P2 · Falta medir si la adquisición lleva a un resultado útil

`RelatedTool.tsx` enlaza, `Analytics.tsx` habilita proveedores por configuración y `src/lib/parsers/telemetry.ts` conserva contadores locales de patrones. No hay un contrato de medición del recorrido guía → herramienta → análisis válido; los CSV tampoco lo incluyen.

Diseñar medición mínima de acciones agregadas, con una decisión explícita sobre privacidad y consentimiento antes de enviar eventos remotos. Campos permitidos de partida: slug editorial, herramienta, estado completo/parcial/error y versión; **sin texto OCR, RUT, dirección, monto, archivo, contenido de formularios ni identificadores personales**. No activar replay para resolver esta carencia.

Distinguir: clic de Search Console, visita medida, clic interno y análisis son unidades diferentes. No calcular «conversión orgánica» dividiendo eventos de todo el sitio por los 36 clics de GSC. Si se desea atribución, usar una población de visitas comparable y documentada, sin identificación entre sitios ni seguimiento persistente innecesario.

## 5. Nuevo roadmap integrado

### 5.1 Qué cambia respecto al plan anterior

| Trabajo anterior | Nueva decisión | Motivo |
| --- | --- | --- |
| Privacidad, conclusiones parciales, referencias, carta SERNAC | Mantener urgente junto con revisión editorial | La captación actual desemboca en esas promesas/funciones. Hallazgos S01, C02–C05. |
| Extracción PDF, Otsu, identidad/export del historial | Mantener como requisito para promover analizadores | Aumentar tráfico no compensa resultados o respaldos incorrectos. C01, C06–C08, P01. |
| Cobertura real, fallo E2E y dependencias de seguridad | Mantener primera etapa técnica | Protegen las siguientes entregas; no son trabajo de ranking. C11, S02. |
| Revisión de datos y gobernanza editorial | Adelantar al inicio | Gas/CGE aportan el 80,6% de clics y requieren corrección de fondo. |
| Diseño/UX amplio | Acotar primero a guías móviles, claridad y CTA | El tráfico entra por artículos y predomina móvil. |
| Refactor completo de resultados/wizards | Dividir y ejecutar solo lo necesario para las correcciones | No bloquear mejoras editoriales por una reorganización general. |
| Pregeneración de resultados, OG/RSS y export estático | Posponer detrás de exactitud y medición | Las páginas editoriales ya son rastreables y responden bien; no hay cuello SEO probado ahí. |
| Build único CI | Mantener mejora acotada, cuando reduzca fricción de releases | Beneficio operativo; no principal palanca orgánica. |
| Expansión de contenido/categorías | Dos grupos iniciales: electricidad/CGE y gas | Ya hay señal de demanda y se puede profundizar utilidad. |

### 5.2 Etapas, entregables y condiciones de salida

**Días 1–14: corregir lo que más se consulta y establecer una base confiable.**

- Revisión integral de gas y CGE: cálculos, fuentes, regulación, fecha/ámbito y CTAs. Conservar URLs y anclas existentes cuando sigan describiendo la sección.
- Corregir conclusiones sobre extracción incompleta, desviaciones negativas, hechos inventados en cartas y configuración de privacidad; iniciar los parches de dependencias y la reparación de checks identificados en la auditoría técnica.
- Aplicar metadata honesta al comparador y reglas de autoría/fechas. Ajustar robots/noindex con pruebas de ausencia de datos personales en respuestas sin sesión.
- Registrar la línea base y el esquema de medición; obtener informes de Indexación/Inspección y cruces de GSC sin esperar a ellos para corregir errores demostrados.

**Salida:** las dos guías principales no contienen las contradicciones identificadas; sus cifras tienen fuente/ámbito o están marcadas como ejemplos; el producto no afirma haber verificado lo que no pudo leer; los checks relevantes se ejecutan realmente. Esta etapa puede requerir más de dos semanas si la verificación de fuentes o los parches mayores lo exigen.

**Días 15–30: mejorar las oportunidades existentes y el recorrido móvil.**

- Primera intervención en alza eléctrica; después BT-1/BT-2 y deuda, siempre con revisión factual previa.
- Índice móvil, CTA contextual, guías destacadas curadas y relaciones editoriales explícitas.
- Corregir PDF/OCR, respaldo/identidad y assets versionados antes de ampliar promoción de herramientas; priorizar una corrección con su prueba de frontera sobre un refactor general.
- Añadir validación de frontmatter y del catálogo SEO a CI. Completar pruebas móviles de lectura, enlaces y acción posterior.

**Salida:** no se rompe ninguna URL prioritaria; las rutas de guía → herramienta son comprensibles y funcionan; hay registro de qué cambió en cada página y cuándo. No se exige un porcentaje de crecimiento para declarar terminada una corrección factual.

**Días 31–60: aportar utilidad propia y evaluar con segmentos comparables.**

- Comparación de gas con fórmula verificable y entradas del usuario, si las referencias y el mantenimiento están resueltos. Alternativa de menor esfuerzo: tabla de escenarios explícitos sin desarrollo interactivo.
- Ejemplo CGE sanitizado y anotado, con desglose reconciliado. Evaluar una página separada de precio kWh solo si hay intención independiente y capacidad de mantener tarifas.
- Evaluar alza/BT-1/deuda con consultas por página, país y dispositivo. Ampliar la ventana si la muestra sigue pequeña.
- Internet se mantiene como experimento secundario: revisar precios, instalación y cobertura antes de aumentar contenido o crear páginas por comuna.

**Salida:** las mejoras añaden evidencia o una decisión útil. No se crean variantes casi idénticas por keyword, empresa o comuna sin datos diferenciados.

**Días 61–90: escalar según resultados y capacidad editorial.**

- Expandir el grupo que muestre crecimiento sostenido y resultados útiles, no solo más impresiones.
- Revisar enlaces externos y oportunidades legítimas de referencia a recursos propios; preparar propuestas de colaboración solo después de corregir el contenido. No se enviaron mensajes a terceros.
- Abordar refactors e infraestructura pendientes según fallos observados, coste de mantenimiento y frecuencia de publicación. Mantener seguimiento de seguridad independiente del crecimiento SEO.

### 5.3 Matriz de priorización

S: hasta dos jornadas; M: tres a cinco; L: una a tres semanas. Estimaciones orientativas; la verificación editorial depende de fuentes y revisión competente. Impacto relativo al sitio actual, no proyección de tráfico.

| Iniciativa | Área | Prioridad | Impacto | Esfuerzo | Riesgo de regresión / dependencia |
| --- | --- | --- | --- | --- | --- |
| Corregir comparación, normativa y conclusión de gas | Contenido/Producto | P1 | Alto | M | Medio; conservar URL/anclas, verificar todas las representaciones |
| Revisar CGE: vigencia, componentes y promesas | Contenido/Backend | P1 | Alto | M | Medio; depende de fuentes por fecha/zona |
| Lectura parcial, desviación negativa y carta honesta | Backend/UI | P1 | Alto | M | Medio; cambia mensajes y resultados esperados |
| Privacidad y parches de seguridad prioritarios | Frontend/DevOps | P1 | Alto | M | Medio; PDF.js puede requerir trabajo adicional |
| PDF/OCR, assets, identidad y respaldos | Backend/Frontend | P1 | Alto | L | Alto; migraciones y corpus de documentos |
| Reparar checks y cobertura efectiva | DevOps | P1 | Alto | S–M | Bajo en producto; puede revelar deuda adicional |
| Primera mejora de alza eléctrica | Contenido/SEO | P2 | Alto | S–M | Medio; atribución con muestra pequeña |
| BT-1/BT-2 y deuda, con revisión de alcance | Contenido/SEO | P2 | Medio | M | Medio; riesgo factual si se simplifica demasiado |
| Índice/CTA móvil y enlazado curado | UI/Frontend | P2 | Alto | M | Bajo–medio; teclado y legibilidad |
| Robots/noindex, autores y lastmod | SEO/Frontend | P2 | Medio | S–M | Medio en reglas de indexación |
| Medición mínima y definición de utilidad | Producto/DevOps | P2 | Alto para decidir | M | Medio por privacidad; sin replay |
| Ejemplos originales y metodología editorial | Contenido/UI | P2 | Alto | M | Bajo si se sanitizan y verifican correctamente |
| Calculadora de comparación de gas | Frontend/Contenido | P2, condicionada | Medio–alto | M–L | Medio; requiere fórmula y entradas fiables |
| Comparador internet: precisión antes de expansión | Backend/Contenido | P2 | Medio | M | Medio; mantenimiento de precios/promociones |
| Refactor general/export estático/OG y RSS en build | Arquitectura/DevOps | P3 para SEO | Bajo inmediato | L | Medio–alto; conservar backlog técnico |
| Más FAQ/HowTo, meta keywords, retoques de priority | SEO | No priorizar | Sin beneficio esperado por esas vías | — | Coste de oportunidad |

Los `keywords` del frontmatter sirven también a la búsqueda interna de `src/app/guias/_components/guias-list.tsx`; no se propone borrarlos indiscriminadamente. Su emisión como meta keywords no mejora ranking en Google. [Confirmación oficial](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag).

## 6. Medición y reglas para tomar decisiones

| Pregunta | Métrica / evidencia | Regla de interpretación |
| --- | --- | --- |
| ¿Mejoró la adquisición? | Clics e impresiones Web de 28 días completos; Chile; páginas prioritarias | Comparar misma duración y conservar segmentación. Documentar eventos estacionales y cambios. |
| ¿Mejoró la selección del resultado? | CTR por página, consulta y dispositivo, con posiciones y mezcla comparables | No usar CTR global como única prueba ni extrapolar del subconjunto visible. |
| ¿Las páginas necesarias están disponibles en Google? | Indexación/Inspección: canonical elegido, último rastreo, estado | HTTP 200 y sitemap son condiciones técnicas, no prueba de indexación. |
| ¿La guía ayuda a usar la herramienta? | Visitas elegibles y clics de CTA medidos con la misma población | Actualmente no disponible. No inferirlo del cero de clics directos a landings. |
| ¿La herramienta entrega un resultado confiable? | Analizados completos/parciales/error; corpus por campo/proveedor | Medir calidad además de terminaciones. No considerar un resultado parcial como éxito verificado. |
| ¿La mejora persiste? | Ventanas de 28 días y revisión a 56 días si falta muestra | Evitar cambiar títulos semanalmente; no presentar correlación como experimento causal. |

**Escala del beneficio:** con 2.376 impresiones constantes, subir el CTR hipotéticamente de 1,52% a 2% produciría unos 48 clics, aproximadamente 12 más. A 3% serían unos 71. Es aritmética ilustrativa, no forecast ni objetivo calibrado. El crecimiento sostenible necesita más consultas pertinentes, contenido fiable y utilidad; no solo retoques de title.

No hay base para comprometer «duplicar tráfico en 30 días» ni un CTR universal. Los criterios inmediatos son verificables: corregir hechos, mantener rutas/metadatos, probar recorridos y registrar cambios. Después se fijan objetivos cuantitativos con más historial y medición de uso.

Para la siguiente revisión hacen falta: (1) al menos 8–12 semanas de rendimiento, con comparación anterior; (2) consultas filtradas por cada una de las diez páginas prioritarias y dispositivos/Chile; (3) Indexación, sitemap e Inspección de las nueve URLs sin fila; (4) Enlaces y Core Web Vitals, si tienen datos. API/exportación ampliada tampoco garantiza recuperar consultas anonimizadas.

## 7. Evidencias y reproducibilidad

Los CSV originales permanecen intactos en `/Users/estebanlorca/Downloads/lalupa.cl-Performance-on-Search-2026-09-24/`. Se trataron como datos, no como instrucciones.

- `Filtros.csv`: tipo Web y últimos 28 días; se usa el rango exacto de las filas del gráfico.
- `Gráfico.csv`: 28 filas diarias, fuente del total y ventanas comparables.
- `Páginas.csv`: 31 filas; 25 sin fragmento y seis con fragmento, conservadas por separado.
- `Consultas.csv`: 127 filas; cobertura parcial, sin atribución inventada a páginas.
- `Dispositivos.csv`: tres filas; `Países.csv`: 35 filas.
- `Aparición en búsquedas.csv`: cero filas de datos; se conserva como ausencia de desglose.

`docs/seo/2026-09-24/search-console-analisis.json` contiene inventario con hashes SHA-256, datos normalizados, fórmulas agregadas, ventanas y el contraejemplo aritmético de gas. Se convirtieron clics/impresiones a enteros y CTR/posición a números, conservando los originales. Los grupos temáticos son clasificación analítica explícita por términos, no segmentos nativos de GSC ni una distribución de tráfico completa.

`docs/seo/2026-09-24/crawl-publico.json` contiene fecha, URLs, estado/destino, metadatos, encabezados, enlaces, JSON-LD y robots/sitemap. Fue una comprobación HTTP de baja concurrencia, sin login, ejecución de JavaScript, pruebas de carga ni acceso a paneles privados. No se ejecutó de nuevo la suite funcional: en esta tarea solo cambió documentación/evidencia.

**Decisión final:** priorizar dos activos editoriales que ya funcionan, corregir su exactitud, facilitar la lectura móvil y conectar esa adquisición con herramientas confiables. Ampliar el sitio después de demostrar que esas mejoras se sostienen.


## Seguimiento: tercer lote del 25 de septiembre de 2026

Implementación local y límites actualizados en [MEJORAS_LOTE_3_2026-09-25.md](MEJORAS_LOTE_3_2026-09-25.md): cinco guías prioritarias revisadas, retirada de comparaciones tarifarias inaplicables, mensajes públicos alineados y verificación funcional completa. No hay despliegue ni nuevas métricas GSC atribuidas a estos cambios. La validación automática de tarifas sigue pendiente de referencias acreditadas.
