# Spec: KPI Eficiencia Dashboard

## Purpose
TBD: Definition of the visual Dashboard and widgets for operational efficiency metrics.

## Requirements

### Requirement: Visualizar funnel de conversión entre etapas
El sistema SHALL mostrar un funnel visual que represente la cantidad de siniestros en cada una de las 16 etapas y las tasas de conversión entre etapas consecutivas.

#### Scenario: Visualización de funnel completo
- **WHEN** el usuario accede al dashboard de eficiencia
- **THEN** el sistema SHALL mostrar un gráfico de funnel con las 16 etapas, el número de siniestros en cada etapa, y el porcentaje de conversión entre etapas

#### Scenario: Funnel filtrado por tipo de proceso
- **WHEN** el usuario selecciona filtro "Prescripción Ordinaria"
- **THEN** el sistema SHALL mostrar el funnel solo con siniestros de ese tipo de proceso

#### Scenario: Identificación visual de etapas críticas
- **WHEN** una etapa tiene una tasa de conversión menor al 70%
- **THEN** el sistema SHALL resaltar esa etapa en color rojo o con un indicador de alerta

### Requirement: Visualizar tiempos promedio por etapa
El sistema SHALL mostrar gráficos comparativos de los tiempos promedio (y percentil P90) en cada etapa, comparados contra los SLAs definidos.

#### Scenario: Gráfico de barras de tiempos vs SLA
- **WHEN** el usuario visualiza la sección de tiempos por etapa
- **THEN** el sistema SHALL mostrar un gráfico de barras donde cada etapa tiene: barra azul (tiempo real), línea roja (SLA), y tooltip con valores exactos

#### Scenario: Identificación de etapas fuera de SLA
- **WHEN** el tiempo promedio de una etapa excede su SLA
- **THEN** el sistema SHALL mostrar la barra de esa etapa en color naranja o rojo

#### Scenario: Comparación de percentiles
- **WHEN** el usuario selecciona "Ver P90"
- **THEN** el sistema SHALL mostrar el percentil 90 junto al promedio para cada etapa

### Requirement: Identificar y visualizar cuellos de botella
El sistema SHALL identificar automáticamente las etapas que son cuellos de botella basándose en desviación del SLA y volumen de siniestros afectados.

#### Scenario: Detección automática de cuello de botella
- **WHEN** el tiempo promedio de una etapa excede el SLA en más del 50%
- **THEN** el sistema SHALL marcar esa etapa como "cuello de botella" y mostrarla en una sección especial del dashboard

#### Scenario: Ranking de cuellos de botella
- **WHEN** existen múltiples cuellos de botella
- **THEN** el sistema SHALL ordenarlos por severidad (desviación porcentual del SLA) y mostrar el impacto en cantidad de siniestros

#### Scenario: Detalle de causa de cuello de botella
- **WHEN** el usuario hace clic en un cuello de botella identificado
- **THEN** el sistema SHALL mostrar información adicional: principales causas, distribución por aseguradora, tendencia temporal

### Requirement: Mostrar indicador de calidad de datos
El sistema SHALL mostrar claramente la cantidad y porcentaje de siniestros excluidos del KPI debido a datos incompletos.

#### Scenario: Indicador visible de exclusiones
- **WHEN** el usuario visualiza el dashboard
- **THEN** el sistema SHALL mostrar un panel con: "X siniestros analizados | Y incluidos en KPI (Z%) | W excluidos (V%)"

#### Scenario: Desglose de razones de exclusión
- **WHEN** el usuario hace clic en el indicador de excluidos
- **THEN** el sistema SHALL mostrar un desglose: sin etapa 1 (X casos), sin etapa 16 (Y casos), datos insuficientes (Z casos)

#### Scenario: Alerta por alta tasa de exclusiones
- **WHEN** más del 30% de los siniestros son excluidos
- **THEN** el sistema SHALL mostrar una alerta amarilla sugiriendo revisar la calidad de los datos fuente

### Requirement: Visualizar tendencias temporales
El sistema SHALL permitir visualizar la evolución temporal de los KPIs, comparando períodos (mes a mes, trimestre a trimestre).

#### Scenario: Gráfico de tendencia de Lead Time
- **WHEN** el usuario selecciona "Ver tendencia"
- **THEN** el sistema SHALL mostrar un gráfico de línea con el Lead Time promedio y P90 por mes en los últimos 12 meses

#### Scenario: Comparación con período anterior
- **WHEN** el usuario está viendo métricas del mes actual
- **THEN** el sistema SHALL mostrar la variación porcentual respecto al mes anterior (ej: "+15% vs mes pasado")

#### Scenario: Identificación de tendencias preocupantes
- **WHEN** una etapa muestra incremento en tiempo promedio por 3 meses consecutivos
- **THEN** el sistema SHALL mostrar una alerta de tendencia negativa con sugerencia de revisión

### Requirement: Mostrar Lead Time por tipo de proceso
El sistema SHALL mostrar métricas de Lead Time separadas por tipo de proceso (Normal, Prescripción Ordinaria, Prescripción Extraordinaria) para evitar distorsiones.

#### Scenario: Visualización separada por tipo
- **WHEN** el usuario visualiza la sección de Lead Time
- **THEN** el sistema SHALL mostrar tres métricas separadas con sus promedios y P90: Normal (ej: 45 días), Prescripción Ord (ej: 685 días), Prescripción Ext (ej: 1240 días)

#### Scenario: Comparación entre tipos de proceso
- **WHEN** el usuario selecciona "Comparar tipos"
- **THEN** el sistema SHALL mostrar un gráfico comparativo de distribución de tiempos por tipo de proceso

### Requirement: Exportar datos del dashboard
El sistema SHALL permitir exportar los datos visualizados en el dashboard a formatos CSV o Excel.

#### Scenario: Exportación de métricas por etapa
- **WHEN** el usuario hace clic en "Exportar"
- **THEN** el sistema SHALL generar un archivo CSV con las métricas de todas las etapas: nombre, cantidad siniestros, tiempo promedio, tiempo P90, SLA, cumplimiento %

#### Scenario: Exportación de funnel
- **WHEN** el usuario selecciona "Exportar funnel"
- **THEN** el sistema SHALL generar un archivo con la estructura del funnel: etapa, entrada, salida, tasa conversión
