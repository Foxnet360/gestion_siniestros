## ADDED Requirements

### Requirement: Calcular tiempo de permanencia por etapa

El sistema SHALL calcular el tiempo de permanencia en días hábiles para cada una de las 16 etapas del proceso de siniestros, utilizando las fechas registradas en la tabla `siniestro_etapas`.

#### Scenario: Cálculo de tiempo entre etapas consecutivas

- **WHEN** un siniestro tiene registradas las fechas de entrada y salida de una etapa
- **THEN** el sistema SHALL calcular los días hábiles entre esas fechas, excluyendo sábados, domingos y feriados colombianos

#### Scenario: Identificación de siniestros sin etapa inicial

- **WHEN** un siniestro no tiene registrada la etapa 1 (Aviso Siniestro)
- **THEN** el sistema SHALL marcar el siniestro como "incompleto" y excluirlo del cálculo de métricas

#### Scenario: Identificación de siniestros sin etapa final

- **WHEN** un siniestro no tiene registrada la etapa 16 (Pagado)
- **THEN** el sistema SHALL marcar el siniestro como "incompleto" y excluirlo del cálculo de métricas

### Requirement: Calcular frecuencia de seguimiento por etapa

El sistema SHALL calcular la frecuencia promedio de seguimientos en cada etapa, contando cada actualización del campo observaciones como un seguimiento.

#### Scenario: Cálculo de frecuencia con múltiples seguimientos

- **WHEN** un siniestro tiene 4 actualizaciones de observaciones durante una etapa de 12 días
- **THEN** el sistema SHALL calcular la frecuencia como 4 días entre seguimientos (12 días / 3 intervalos)

#### Scenario: Cálculo de frecuencia sin seguimientos

- **WHEN** un siniestro no tiene actualizaciones de observaciones durante una etapa
- **THEN** el sistema SHALL registrar frecuencia como NULL y cantidad de seguimientos como 0

#### Scenario: Cálculo de frecuencia con un solo seguimiento

- **WHEN** un siniestro tiene exactamente 1 actualización de observaciones durante una etapa
- **THEN** el sistema SHALL registrar frecuencia como igual a la duración de la etapa y cantidad como 1

### Requirement: Evaluar cumplimiento de SLA por etapa

El sistema SHALL comparar el tiempo real en cada etapa contra el SLA definido en la tabla `sla_por_etapa` y determinar si se cumplió o no.

#### Scenario: Etapa dentro del SLA

- **WHEN** la etapa 2 (Radicación Compañía) tiene una duración de 3 días hábiles
- **THEN** el sistema SHALL marcar el cumplimiento de SLA como TRUE (SLA: 5 días)

#### Scenario: Etapa fuera del SLA

- **WHEN** la etapa 3 (Ajustador) tiene una duración de 15 días hábiles
- **THEN** el sistema SHALL marcar el cumplimiento de SLA como FALSE (SLA: 10 días)

#### Scenario: Etapa sin SLA definido

- **WHEN** una etapa no tiene SLA definido en la tabla `sla_por_etapa`
- **THEN** el sistema SHALL marcar el cumplimiento de SLA como NULL

### Requirement: Clasificar tipo de proceso

El sistema SHALL clasificar automáticamente cada siniestro en uno de tres tipos de proceso basado en su duración total y etapas recorridas.

#### Scenario: Proceso normal

- **WHEN** un siniestro no pasa por la etapa 13 (Prescripción) y tiene una duración total menor a 365 días
- **THEN** el sistema SHALL clasificarlo como tipo de proceso "normal"

#### Scenario: Prescripción ordinaria

- **WHEN** un siniestro pasa por la etapa 13 y tiene una duración total entre 365 y 1095 días
- **THEN** el sistema SHALL clasificarlo como tipo de proceso "prescripcion_ordinaria"

#### Scenario: Prescripción extraordinaria

- **WHEN** un siniestro pasa por la etapa 13 y tiene una duración total mayor a 1095 días
- **THEN** el sistema SHALL clasificarlo como tipo de proceso "prescripcion_extraordinaria"

### Requirement: Calcular métricas de conversión entre etapas

El sistema SHALL calcular la tasa de conversión entre etapas consecutivas, identificando en qué etapas se pierden siniestros.

#### Scenario: Conversión exitosa entre etapas

- **WHEN** 100 siniestros entran a la etapa 3 y 88 salen hacia la etapa 4
- **THEN** el sistema SHALL calcular una tasa de conversión del 88% para la etapa 3

#### Scenario: Pérdida en etapa

- **WHEN** 100 siniestros entran a la etapa 7 (Objeción) y solo 60 salen hacia la etapa 8
- **THEN** el sistema SHALL calcular una tasa de conversión del 60% y marcar la etapa como punto de abandono

### Requirement: Almacenar métricas calculadas

El sistema SHALL persistir todas las métricas calculadas en la tabla `metricas_etapas` para permitir consultas eficientes y análisis histórico.

#### Scenario: Guardado exitoso de métricas

- **WHEN** se completan los cálculos para un siniestro
- **THEN** el sistema SHALL almacenar: claim_id, etapa_num, fecha_entrada, fecha_salida, dias_habiles, cantidad_seguimientos, frecuencia_promedio, dias_sla, cumple_sla, tipo_proceso, y metadatos de segmentación

#### Scenario: Actualización de métricas existentes

- **WHEN** se recalculan métricas para un siniestro que ya tiene registros
- **THEN** el sistema SHALL actualizar los registros existentes y modificar el campo updated_at
