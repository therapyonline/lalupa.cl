# Quinto lote: criterios de revisión de boletas y guías de derechos

Revisión: 26 de septiembre de 2026. Base: `3089581`. Continúa las prioridades de `docs/MEJORAS_LOTE_4_2026-09-26.md`.

## 1. Problemas comprobados y cambios

El módulo `src/lib/parsers/_analisis-legales.ts` emitía conclusiones jurídicas a partir de palabras aisladas y datos que `ParsedBoleta` no puede acreditar. Se revisaron sus criterios y las referencias que mostraba `src/components/parsers/AnalisisLegalSection.tsx`.

| Problema en la versión anterior | Cambio implementado |
| --- | --- |
| Toda reliquidación de luz, agua o gas se sometía a cuatro meses y se sugería rechazar el pago | Se pide identificar la causa, períodos y cálculo; no se confunde una reliquidación tarifaria con consumo omitido |
| Una tasa mensual superior a 2,5% generaba posible usura y conversión anual sin contexto | Se elimina el umbral; se pide capital, días, periodicidad, régimen y referencia aplicable. Una publicidad en otra línea no se atribuye al cargo de mora |
| Una lectura estimada generaba afirmaciones de falta de lectura y relectura gratuita para todos los servicios | La señal se describe como mención textual; no prueba secuencia ni causa y no traslada el artículo eléctrico al agua/gas |
| La ausencia de la palabra corte probaba reposición improcedente; su presencia desactivaba la alerta | Un cargo positivo requiere registro, intervención y precio; ninguna de esas inferencias textuales valida o invalida el cobro |
| Temporadas de agua/invierno se juzgaban por el mes de emisión | Se retira ese juicio. El criterio solicita período de consumo, ámbito y tarifa, incluso si la fecha falta o es inválida |
| Se deducían errores en potencia, cargo único y alcantarillado por etiquetas incompletas | Se solicitan unidades y fundamento; extracción parcial o sinónimos no equivalen a falta de base del cobro |
| Mención del SAP sin descuento implicaba beneficio pendiente | Se distingue publicidad, asignación municipal y extracción. No se extienden anuncios eléctricos al subsidio de agua |
| Electrodependencia prometía ausencia de cortes bajo cualquier circunstancia | Se diferencia suspensión por deuda de protección y respaldo ante interrupciones; no se acredita registro por una mención |
| Una interrupción sin compensación implicaba derecho automático desde 22 horas | Se requieren antecedentes del evento; se retiran umbral y fórmula universales. Una palabra sobre compensación no equivale a un abono extraído |
| Cilindros de 13/30 kg podían tratarse como formato irregular usando el total comprado | Se retira el detector: la cantidad total no acredita número ni formato individual de envases |
| Se aplicaban reglas de red a compras de cilindros o a gas sin unidad identificada | Los criterios de suministro de gas requieren consumo en m³ y excluyen ventas de producto |
| Avisos y reclamos prometían plazos de 10/15 días, cinco días de respuesta o 24 horas de reconexión universales | Se remite al procedimiento y condiciones del servicio. No se emiten multas, devoluciones o plazos individuales no comprobados |

Los filtros de cargos positivos rechazan abonos, ceros y valores no finitos. Los avisos genéricos se mantienen como información; no se presentan como hechos de la cuenta. La función sigue siendo pura, determinista y no muta la boleta.

También se corrigieron textos paralelos que habrían contradicho la revisión en `electricidad/cge.ts`, `electricidad/_saesa-family.ts`, `electricidad/_bt2-cargos.ts` y `gas/metrogas.ts`. No se modificó la extracción de importes de esos parsers.

## 2. Contrato de resultados y fuentes

- El módulo conserva el nombre histórico, pero `SeveridadAnalisis` ahora usa **`revision` / `informativo`**. Se eliminan las etiquetas “Alerta legal” y “Derecho disponible” de ese componente.
- Cada resultado declara `alcance: 'orientativo'` y `versionAnalisis: '2026-09-26.1'`.
- `src/data/normativa-chilena.ts` contiene 27 referencias clasificadas como **norma**, **contexto** o **canal**. La UI distingue esos tres tipos; un directorio de trámites no se ofrece como “norma completa”.
- Los IDs históricos que contienen `4m`, `2m`, `10d` o `15d` se conservan solo como identificadores internos. No codifican plazos activos ni aparecen como etiquetas al usuario.
- El resumen sin cargos marcados se refiere al desglose, no a la ausencia de puntos de orientación en todo el documento. Se verifica su convivencia en navegador.

### Fuentes primarias contrastadas

| Fuente | Alcance utilizado |
| --- | --- |
| [SEC: reliquidaciones tarifarias 2020–2024, comunicación de marzo de 2026](https://www.sec.cl/sec-instruye-a-empresas-electricas-aplazar-cobro-de-reliquidaciones-tarifarias-hasta-julio-de-2026/) | Evidencia de que una reliquidación puede tener otra causa y período; no se usa para atribuir ese mecanismo a toda boleta |
| [BCN: Decreto 327, artículo 129](https://www.bcn.cl/leychile/navegar?idNorma=124102) | Condiciones de facturación provisoria eléctrica; no extrapoladas a otros servicios |
| [CMF: metodología de interés corriente y máximo convencional](https://www.cmfchile.cl/portal/estadisticas/626/w4-article-102391.html) | Necesidad de identificar características de la operación; no se descargó ni aplicó una tasa individual vigente |
| [SEC: actualización del registro de pacientes electrodependientes](https://www.sec.cl/ministerio-de-energia-y-sec-realizan-llamado-a-inscribirse-y-actualizar-el-registro-de-pacientes-electrodependientes/) | Protección por deuda, atención y respaldo frente a interrupciones; no garantía de continuidad absoluta |
| [ChileAtiende: Subsidio al Pago del Consumo de Agua Potable](https://www.chileatiende.gob.cl/fichas/51314/1/pdf) | Consulta municipal y alcance del SAP; se retiraron tramos y renovación automática inventados |
| [ChileAtiende: cómo y dónde realizar un reclamo](https://www.chileatiende.gob.cl/fichas/35879) | Distinción de canales sectoriales |
| [SEC: reclamos y la SEC](https://www.sec.cl/area-ciudadana/reclamos-y-la-sec/) | Condiciones de su canal; no plazos trasladables a cualquier reclamo |
| [SERNAC: ingresar un reclamo](https://www.sernac.cl/portal/617/w3-article-9178.html) | Presentación de antecedentes y trámite, sin prometer un resultado |
| [SERNAC: artículo 3](https://www.sernac.cl/portal/609/w3-article-52718.html) y [derecho de información comercial](https://www.sernac.cl/portal/617/w3-article-57420.html) | Marco de información y derechos, separado de una infracción concreta |
| [SEC: antecedentes de facturación de distribuidoras](https://www.sec.cl/clientes-dx/) | Contexto de datos necesarios para revisar componentes; no constituye validación de un tarifario |

Parte de las páginas se recuperó mediante texto oficial indexado en búsquedas. Algunas aperturas directas de SEC/ChileAtiende respondieron 403 o timeout y SISS no pudo recuperarse directamente. Se documenta esa limitación: **no se verificó exhaustivamente la regulación sanitaria o de gas**, ni se sustituyó la falta de fuente por un artículo supuesto. Las referencias de canal solo orientan dónde consultar.

## 3. Cuatro guías reescritas

Se conservaron URLs y fechas de publicación; `updatedAt` pasó a `2026-09-26` por revisión sustancial. Cada artículo tiene fuentes junto a las afirmaciones materiales, enlaces internos y dos FAQ visibles que alimentan el mismo JSON-LD.

| Archivo en `src/content/guias/` | Corrección |
| --- | --- |
| `te-cortaron-servicio-sin-aviso-que-hacer.mdx` | Se separan avería, suspensión y problema de instalación. Se retiran horarios de reposición inventados, multas “a tu favor”, importes típicos sin fuente, plazos universales y correo ficticio de contacto |
| `reclamar-cobro-indebido-paso-a-paso.mdx` | Se sustituyen placeholders por un proceso concreto de documentación, petición, canal y seguimiento. No se presenta acudir a la empresa como requisito universal de SERNAC ni se recomienda abandonar reclamos por monto pequeño |
| `derechos-consumidor-chile-servicios-basicos.mdx` | Se retira el borrador pendiente, la multa numérica y el recorrido de cuatro etapas obligatorias. Se distingue derecho general de infracción probada |
| `subsidio-agua-potable-sap-chile.mdx` | Se corrige exclusión rural, tramos RSH supuestos, renovación anual automática y aplicación desde la solicitud. Se explica consultar la asignación antes de comparar la boleta |

No se ha medido un nuevo período de Search Console; estas correcciones no acreditan una variación de CTR, tráfico o posiciones.

## 4. Validación

Validación local del build que se publicará:

| Comprobación | Resultado |
| --- | --- |
| `pnpm build` | Correcto: compilación, tipos y prerender |
| `pnpm lint`, `pnpm lint:tono` | Correctos |
| `pnpm test:coverage` | **875 pruebas aprobadas, 47 archivos** |
| Cobertura del ámbito de parsers | Statements 89,11%; branches 78,61%; functions 91,48%; lines 90,15% |
| Playwright sobre build de producción local | **131/131 aprobadas**, Chromium, sin reintentos |
| JavaScript generado | 32 chunks, **2.214 kB** en total; mayor **455 kB**; presupuestos 3.500/600 kB |
| Rendimiento sintético, cuatro rutas | FCP/LCP **68–80 ms**, CLS máximo **0,0006**; cumple presupuestos |

Los registros y las capturas móviles de resultados están en `docs/mejoras/2026-09-26-lote-5/`. Las cifras de rendimiento son un ensayo local, no métricas de usuarios reales. El tamaño total de chunks tampoco equivale a la descarga inicial de cada página. La cobertura sigue limitada al ámbito configurado en `vitest.config.ts`.

Las pruebas del módulo cubren menciones publicitarias, tasas a ambos lados del antiguo umbral, abonos/ceros/importes no finitos, períodos cruzados y fechas inválidas, unidades de gas, sinónimos, fuentes, pureza y versión de los resultados. Las pruebas de navegador comprueban lectura del resultado, etiquetas orientativas, fuentes desplegables, FAQ/JSON-LD, metadatos, sitemap, enlaces internos y ausencia de desbordamiento móvil.

Se revisó el resultado visual a 390 px. No se certifica Safari/iOS ni contraste completo; la exclusión de contraste en Axe es preexistente. No se cambió el procesamiento OCR/PDF ni se enviaron boletas a un servidor. Las comprobaciones usan fixtures de prueba, sin documentos nuevos de clientes.

El estado de CI y despliegue debe consultarse para el commit de este lote en GitHub. Los resultados anteriores no se atribuyen a esta publicación.

## 5. Límites y siguientes pasos

Este lote corrige conclusiones que el lector no podía respaldar. **No crea un verificador jurídico**, no valida contratos/notificaciones/registros y no calcula devoluciones. No se presenta el catálogo de canales como una auditoría legal completa de cada servicio.

Los puntos de esta sección se calculan al mostrar el resultado; no se almacenan como tales en IndexedDB. No se migran boletas históricas ni se recalculan las marcas `sospechoso` ya guardadas. La revisión explícita y versionada de ese historial sigue pendiente.

Siguientes prioridades:

1. Revisar precios, vigencia, promociones y cobertura del comparador de internet: los datasets aún contienen referencias y estimaciones antiguas.
2. Crear catálogo tarifario con referencias aplicables por período, zona, unidad e impuestos antes de reactivar comparaciones de precios.
3. Revisar guías restantes y mejorar la trazabilidad de reglas específicas según evidencia de facturación.
4. Completar recálculo explícito del historial, pruebas Safari/iOS, retención de assets y fuentes locales de build.
5. Medir SEO en ventanas comparables después del recrawl, sin atribuir efectos antes de disponer de datos.
