/**
 * Fixture Esval — período marzo-abril 2021.
 *
 * Nivel A. Fuente: https://www.esval.cl/personas/necesito-ayuda/tus-boletas-y-cobros/conoce-tu-boleta/
 * (boleta-esval.jpg)
 *
 * RUT en este ejemplo oficial: 76.000.739-0 (verificado contra el JPG en
 * el sitio de Esval). El parser y empresas.ts pueden tener variantes —
 * por seguridad mantenemos ambos en keywords.
 */

export const ESVAL_REAL_2021_04 = `ESVAL Comprometidos con la vida
ESVAL S.A. Venta de Agua Potable y Servicios
RUT: 76.000.739-0
Cochrane 751, Valparaíso

R.U.T.: 76.000.739-0
BOLETA ELECTRÓNICA
Nº 54802546
S.I.I. - VALPARAÍSO

Sr. (a)  NOMBRE APELLIDO
Dirección: AVENIDA EJEMPLO BK B 42, VALPARAÍSO

TOTAL A PAGAR    $ 11.580
FECHA VENCIMIENTO    10/05/2021

Ruta de Lectura: 16-011-1690-6
Fecha Emisión: 23-04-2021
Número de Cliente: 286251-4

Fechas de Lecturas    Actual 16/04/2021    Anterior 17/03/2021    Próx. Estimada 17-05-2021
Lecturas              Actual 1243           Anterior 1234
Consumos              Cliente 9,00 m3       A Facturar 14,10 m3

DETALLE DE FACTURACIÓN
                          Unidades Facturadas    Valor Unitario    Total Parcial
Cargo Fijo                                                          $   1.231
Consumo Agua              14,10 m3              $ 802,91           $  11.321
Recolección               14,10 m3              $ 312,02           $   4.399
Tratamiento               14,10 m3              $ 291,26           $   4.107
Subtotal del mes                                                   $  21.058
Subsidio (14,10m3 45%)                                             $  -9.476
Sencillo Anterior                                                  $       2
Sencillo Actual                                                    $      -4

ESVAL INFORMA
Usted Pagó al 31/03/2021 la cantidad de  $10.690
El Beneficio de su Subsidio termina el 01/05/2021
Para renovarlo contacte al Departamento Social de su Municipalidad
SU LIMITE DE SOBRECONSUMO ES: 40 m3
Fin Período Punta. Estimado cliente su consumo se encuentra afecto a la
proporcionalidad del término de período punta.

DATOS DEL CONSUMO
Clave de Lectura            LECTURA NORMAL
Fecha Emisión               23/04/2021
Número Medidor              60817
Diámetro de Arranque        013 mm
Factor de Cobro             1,00
Días del Período            30
Diferencia Matriz Remarcador  162,00 m3
Prorrateo Cliente           3,14% + 5,10 m3
Tipo Prorrateo              PROPORCIONAL AL CONSUMO
Grupo Tarifario             1
Tarifas Publicadas          07/09/2020 EL MOSTRADOR.CL

EL IVA MES DE ESTA BOLETA
Monto Neto $ 9.733  Monto Exento $ 0  Monto IVA $ 1.849  Monto Total $ 11.582

GRÁFICO DE CONSUMO (m3) últimos 13 meses

Atención al Cliente: 600 600 6060
www.esval.cl
SISS: 600 600 6000
`
