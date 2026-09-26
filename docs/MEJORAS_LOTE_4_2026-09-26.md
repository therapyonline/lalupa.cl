# Publicación, estabilidad visual y subsidio eléctrico: cuarto lote

Fecha de revisión: 26 de septiembre de 2026. Continúa `docs/MEJORAS_LOTE_3_2026-09-25.md` y el plan SEO revisado.

## 1. Publicación de las mejoras anteriores

Los tres lotes anteriores se publicaron en `main` mediante `6014dde` (134 archivos, incluidos informes y evidencias). Vercel confirmó el despliegue y se comprobó el HTML público de portada y de la guía sobre el alza de la cuenta. Los informes anteriores que dicen “no desplegado” describen su estado antes de esta publicación.

CI detectó un problema de rendimiento que las comprobaciones locales no habían reproducido: CLS **0,6088**. El diagnóstico incorporado en `scripts/perf-audit.mjs` (`3e05a11`) identificó el footer como elemento desplazado. El contenido en streaming sustituía una pantalla de carga demasiado corta, empujándolo fuera del primer viewport.

`src/app/loading.tsx` (`d964610`) reserva la altura del viewport bajo el encabezado mientras llega el contenido. **No se aumentaron los presupuestos de rendimiento.** El [CI de esa corrección](https://github.com/therapyonline/lalupa.cl/actions/runs/36276690254) pasó en sus cuatro trabajos: unitarias/cobertura, lint/build/auditoría, E2E y rendimiento. Vercel informó despliegue de producción completado. Estado recuperado en `docs/mejoras/2026-09-26-lote-4/ci-publicacion-previa.json`.

El CLS citado pertenece al ensayo sintético de CI; no representa datos de usuarios reales ni Search Console. No se atribuye todavía una mejora de tráfico a la publicación.

## 2. Revisión del subsidio y su guía SEO

### Errores encontrados

| Evidencia | Problema anterior | Corrección |
| --- | --- | --- |
| `src/data/elegibilidad-subsidio.ts` | $32.224 para hogares de 4 o más integrantes | $31.224 semestrales y $5.204 por cuota, quinta convocatoria |
| `src/app/subsidio-electrico/_components/wizard.tsx` | Invitación a postular, conclusión “calificas” y prioridad alta/media/baja | Convocatoria cerrada, consulta del resultado oficial y alcance orientativo |
| `src/data/subsidio-electrico.ts` | Respuestas actuales interpretadas como condiciones históricas; conversión permisiva y cantidad truncada | Preguntas con fechas de corte y validación de enteros/booleanos/tramo RSH |
| `src/content/guias/subsidio-electrico-2026-requisitos.mdx` | Placeholder, apertura futura ya pasada, ClaveÚnica obligatoria y primera cuota en septiembre | Artículo completo sobre resultados, requisitos históricos y montos, revisado el 26 de septiembre |
| `src/data/normativa-chilena.ts` | Importes semestrales presentados como mensuales y rango incorrecto | Referencia a consulta oficial y alcance de la lectura, sin extrapolar montos |
| `src/lib/parsers/_analisis-legales.ts` | Una publicidad del subsidio podía sugerir incumplimiento y descuento retroactivo | Hallazgo informativo: comprobar asignación, cliente y período antes de concluir |

### Fuentes primarias y decisión editorial

- [Ministerio de Energía, resultados del quinto proceso, 11 de agosto](https://energia.gob.cl/noticias/nacional/quinto-proceso-de-entrega-del-subsidio-electrico-llega-cifra-mas-alta-de-beneficiarios-desde-su-creacion): tabla monetaria y aplicación desde agosto, con julio/agosto juntos, según facturación. Se privilegió esta comunicación posterior frente a anuncios iniciales que mencionaban septiembre.
- [Gob.cl, cierre y resultados](https://www.gob.cl/noticias/fin-plazo-subsidio-electrico-quinta-convocatoria/): cierre del plazo de postulación y fecha anunciada de resultados.
- [Gob.cl, requisitos de la quinta convocatoria](https://www.gob.cl/noticias/como-postular-al-quinto-proceso-subsidio-electrico/): requisitos, períodos de referencia y alternativas a ClaveÚnica.
- [Ventanilla Única Social, ficha del beneficio](https://www.ventanillaunicasocial.gob.cl/ficha/381/subsidio-electrico): consulta de resultados, suministro compartido y priorización. Se usa para enlazar al servicio oficial.

Las fuentes se contrastaron mediante contenido oficial recuperado en búsquedas. Algunas aperturas directas respondieron 403; no se presenta esto como una descarga o validación de una resolución individual. La ficha y anuncios iniciales conservaban un calendario de aplicación anterior, por lo que la decisión sobre agosto queda documentada explícitamente.

### Comportamiento actual

- El formulario permite revisar la quinta convocatoria **cerrada**. Muestra ese estado antes de las preguntas y en el resultado, con enlaces de consulta oficial. No envía respuestas ni solicitudes a entidades públicas.
- Coincidir con las respuestas no acredita adjudicación. Los montos son referencias por integrantes; un suministro compartido puede requerir un cálculo distinto.
- La electrodependencia declarada no comprueba el registro ni sustituye requisitos como RSH, suministro residencial o condición de pago.
- Se muestran factores declarados de priorización, sin convertirlos en un puntaje o una probabilidad inventada.
- Se rechazan cantidades fraccionarias, faltantes y no finitas. Se elimina el máximo arbitrario de 12 personas.
- `src/lib/storage/wizard-state.ts` exige versión 3 para el borrador de subsidio. Un “sí” anterior a una pregunta sobre deuda actual no se reutiliza como afirmación de pago al corte de junio. Se informa el reinicio del formulario. El borrador de SERNAC no cambia.
- La guía conserva su URL y fecha de publicación original. Actualiza descripción, fecha de revisión, índice, enlaces internos y preguntas frecuentes visibles que alimentan el mismo JSON-LD. No se promete un resultado enriquecido en Google.
- `src/app/page.tsx` y los metadatos de la herramienta se alinean con este alcance. La portada también deja de afirmar que verifica si el cobro es justo o si un tramo está mal aplicado.

## 3. Verificación del cuarto lote

Validación local del build final, previa a publicar este lote:

| Comprobación | Resultado |
| --- | --- |
| `pnpm build` | Correcto: compilación, tipos y prerender |
| `pnpm lint`, `pnpm lint:tono` | Correctos |
| `pnpm test:coverage` | **851 pruebas / 47 archivos**, todas correctas |
| Cobertura de parsers | Statements 89,43%; ramas 78,32%; funciones 91,62%; líneas 90,42% |
| `PORT=3101 CI=1 pnpm exec playwright test --workers=3 --retries=0` | **121/121**, Chromium, build de producción, sin reintentos |
| `pnpm check:bundle-size` | 2.268 kB de chunks JS; mayor 455 kB, dentro de 3.500/600 kB |
| `pnpm perf:audit:ci` | Cuatro rutas dentro del presupuesto: FCP/LCP 68–88 ms; CLS máximo 0,0006 |
| `git diff --check` | Correcto |

Evidencia final en `docs/mejoras/2026-09-26-lote-4/`: build, unitarias/cobertura, E2E, bundle, rendimiento y capturas móviles. Son pruebas locales sintéticas; el tamaño de chunks no equivale a transferencia inicial y no se midieron CWV de usuarios reales.

Las regresiones cubren montos y tramos, electrodependencia sin sustituir otros requisitos, ClaveÚnica como alternativa, fecha histórica de pago, entradas inválidas, reinicio de borradores anteriores, enlaces oficiales, FAQ/JSON-LD, sitemap y render móvil. La primera pasada de E2E expuso dos selectores incorrectos en pruebas nuevas; se corrigieron y la pasada final completa fue satisfactoria.

Se revisaron visualmente guía y resultado a 390 px. Al mostrar el resultado se restablece el scroll al inicio y el foco al encabezado: la última pregunta ya no deja al usuario a mitad del informe. La prueba de navegador comprueba foco y posición. No se certifica Safari/iOS ni contraste completo: Axe conserva la exclusión de contraste preexistente.

El CI y despliegue de los lotes anteriores están documentados por separado en la sección 1. La ejecución de CI correspondiente a esta nueva publicación debe identificarse por su commit en GitHub; no se atribuye a este lote el resultado de una revisión anterior.

## 4. Límites y siguiente prioridad

El estado de la convocatoria es **editorial y explícito**, no un calendario que descubra automáticamente futuros llamados. Una nueva convocatoria requiere fuentes verificadas, fechas, preguntas, pruebas y nueva versión del borrador; no se deduce una fecha de sexta postulación.

No se implementó acceso a RSH, registros de electrodependencia, pagos ni resultados personales. Tampoco se revalidó todo el catálogo normativo, tarifas o precios de internet. Las pruebas de cobertura siguen midiendo parsers según `vitest.config.ts`; las nuevas pruebas del subsidio se ejecutan, pero no se presentan como cobertura global de toda la aplicación.

| Siguiente iniciativa | Área | Impacto | Esfuerzo | Riesgo de regresión |
| --- | --- | --- | --- | --- |
| Revisar las restantes alertas legales y guías económicas contra sus fuentes aplicables | Datos/Contenido | Alto | M–L | Alto |
| Catálogo tarifario verificable por zona, período, unidad e impuestos | Datos/Frontend | Alto | L | Alto |
| Revisar vigencia y condiciones de los planes de internet publicados | Datos/Contenido | Alto | M | Medio |
| Recálculo explícito y versionado de alertas ya guardadas | Datos/UI | Medio | M | Alto |
| Retención de assets y fuentes locales para builds reproducibles | DevOps | Medio | M | Medio |
| Medir páginas revisadas en ventanas GSC equivalentes después del recrawl | SEO | Alto | S más espera | Bajo |

Esta revisión prioriza errores comprobados del beneficio antes de ampliar funcionalidades. No hay nuevas métricas GSC ni evidencia de un cambio de posición o CTR todavía.
