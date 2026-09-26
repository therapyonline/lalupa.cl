# CHANGELOG-data

Registro de actualizaciones de los datasets en `src/data/`. Cada fila refleja el origen y la fecha en que el archivo fue extraído de fuentes primarias.

> Cuando hagas un refresh de cualquier dataset, agrega una entrada nueva acá con la fecha y un resumen de qué cambió.

---

## 2026-09-26: Subsidio eléctrico, quinta convocatoria cerrada

- `elegibilidad-subsidio.ts`: corrección de la referencia para 4 o más integrantes a $31.224 por semestre / $5.204 por cuota. Calendario histórico de la quinta convocatoria, estado de postulación cerrada y fuentes oficiales en metadatos. El anuncio del Ministerio de Energía del 11 de agosto actualiza el inicio de aplicación a agosto según facturación; no se extrapolan fechas de próximas convocatorias.
- `subsidio-electrico.ts`: preguntas sobre las fechas de corte, entradas enteras sin truncamiento y booleanos estrictos. ClaveÚnica no bloquea la orientación; se retira el límite de 12 integrantes sin fundamento publicado.
- El resultado informa coincidencia orientativa y factores declarados; se elimina el puntaje de prioridad alta/media/baja. No se consultan registros ni se acredita adjudicación. Los borradores de subsidio anteriores a la versión 3 se descartan para no reinterpretar respuestas históricas; SERNAC conserva su formato.
- `normativa-chilena.ts`: la referencia de subsidio deja de publicar montos mensuales incorrectos. Una mención genérica en la boleta solo motiva una comprobación informativa.
- Fuentes, límites y comprobaciones: `docs/MEJORAS_LOTE_4_2026-09-26.md`. Las notas de lanzamiento conservan su carácter histórico, incluidas las previsiones antiguas que no constituyen fechas oficiales.

## 2026-09-25: Alcance tarifario y portada (tercer lote)

- `tarifas.ts`: los importes originales no se revalidaron ni se presentan como vigentes. Metadatos `historico_no_verificado`, uso de simulación y vigencia final desconocida. Se sustituyeron conversiones inseguras de `null` por tipos anulables y validación de entradas. El PDF CGE consultado respondió HTTP 403; no se infirieron nuevos precios.
- `indicadores.ts`: se retiraron los cuatro indicadores numéricos de portada sin evidencia suficiente (promedio nacional, subsidio, reclamos y variación anual). Ahora contiene recursos editoriales de consumo, tarifa, lectura e historial; no estadísticas ni promedios de una muestra incompleta.
- No se cambiaron precios, condiciones de subsidio ni otros datasets. Las notas de lanzamiento de abajo se conservan como registro histórico y no acreditan una verificación actual.

## 2026-05-06: Lanzamiento inicial

Primera versión de los 6 datasets, generada desde la investigación en `~/Desktop/research/` y verificada contra fuentes oficiales chilenas. Todos los archivos llevan su propio bloque `*_METADATA` con `ultimaActualizacion: '2026-05-06'`.

| Archivo | Origen | Fuentes primarias |
| --- | --- | --- |
| [`empresas.ts`](./empresas.ts) | `/research/output/empresas.ts` + `/02-boletas-reales/FINGERPRINTS.md` | CMF Chile (cmfchile.cl), Memorias Anuales 2023-2024, boletas oficiales en `/02-boletas-reales/ejemplos-publicos/` |
| [`tarifas.ts`](./tarifas.ts) | `/research/output/tarifas.ts` + `/01-tarifas/{electricidad,agua,gas}/` | SEC, CNE, SISS, sitios oficiales de cada distribuidora (CGE, Enel, Chilquinta, SAESA, Frontel, Aguas Andinas, Esval, Metrogas) |
| [`calendario.ts`](./calendario.ts) | `/research/output/calendario.ts` + `/01-tarifas/calendario-tarifario-2026.md` | feriados.cl, Ley 2.977, Ley 19.668, Ley 20.148, Ley 21.357 |
| [`elegibilidad-subsidio.ts`](./elegibilidad-subsidio.ts) | `/research/output/elegibilidad-subsidio.ts` + `/03-subsidios/subsidio-electrico-2026.md` | subsidioelectrico.cl, Ley 21.667, Decreto Exento 136/2024 Min. Energía |
| [`internet-planes.ts`](./internet-planes.ts) | `/research/output/internet-planes.ts` + `/05-mercado/planes-internet.md` | Sitios oficiales WOM, Entel, Movistar, Mundo, GTD, Claro (mayo 2026). Datos referenciales: verificar antes de cada release |
| [`comunas.ts`](./comunas.ts) | `/research/output/comunas.ts` + `/06-auxiliares/comunas_*.json` | INE 2018+, gist público de juanbrujo (DPA Chile) |

### Pendientes conocidos al 2026-05-06

Estas son las TODOs marcadas en los `_METADATA` de cada archivo. Resolverlas en próximas iteraciones.

- **`empresas.ts`**: RUTs y direcciones marcados `PENDIENTE` (Conafe, Nuevosur, Aguas del Valle, Abastible, Gasco GLP, Entel, VTR, WOM, Claro)
- **`tarifas.ts`**: Componentes variables (`null as unknown as number`) sin parsear todavía: Chilquinta, SAESA, Frontel, ESVAL, ESSBio, Nuevosur, SMAPA, Aguas del Valle, todas las tarifas de gas natural Metrogas residencial
- **`calendario.ts`**: Falta agregar feriados 2027 (revisar 2026-12-15)
- **`elegibilidad-subsidio.ts`**: Actualizar montos y fechas cuando arranque la 6ta convocatoria (probable nov 2026)
- **`internet-planes.ts`**: VTR/DirecTV/Pacífico Cable pendientes; precios cambian bimestral
- **`comunas.ts`**: Falta `codigoComuna` INE (5 dígitos) por comuna

---

## 2026-05-08: RUTs verificados con boletas oficiales + 13 parsers implementados

Agregamos 13 fixtures reales en `src/lib/parsers/__fixtures__/` (texto extraído de boletas oficiales o reconstruido con datos legales verificados). Esto destrabó:

1. **Implementación de los 13 parsers `parse()` faltantes** (Enel, SAESA, Frontel, Chilquinta, Aguas Andinas, Esval, ESSBio, Nuevosur, SMAPA, Metrogas, Lipigas, Abastible, Gasco GLP). Antes solo CGE estaba implementado; ahora son los 14 (CGE + 13 nuevos). Cobertura completa de tests con asserts contra fixtures reales.
2. **Corrección/verificación de RUTs en `empresas.ts`**:
   - `saesa`: `76.073.164-K` (no verificado) → `96.544.470-3` (boleta oficial Grupo SAESA)
   - `frontel`: `76.589.341-0` (no verificado) → `76.073.164-1` (boleta oficial gruposaesa.cl)
   - `esval`: `76.000.957-1` → `76.000.739-0` (boleta oficial esval.cl/conoce-tu-boleta)
   - `nuevosur`: PENDIENTE → `96.963.440-6` (DEPEJE Conoce Tu Boleta-NUEVOSUR.pdf)
   - `abastible`: PENDIENTE → `91.806.000-6` (boleta oficial abastible.cl/medidor)
   - `gasco-glp`: PENDIENTE → `96.568.740-8` (CMF + razón social GASCO GLP S.A.)
3. **Test sistémico `dataset-sync.test.ts`** que verifica que cada parser declare el RUT exacto de `empresas.ts` en sus keywords. Detecta drift entre fuente de verdad y parsers.

### Pendientes después de 2026-05-08

- **Conafe** (CGE subsidiaria), **Aguas del Valle**, **Entel/VTR/WOM/Claro** siguen `PENDIENTE` en `empresas.ts` , bloqueados en obtener boleta o verificación CMF.
- **`tarifas.ts`**: componentes variables en `null` para varias empresas siguen sin parsearse (no afecta parsers de boleta, los usa el motor de validación, función separada).
- **Lipigas y Abastible cilindro**: el fixture cubre solo gas por red (medidor). Una boleta de venta directa de cilindro Lipigas/Abastible probablemente requiera un parser adicional con `tipoVenta: 'producto'` (como Gasco GLP).

### Uso documentado al lanzamiento (histórico; ver revisión del 2026-09-25)

- `empresas.ts` → wizard SERNAC, autocompletado de empresa en formularios, parsers de boleta para resolver el `EmpresaServicio` desde el RUT detectado
- `tarifas.ts` → motor de validación: compara cargo real de boleta vs cargo esperado (helpers `calcularBoletaEsperada*` y `validarCobro`)
- `calendario.ts` → cálculo de plazos legales (18 días hábiles SERNAC, fecha "al día" del subsidio, etc.)
- `elegibilidad-subsidio.ts` → calculadora pre-elegibilidad antes de redirigir a subsidioelectrico.cl
- `internet-planes.ts` → comparador de planes (R5)
- `comunas.ts` → selectores región/comuna en formularios

### Investigación de origen , NO commiteada

Los siguientes directorios de `~/Desktop/research/` quedan **fuera del repo** (ver `.gitignore`):

- `00-fuentes/` , PDFs originales descargados (>100 MB)
- `02-boletas-reales/` , boletas de ejemplo y futuras boletas de test (datos sensibles si llegan reales)

Las referencias a estas carpetas en los datasets son trazabilidad histórica, no rutas resolvibles desde el repo.
