# Sexto lote: SEO on-site, comparador de internet y lectura sin JavaScript

Revisión: 26 de septiembre de 2026. Base: `74117f0`. Continúa las prioridades del quinto lote y `docs/SEO_Y_PLAN_REVISADO_2026-09-24.md`.

## 1. Problemas comprobados

| Archivo anterior | Hallazgo | Corrección |
| --- | --- | --- |
| `src/data/internet-planes.ts` | Promociones de mayo/junio, precios posteriores estimados, revisión pendiente desde agosto, instalación solo en texto | Catálogo editorial con importes por tramo, instalación estructurada, fuente y fechas por oferta |
| `src/data/internet-fibra-2026.ts` | Segundo catálogo de precios y estadísticas, con diferencias respecto del comparador | Retirado; las guías enlazan al catálogo único sin repetir precios |
| `src/app/comparador-internet-hogar/_components/comparador.tsx` | Puntaje arbitrario y “mejor costo real” pese a datos incompletos; filtro por precio promocional | Sin puntaje ni ganador; filtros sobre promedio proyectado a 12/24 meses, instalación incluida cuando se conoce |
| Mismo componente | Campo de comuna sin efecto y afirmaciones universales sobre fibra/permanencia | Se retira ese campo; cobertura se consulta con la dirección directamente en cada proveedor |
| `src/app/page.tsx` | Prometía filtrar por comuna | Descripción alineada con mensualidades, instalación y consulta externa de cobertura |
| `src/content/guias/fibra-vs-cable-internet-chile.mdx` | Fibra siempre dedicada/simétrica, latencias garantizadas, precios antiguos, umbral universal de velocidad y liderazgo comercial sin respaldo | Guía técnica centrada en contrato, red doméstica, tecnología y condiciones del plan, con fuentes UIT/CableLabs/SUBTEL |
| `src/content/guias/reclamar-subtel-internet-paso-a-paso.mdx` | Espera de 15 días corridos, tabla de multas supuesta, ClaveÚnica obligatoria y promesas de éxito | Procedimiento documentado de primera instancia e insistencia, sin pronosticar resoluciones o multas |
| `src/app/loading.tsx` y los tres `loading.tsx` bajo `src/app/guias/` | El comparador dinámico y las guías quedaban en “Cargando…” sin JavaScript: el HTML llegaba oculto bajo la frontera de streaming | Se retiran esos fallbacks; se comprueba lectura sin scripts y nuevamente el CLS. El progreso específico de PDF/OCR se conserva |
| `scripts/lint-tono.mjs` | Fallaba al leer un archivo eliminado y omitía archivos nuevos aún no staged | Incluye archivos nuevos no ignorados y omite archivos eliminados del árbol de trabajo |

## 2. Catálogo y criterio de selección

`src/data/internet-planes.ts` contiene **siete ofertas observadas de cuatro proveedores**. Es una selección editorial, no un catálogo exhaustivo ni una consulta en tiempo real.

| Proveedor / selección | Fuente consultada | Decisión |
| --- | --- | --- |
| WOM: Fibra 600 y 800 | [Internet Hogar WOM](https://store.wom.cl/hogar/internet-hogar/) | Dos tramos; instalación publicada sin costo. La campaña mostraba término el 28 de septiembre |
| Movistar: Fibra 800, Giga y pack 600 + TV | [Internet Hogar Movistar](https://ww2.movistar.cl/hogar/internet-hogar/) | Se utilizan importes coincidentes en las fichas. El 600 individual se excluye: la página mostraba $16.990 por 12 meses en una sección y $14.990 por 6 en otra. No se resuelve esa contradicción suponiendo una oferta |
| GTD: Fibra 940 | [Ficha Fibra 940](https://www.gtd.cl/hogar/productos-hogar/internet-fibra-optica/internet-hogar-giga) | Dos tramos e instalación $0 en contenido oficial indexado, vigencia hasta el 30 de septiembre. Subida queda sin confirmar |
| Mundo: Plan 1 Mundo 800 | [Ficha oficial de Tu Mundo](https://www.tumundo.cl/hogar/1-mundo/) | Cuatro tramos, incluido mes 25. Instalación sin confirmar: se muestran mensualidades, pero no total ni promedio completo. Corrige además el dominio de consulta |
| Entel, Claro y VTR | Sus enlaces oficiales permanecen en la página | No se incorporan precios de convenios, páginas antiguas o extracción incompleta como ofertas generales |

Limitaciones de la consulta: el texto de Entel no expuso el precio dinámico; VTR respondió 403; GTD se respaldó en contenido oficial indexado tras timeout de apertura. Los resultados de Claro incluían cotizadores y páginas antiguas sin una vigencia suficiente para elegir una oferta. No se verificaron contratos individuales ni factibilidad domiciliaria. Las consultas no enviaron teléfonos, RUT ni direcciones.

Cada ficha declara `observadaEl`, `revisarEl` y, cuando se publica, `ofertaHasta`. **Observar una página no garantiza que la oferta siga disponible para una persona.** Se invita a confirmar la cotización y sus condiciones.

### Cálculo y caducidad

`src/lib/internet/comparacion.ts` suma los meses correspondientes a cada tramo y una instalación única. No completa huecos, superposiciones o importes desconocidos con cero. Una instalación desconocida impide el total y excluye ese plan del filtro de presupuesto; los demás datos siguen visibles sin ese filtro.

El promedio utiliza el total exacto dividido por el horizonte para filtrar; solo se redondea al mostrar pesos. No se modelan reajustes futuros, equipos opcionales, consumos extra, prorrateos ni cargos de término. Tampoco se deduce permanencia desde un cero antiguo del catálogo.

La fecha de Santiago se evalúa por visita mediante `connection()`. El cliente actualiza su fecha cada minuto o al volver a la pestaña. Al superar el fin de campaña o el límite editorial inclusivo se retira ese precio. Un reloj cliente atrasado no reactiva datos vencidos respecto de la fecha recibida del servidor. Los enlaces de proveedores y el contenido explicativo permanecen disponibles.

El límite editorial inicial es el 26 de octubre; las campañas con cierre anterior se retiran antes. **No existe una renovación automática de precios**: volver a incorporarlos requiere revisar la fuente y sus condiciones.

## 3. SEO y experiencia dentro del sitio

- URL y canonical del comparador conservados; título, descripción, H1 y esquema `WebApplication` alineados con lo que hace la herramienta.
- Contenido explicativo en el servidor: cómo calcular, qué queda fuera, fuentes y consulta de cobertura. No requiere datos de contacto ni geolocalización.
- Cuatro FAQ visibles alimentan el mismo JSON-LD. No se garantiza un resultado enriquecido en buscadores.
- Navegación interna a precios, metodología y proveedores; enlaces contextuales entre el comparador y ambas guías.
- Las guías mantienen URLs y fecha original de publicación; actualización sustancial fechada el 26 de septiembre. Cada una tiene tres FAQ coherentes con su esquema.
- `src/app/sitemap.ts` registra la revisión real del comparador; las guías obtienen su fecha del frontmatter. No se cambia la fecha de todas las URLs en cada build.
- Controles con etiquetas explícitas, estado anunciado a lectores de pantalla, validación del presupuesto, limpieza de filtros y estados vacíos que no implican ausencia de cobertura.
- Contraste del comparador comprobado con Axe sin excluir `color-contrast`, en escritorio y móvil. La exclusión global preexistente de otras rutas no se amplía ni se presenta como corregida.

### Fuentes técnicas y de procedimiento

- [UIT: Broadband access and in-premises networks, 2025](https://www.itu.int/dms_pub/itu-t/opb/tut/T-TUT-HOME-2025-1-PDF-E.pdf): topologías ópticas y capacidad compartida.
- [CableLabs: HFC](https://www.cablelabs.com/technologies/hfc-networks) y [DOCSIS 4.0](https://www.cablelabs.com/technologies/docsis-4-0-technology): arquitectura y capacidades, sin atribuir despliegue a una dirección en Chile.
- [SUBTEL: primera instancia](https://www.subtel.gob.cl/reclamo-contra-una-empresa-de-telecomunicaciones-primera-instancia/) y [Departamento de Gestión de Reclamos](https://www.subtel.gob.cl/atencion-ciudadana/departamento-de-gestion-de-reclamos-dgr/): canales, etapas y plazos del trámite. Sus páginas muestran direcciones físicas distintas; la guía enlaza al canal actual sin fijar una dirección copiada.
- [SUBTEL: aplicación del OTI](https://www.subtel.gob.cl/marcha-blanca-ciudadana-comienza-a-funcionar-la-aplicacion-que-mide-la-velocidad-del-internet-fijo-en-todo-el-pais/): antecedente del procedimiento de medición por cable. No se toma la marcha blanca de 2025 como estado actual ni se infiere una compensación automática.

## 4. Validación

Validación local sobre el build final:

- `pnpm lint`, `pnpm lint:tono`, `pnpm exec tsc --noEmit` y `pnpm build`: correctos.
- Vitest: **915 pruebas en 48 archivos**, incluidas 40 del motor de comparación. Cubren tramos, instalación desconocida, rangos inválidos, importes no seguros, presupuesto cero, fechas y cierre en America/Santiago. La cobertura configurada de parsers mantiene 89,11% de sentencias y 78,61% de ramas; no se presenta como cobertura global.
- Playwright: **144 pruebas correctas, sin reintentos**, incluidas 11 nuevas del comparador y dos guías añadidas a la suite de SEO. Comprueba cálculo, filtros, vencimiento, metadatos, sitemap, FAQ, ausencia de desbordamiento y lectura sin scripts del comparador, ambas guías, índice y categoría.
- Axe: sin infracciones detectadas para las reglas WCAG A/AA aplicadas al comparador a 390 y 1280 px, incluido contraste. No sustituye una auditoría manual completa de accesibilidad.
- Inspección visual de escritorio y tarjeta móvil: jerarquía, importes, condiciones y enlaces legibles.
- Bundle: **2.175 kB en 31 chunks**, mayor chunk 455 kB; dentro de los presupuestos. El lote anterior registraba 2.214 kB en 32 chunks. Es la suma de artefactos JS del build, no la descarga inicial comprimida de una visita.
- Rendimiento local en cuatro rutas: LCP entre **56 y 108 ms**, CLS **0,0000** en la ejecución final, presupuestos correctos. Son mediciones de laboratorio en localhost, sin emulación de red móvil; no son datos de campo ni acreditan una mejora de posicionamiento.

Evidencia: `docs/mejoras/2026-09-26-lote-6/` contiene salidas de build, lint, unitarias, E2E, lectura sin JavaScript, bundle, rendimiento y capturas. Las pruebas iniciales detectaron etiquetas ambiguas y el contenido oculto por los fallbacks; ambos problemas quedaron corregidos antes de la ejecución final.

## 5. Pendientes y límites

1. Revisar las campañas al vencer; aumentar la selección solo con precios y condiciones trazables. Entel, Claro y VTR no se sustituyen con estimaciones.
2. Completar el catálogo tarifario de servicios básicos y el recálculo explícito del historial, pendientes del lote anterior.
3. Extender contraste y compatibilidad a Safari/iOS; esta validación usa Chromium.
4. Reducir dependencia de fuentes remotas durante el build y revisar costos de render dinámico si el comparador crece en visitas. El resto de páginas conserva SSG; no se añadió un backend de consulta comercial.
5. Medir SEO después del recrawl con nuevas ventanas comparables de Search Console. No se atribuyen cambios de CTR, posición o tráfico a estas correcciones.
