# Spec: Calidad de Datos KPI

## Purpose
TBD: Definition of data quality rules for KPIs, handling incomplete data and exclusion tracking.

## Requirements

### Requirement: Validar completitud de datos de entrada
El sistema SHALL validar que cada siniestro tenga los datos mínimos necesarios antes de incluirlo en el cálculo de KPIs.

#### Scenario: Siniestro con etapa 1 y 16 completas
- **WHEN** un siniestro tiene registrada la etapa 1 (Aviso Siniestro) y la etapa 16 (Pagado)
- **THEN** el sistema SHALL marcarlo como "datos_completos = true" e incluirlo en los KPIs

#### Scenario: Siniestro sin etapa 1
- **WHEN** un siniestro no tiene registrada la etapa 1 (fecha de inicio desconocida)
- **THEN** el sistema SHALL marcarlo como "datos_completos = false", razón "sin_etapa_1", y excluirlo del KPI

#### Scenario: Siniestro sin etapa 16
- **WHEN** un siniestro tiene etapa 1 pero no tiene etapa 16 (aún en proceso o datos faltantes)
- **THEN** el sistema SHALL marcarlo como "datos_completos = false", razón "sin_etapa_16", y excluirlo del KPI

#### Scenario: Siniestro con etapas intermedias faltantes
- **WHEN** un siniestro salta de etapa 3 directamente a etapa 6 sin registros de etapas 4 y 5
- **THEN** el sistema SHALL incluirlo en el KPI pero marcar "etapas_intermedias_faltantes = true" y estimar tiempos faltantes

### Requirement: Contar y reportar siniestros excluidos
El sistema SHALL mantener contadores precisos de siniestros excluidos del KPI y reportarlos claramente.

#### Scenario: Contador en tiempo real
- **WHEN** se procesa un lote de siniestros
- **THEN** el sistema SHALL actualizar contadores: total_analizados, incluidos, excluidos, y desglose por razón

#### Scenario: Reporte de calidad de datos
- **WHEN** el usuario solicita "Ver calidad de datos"
- **THEN** el sistema SHALL mostrar: total siniestros en BD, porcentaje con datos completos, lista de razones de exclusión con cantidades

#### Scenario: Alerta por alta tasa de exclusión
- **WHEN** más del 30% de los siniestros son excluidos por datos incompletos
- **THEN** el sistema SHALL mostrar alerta amarilla: "⚠️ 35% de siniestros excluidos - Revisar calidad de datos fuente"

#### Scenario: Alerta por tasa crítica de exclusión
- **WHEN** más del 50% de los siniestros son excluidos
- **THEN** el sistema SHALL mostrar alerta roja: "🚨 52% de siniestros excluidos - Los KPIs pueden no ser representativos"

### Requirement: Mostrar indicador visible de calidad
El sistema SHALL mostrar un indicador prominente en el dashboard que informe sobre la calidad de los datos incluidos en los KPIs.

#### Scenario: Indicador en header del dashboard
- **WHEN** el usuario abre el dashboard de eficiencia
- **THEN** el sistema SHALL mostrar en la parte superior: "📊 KPI calculado sobre 890 de 1,250 siniestros (71%) | 360 excluidos"

#### Scenario: Tooltip con detalle
- **WHEN** el usuario pasa el mouse sobre el indicador
- **THEN** el sistema SHALL mostrar tooltip con desglose: "Sin etapa 1: 120 | Sin etapa 16: 180 | Datos insuficientes: 60"

#### Scenario: Enlace a detalle completo
- **WHEN** el usuario hace clic en el indicador
- **THEN** el sistema SHALL navegar a una vista detallada con tabla de siniestros excluidos y razones

### Requirement: Documentar razones de exclusión
El sistema SHALL documentar claramente por qué cada siniestro fue excluido para auditoría y mejora de procesos.

#### Scenario: Razón específica por siniestro
- **WHEN** se revisa un siniestro excluido
- **THEN** el sistema SHALL mostrar: razón de exclusión, fecha de análisis, datos disponibles vs faltantes

#### Scenario: Clasificación de razones
- **WHEN** se excluyen siniestros
- **THEN** el sistema SHALL clasificar razones en categorías: "Falta inicio", "Falta fin", "Datos corruptos", "Inconsistencias"

#### Scenario: Tendencia de calidad de datos
- **WHEN** el usuario solicita "Tendencia de calidad"
- **THEN** el sistema SHALL mostrar gráfico de porcentaje de siniestros con datos completos mes a mes

### Requirement: Permitir inclusión condicional
El sistema SHALL permitir al usuario incluir siniestros incompletos en el análisis bajo su responsabilidad, con advertencias claras.

#### Scenario: Opción de incluir incompletos
- **WHEN** el usuario selecciona "Incluir siniestros incompletos"
- **THEN** el sistema SHALL mostrar advertencia: "⚠️ Esto puede distorsionar los KPIs. ¿Continuar?"

#### Scenario: KPI con datos parciales
- **WHEN** el usuario confirma inclusión de incompletos
- **THEN** el sistema SHALL recalcular KPIs con todos los siniestros y marcar claramente "KPI calculado sobre datos parciales"

#### Scenario: Estimación para datos faltantes
- **WHEN** se incluyen siniestros incompletos
- **THEN** el sistema SHALL estimar tiempos faltantes basándose en promedios históricos y marcarlos como "estimados"

### Requirement: Reporte de siniestros excluidos
El sistema SHALL generar reportes detallados de siniestros excluidos para análisis y mejora de procesos de captura de datos.

#### Scenario: Exportar lista de excluidos
- **WHEN** el usuario solicita "Exportar siniestros excluidos"
- **THEN** el sistema SHALL generar CSV con: id_siniestro, razón_exclusión, datos_disponibles, técnico_asignado, fecha_ultimo_seguimiento

#### Scenario: Análisis de patrones de exclusión
- **WHEN** el usuario solicita "Análisis de exclusiones"
- **THEN** el sistema SHALL mostrar: por aseguradora (¿alguna tiene más exclusiones?), por técnico, por ramo, por rango de fechas

#### Scenario: Recomendaciones de mejora
- **WHEN** se identifica un patrón (ej: 80% de exclusiones son "sin etapa 16" de una aseguradora específica)
- **THEN** el sistema SHALL sugerir: "Revisar proceso de cierre con Aseguradora X - 80% de casos sin fecha de pago registrada"

### Requirement: Validar consistencia de datos
El sistema SHALL validar la consistencia lógica de los datos antes de usarlos en KPIs.

#### Scenario: Fecha de etapa posterior a fecha siguiente
- **WHEN** la fecha de etapa 3 es posterior a la fecha de etapa 4
- **THEN** el sistema SHALL marcar inconsistencia y excluir el siniestro o corregir automáticamente si es posible

#### Scenario: Duración negativa detectada
- **WHEN** el cálculo resulta en días negativos para una etapa
- **THEN** el sistema SHALL marcar "datos_corruptos" y excluir del KPI

#### Scenario: Fechas futuras
- **WHEN** se detecta una fecha de etapa en el futuro
- **THEN** el sistema SHALL marcar error y excluir hasta que se corrija
