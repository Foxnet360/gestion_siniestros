# Purpose

Interactive dashboard displaying key performance indicators for claims management with visual gauges, trend lines, and real-time updates.
## Requirements
### Requirement: Dashboard con KPIs principales

El sistema SHALL mostrar un dashboard interactivo con KPIs organizados en secciones temáticas visuales calculados en tiempo real.

#### Scenario: Visualización de secciones del dashboard

- **WHEN** un usuario accede al dashboard
- **THEN** el sistema SHALL mostrar las siguientes secciones organizadas:
  - "Indicadores de Eficiencia Operativa" (Lead Time, Tasa Desistimiento, Tasa Objetados, Tasa Prescritos)
  - "Gestión Técnica y Financiera" (Frecuencia y Severidad por Ramo)
  - "SLA por Etapas y Control de Backlog" (Pipeline, Backlog, Timeline SLA)
  - "Plan de Acción" (Tareas pendientes)

#### Scenario: Navegación lateral

- **WHEN** el usuario visualiza el dashboard
- **THEN** el sistema SHALL mostrar una barra lateral con navegación a: Resumen, Eficiencia Operativa, Gestión Financiera, SLA por Etapas, Alertas, Configuración

#### Scenario: Visualización de KPIs

- **WHEN** un usuario accede al dashboard
- **THEN** el sistema SHALL mostrar los siguientes KPIs: Ciclo de Resolución, Tasa de Desistimiento, Tasa de Objetados, Tasa de Prescritos, % Cerrados en Plazo, y Backlog de Siniestros Activos

#### Scenario: Actualización automática

- **WHEN** los datos subyacentes cambian
- **THEN** el sistema SHALL actualizar los valores de los KPIs en el dashboard
- **AND** SHALL mostrar un indicador de última actualización

### Requirement: Visualizaciones gráficas

El sistema SHALL utilizar componentes visuales avanzados para mostrar los KPIs en formatos gráficos interactivos.

#### Scenario: Gráficos tipo Gauge

- **WHEN** se muestra un KPI con meta definida (Lead Time, Desistimiento)
- **THEN** el sistema SHALL mostrar gauges o medidores circulares indicando progreso hacia la meta
- **AND** SHALL color-code: verde si cumple meta, amarillo/rojo si no cumple

#### Scenario: Gráficos tipo Donut

- **WHEN** se muestran proporciones (Backlog, Tasas)
- **THEN** el sistema SHALL mostrar gráficos donut con porcentajes
- **AND** SHALL mostrar breakdown al hacer hover

#### Scenario: Gráficos de líneas temporales

- **WHEN** se muestran tendencias (Frecuencia siniestralidad)
- **THEN** el sistema SHALL mostrar gráficos de líneas con meses en eje X
- **AND** SHALL destacar valores actuales

#### Scenario: Gráficos de barras horizontales

- **WHEN** se muestra tiempo por etapa
- **THEN** el sistema SHALL mostrar barras horizontales comparando etapas
- **AND** SHALL mostrar líneas de referencia para límites SLA

#### Scenario: Gráfico de líneas para tendencias

- **WHEN** se muestra el dashboard
- **THEN** el sistema SHALL incluir gráficos de líneas para tendencias temporales de KPIs
- **AND** SHALL permitir seleccionar el rango de fechas

#### Scenario: Gráfico de barras para comparativos

- **WHEN** se aplican filtros por aseguradora o ramo
- **THEN** el sistema SHALL mostrar gráficos de barras comparando KPIs entre categorías

#### Scenario: Indicadores tipo gauge

- **WHEN** se muestran KPIs con metas definidas
- **THEN** el sistema SHALL mostrar gauges o medidores circulares indicando progreso hacia la meta

### Requirement: KPI 1 - Ciclo de Resolución (Lead Time)

El sistema SHALL calcular y mostrar el tiempo promedio desde el aviso hasta la finalización con visualización gauge y tendencia.

#### Scenario: Visualización Lead Time Gauge

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL mostrar un gauge chart con el valor actual de Lead Time
- **AND** SHALL mostrar "28 DÍAS HÁBILES" como valor principal
- **AND** SHALL mostrar meta "META: <30 DÍAS HÁBILES (Colombia)"
- **AND** SHALL color-code el gauge según cumplimiento

#### Scenario: Tendencia Lead Time

- **WHEN** se muestra el Lead Time
- **THEN** el sistema SHALL incluir una mini línea de tendencia mostrando evolución
- **AND** SHALL mostrar flecha indicando dirección de la tendencia

#### Scenario: Cálculo de lead time promedio

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL calcular: Promedio de (etapa_16_fecha - etapa_1_fecha) para siniestros finalizados
- **AND** SHALL mostrar el resultado en días hábiles

#### Scenario: Meta visual

- **WHEN** el lead time es menor a 30 días hábiles
- **THEN** el sistema SHALL resaltar el KPI en color verde
- **AND** SHALL mostrar un indicador de cumplimiento de meta

#### Scenario: Alerta de meta no cumplida

- **WHEN** el lead time es mayor o igual a 30 días hábiles
- **THEN** el sistema SHALL resaltar el KPI en color rojo o amarillo
- **AND** SHALL mostrar el valor excedido

### Requirement: KPI 2 - Tasa de Desistimiento

El sistema SHALL calcular la tasa de siniestros desistidos como porcentaje del total presentado.

#### Scenario: Cálculo de tasa

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL calcular: (COUNT de etapas con observación "DESISTIMIENTO" / COUNT total de siniestros del período) \* 100

#### Scenario: Meta visual

- **WHEN** la tasa de desistimiento es menor al 10%
- **THEN** el sistema SHALL resaltar el KPI en color verde

### Requirement: KPI 3 - Tasa de Objetados

El sistema SHALL calcular la tasa de siniestros objetados.

#### Scenario: Cálculo de tasa

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL calcular: (COUNT de etapas con observación "OBJECIÓN" / COUNT total de siniestros del período) \* 100

### Requirement: KPI 4 - Tasa de Prescritos

El sistema SHALL calcular la tasa de siniestros prescritos.

#### Scenario: Cálculo de tasa

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL calcular: (COUNT de etapas con observación "PRESCRIPCIÓN" / COUNT total de siniestros del período) \* 100

### Requirement: KPI 5 - Porcentaje Cerrados en Plazo (SLA)

El sistema SHALL calcular el porcentaje de siniestros cerrados dentro del plazo establecido.

#### Scenario: Cálculo de SLA

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL calcular: (Total siniestros finalizados / Total siniestros abiertos) \* 100

#### Scenario: Meta visual

- **WHEN** el porcentaje es menor o igual al 19%
- **THEN** el sistema SHALL resaltar el KPI en color verde según meta definida

### Requirement: KPI 6 - Backlog de Siniestros Activos
El sistema SHALL mostrar el número total de siniestros activos y su porcentaje relativo respecto al total histórico o actual de siniestros registrados.
El porcentaje SHALL ser calculado dinámicamente dividiendo `backlogActivos` entre el número total real de siniestros (`totalClaims`), sin utilizar dividendos ni valores estáticos predefinidos.

#### Scenario: Visualización del KPI de Backlog
- **WHEN** el usuario visualiza la sección "SLA POR ETAPAS Y CONTROL DE BACKLOG" en el Dashboard principal
- **THEN** el sistema SHALL mostrar una gráfica tipo Donut (Donut Chart) titulada "CONTROL DE BACKLOG DE SINIESTROS ACTIVOS"
- **AND** el sistema SHALL mostrar el porcentaje preciso de siniestros activos, calculado dinámicamente con los datos de siniestros totales devolvidos por los servicios/APIs del sistema.

### Requirement: Filtros multidimensionales en UI

El sistema SHALL proporcionar controles de filtro compactos en el header del dashboard.

#### Scenario: Filtros en header

- **WHEN** el usuario ve el dashboard
- **THEN** el sistema SHALL mostrar filtros en fila horizontal: ASEGURADORA, RAMO, VENDEDOR, FECHA
- **AND** SHALL incluir botón "GENERAR REPORTE"
- **AND** SHALL mostrar icono de filtros adicionales

#### Scenario: Selector de fechas con calendario

- **WHEN** el usuario hace clic en filtro FECHA
- **THEN** el sistema SHALL mostrar un date picker con calendario
- **AND** SHALL permitir selección de rango

#### Scenario: Filtro por aseguradora

- **WHEN** el usuario selecciona una aseguradora del filtro
- **THEN** el sistema SHALL recalcular todos los KPIs filtrando solo siniestros de esa aseguradora
- **AND** SHALL actualizar las visualizaciones en tiempo real

#### Scenario: Filtro por rango de fechas

- **WHEN** el usuario selecciona un rango de fechas
- **THEN** el sistema SHALL calcular KPIs solo para siniestros dentro de ese rango

#### Scenario: Combinación de filtros

- **WHEN** el usuario aplica múltiples filtros simultáneamente
- **THEN** el sistema SHALL aplicar todos los filtros con operador AND
- **AND** SHALL mostrar indicadores de filtros activos

#### Scenario: Limpieza de filtros

- **WHEN** el usuario hace clic en "Limpiar filtros"
- **THEN** el sistema SHALL restablecer todos los filtros a valores por defecto
- **AND** SHALL recargar los KPIs sin filtros

### Requirement: Línea de tiempo SLA por etapas

El sistema SHALL mostrar una línea de tiempo visual del workflow de siniestros con indicadores de SLA por etapa.

#### Scenario: Visualización timeline

- **WHEN** el usuario accede a la sección SLA
- **THEN** el sistema SHALL mostrar una línea horizontal con nodos numerados del 1 al 16
- **AND** SHALL conectar los nodos con líneas de progreso
- **AND** SHALL usar colores: azul (normal), verde (completado), naranja (advertencia), rojo (excedido)

#### Scenario: Etiquetas de etapas

- **WHEN** se muestra el timeline
- **THEN** el sistema SHALL mostrar nombres de etapas debajo de cada nodo:
  1. Aviso Siniestro
  2. Radicación Compañía
  3. Auditor
  4. Auditor Documentos Adicionales
  5. Asistencia Revisión
  6. Radicación Asistencia
  7. Objeción
  8. Revisión Liquidación
  9. Objeción
  10. Proceso
  11. Liquidación
  12. Objeción
  13. Proceso
  14. Jurídico
  15. Finalizado
  16. Pagado

#### Scenario: Indicadores de estado en timeline

- **WHEN** se procesan etapas
- **THEN** el sistema SHALL mostrar iconos indicando estado: checkmark (completado), warning (alerta), clock (pendiente)

### Requirement: Plan de Acción - Tareas Pendientes

El sistema SHALL mostrar un panel de tareas pendientes con acciones ejecutables.

#### Scenario: Lista de tareas

- **WHEN** el usuario ve la sección Plan de Acción
- **THEN** el sistema SHALL mostrar una lista de tareas con:
  - Checkbox para completar
  - Descripción de la tarea
  - Badge de estado (EN PROCESO, PENDIENTE, VALIDANDO CON ASEGURADORAS)
  - Botón de acción (Marcar como Completada)

#### Scenario: Estados de tarea

- **WHEN** se muestra el badge de estado
- **THEN** el sistema SHALL usar colores:
  - EN PROCESO: azul
  - PENDIENTE: naranja
  - VALIDANDO CON ASEGURADORAS: amarillo con icono de advertencia

### Requirement: Severidad por Ramo

El sistema SHALL mostrar severidad monetaria desglosada por tipo de siniestro/ramo.

#### Scenario: Gráfico de barras por ramo

- **WHEN** el usuario ve la gestión financiera
- **THEN** el sistema SHALL mostrar barras verticales por ramo con valores en pesos colombianos (COP)
- **AND** SHALL mostrar valores como: $ 15.000.000, $ 22.000.000, $ 10.000.000, $ 13.000.000, $ 5.000.000
- **AND** SHALL etiquetar ramos: Automóvil, Empresas, Automas, Espacias, etc.

#### Scenario: Selector de amparo

- **WHEN** el usuario interactúa con el gráfico
- **THEN** el sistema SHALL mostrar mensaje indicando: "CREAR LISTA DESPLEGABLE POR AMPARO (EXTRAER DE TIPO DE SINIESTRO SS)"

### Requirement: Frecuencia de Siniestralidad

El sistema SHALL mostrar la frecuencia de siniestralidad desglosada por período.

#### Scenario: Línea de tendencia anual

- **WHEN** el usuario ve la gestión técnica
- **THEN** el sistema SHALL mostrar una línea de tendencia de 12 meses
- **AND** SHALL mostrar porcentajes en eje Y (0% - 20%)
- **AND** SHALL destacar el valor actual (ej: 15%)
- **AND** SHALL mostrar contexto: "DESGLOSO ARS ÚLTIMO AÑO ÚLTIMOS 3 MESES"

#### Scenario: Advertencia de datos históricos

- **WHEN** los datos históricos son insuficientes
- **THEN** el sistema SHALL mostrar mensaje con icono de advertencia: "GENERAR DATOS HISTÓRICOS ÚLTIMOS 3 MESES"

### Requirement: Responsive Design

El sistema SHALL ser responsive y adaptarse a diferentes tamaños de pantalla.

#### Scenario: Vista desktop

- **WHEN** el usuario accede desde una pantalla grande
- **THEN** el sistema SHALL mostrar el dashboard en layout multi-columna

#### Scenario: Vista móvil

- **WHEN** el usuario accede desde un dispositivo móvil
- **THEN** el sistema SHALL mostrar el dashboard en layout de una columna
- **AND** SHALL permitir scroll vertical

### Requirement: Exportación de datos del dashboard

El sistema SHALL permitir exportar los datos visualizados en el dashboard.

#### Scenario: Exportar a CSV

- **WHEN** el usuario hace clic en "Exportar datos"
- **THEN** el sistema SHALL generar un archivo CSV con los datos filtrados actualmente visibles
- **AND** SHALL descargar el archivo automáticamente

