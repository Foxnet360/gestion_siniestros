## Why

El sistema actual mide Lead Time global (promedio de 24.5 días entre Aviso y Pago), pero esto es insuficiente para identificar cuellos de botella operativos. No se mide el tiempo en cada una de las 16 etapas del proceso, ni la frecuencia de seguimiento, ni la eficiencia relativa por aseguradora, ramo o técnico. Se necesita un KPI granular que permita identificar etapas problemáticas, comparar performance entre segmentos y distinguir procesos normales (30-90 días) de prescripciones (2-5 años) que distorsionan las métricas.

## What Changes

- **Nueva tabla `metricas_etapas`** para almacenar cálculos por etapa individual (tiempos, frecuencia de seguimiento, cumplimiento SLA)
- **Nueva tabla `sla_por_etapa`** con definición de SLAs y frecuencias esperadas para cada una de las 16 etapas
- **Servicio `MetricasEtapasService`** para calcular métricas desde datos históricos (`siniestro_etapas` + `claim_history`)
- **Endpoint `/api/kpis/eficiencia-etapas`** con filtros por aseguradora, ramo, técnico, tipo de proceso
- **Dashboard "Eficiencia por Etapas"** con visualización de funnel, tiempos por etapa, cuellos de botella y comparativas
- **Indicador de calidad de datos**: muestra cantidad y porcentaje de siniestros excluidos del KPI por datos incompletos
- **Percentil P90 como métrica principal** (en lugar de promedio simple) para representar la experiencia del 90% de casos
- **Clasificación automática de tipo de proceso**: Normal, Prescripción Ordinaria (2 años), Prescripción Extraordinaria (5 años)

## Capabilities

### New Capabilities

- `metricas-etapas-calculo`: Cálculo de métricas individuales por cada una de las 16 etapas del proceso de siniestros, incluyendo tiempos de permanencia, frecuencia de seguimiento basada en actualizaciones del campo observaciones, y cumplimiento de SLAs definidos por etapa
- `kpi-eficiencia-dashboard`: Visualización completa del KPI con funnel de conversión entre etapas, identificación de cuellos de botella, gráficos de tiempos por etapa, y comparativas temporales
- `segmentacion-kpi`: Capacidad de filtrar y comparar métricas de eficiencia por aseguradora, ramo, técnico asignado, rango de valor, y tipo de proceso (normal/prescripción)
- `calidad-datos-kpi`: Sistema de exclusión de siniestros con datos incompletos (sin etapa 1 o 16) con indicador visible de cantidad y porcentaje de exclusiones
- `calculo-dias-habiles-colombia`: Cálculo preciso de días hábiles considerando fines de semana y feriados de Colombia

### Modified Capabilities

- (No hay modificaciones a capabilities existentes - este es un nuevo sistema de KPI independiente)

## Impact

- **Base de datos**: Nuevas tablas `metricas_etapas`, `sla_por_etapa`, `seguimientos_procesados`, `kpis_etapas_agregados`; índices adicionales en tablas existentes
- **Backend**: Nuevo servicio `MetricasEtapasService.ts`, nuevos endpoints en API, procesamiento batch para datos históricos
- **Frontend**: Nuevo dashboard con componentes de visualización (funnel, heatmap, gráficos comparativos)
- **Performance**: Cálculos iniciales batch pueden ser intensivos (miles de registros históricos); uso de caché para consultas frecuentes
- **Dependencias**: Requiere datos de `siniestro_etapas`, `claim_history`, tabla `claims` existente
- **Breaking changes**: Ninguno - sistema aditivo que no modifica funcionalidad existente
