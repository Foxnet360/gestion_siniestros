## ADDED Requirements

### Requirement: Dashboard con 6 KPIs principales

El sistema SHALL mostrar un dashboard interactivo con al menos 6 KPIs principales calculados en tiempo real.

#### Scenario: Visualización de KPIs

- **WHEN** un usuario accede al dashboard
- **THEN** el sistema SHALL mostrar los siguientes KPIs: Ciclo de Resolución, Tasa de Desistimiento, Tasa de Objetados, Tasa de Prescritos, % Cerrados en Plazo, y Backlog de Siniestros Activos

#### Scenario: Actualización automática

- **WHEN** los datos subyacentes cambian
- **THEN** el sistema SHALL actualizar los valores de los KPIs en el dashboard
- **AND** SHALL mostrar un indicador de última actualización

### Requirement: KPI 1 - Ciclo de Resolución (Lead Time)

El sistema SHALL calcular y mostrar el tiempo promedio desde el aviso hasta la finalización (Etapa 16 - Etapa 1).

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

El sistema SHALL mostrar el número total de siniestros actualmente abiertos (sin etapa 15 o 16).

#### Scenario: Conteo de backlog

- **WHEN** se consulta el dashboard
- **THEN** el sistema SHALL contar: siniestros que NO tienen fecha en etapa_15_fecha NI etapa_16_fecha
- **AND** SHALL mostrar el número total

### Requirement: Visualizaciones gráficas

El sistema SHALL utilizar Recharts para visualizar los KPIs en gráficos interactivos.

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

### Requirement: Filtros multidimensionales en UI

El sistema SHALL proporcionar controles de filtro en el dashboard para: Aseguradora, Asegurado, Ramo, Vendedor, Valor Indemnizado, Fecha de Siniestro, N° de Siniestro en SS, y N° de Siniestro Compañía.

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
