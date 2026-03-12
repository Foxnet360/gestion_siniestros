## ADDED Requirements

### Requirement: Extraer fechas de 16 etapas desde observaciones

El sistema SHALL extraer automáticamente las fechas de 16 etapas clave del proceso de siniestros desde el campo observaciones usando búsqueda por texto exacto (case-insensitive).

#### Scenario: Extracción exitosa de todas las etapas

- **WHEN** se procesa una observación que contiene todas las etapas
- **THEN** el sistema SHALL extraer y almacenar las fechas de las 16 etapas definidas

#### Scenario: Etapa no encontrada en observación

- **WHEN** se procesa una observación que no contiene una etapa específica
- **THEN** el sistema SHALL dejar el campo de fecha de esa etapa como NULL
- **AND** SHALL continuar procesando las demás etapas

### Requirement: Etapas 1 y 2 - Fechas de sistema SS

El sistema SHALL extraer las fechas de las Etapas 1 (Aviso Siniestro) y 2 (Radicación Compañía) desde los campos correspondientes del sistema SS, no desde observaciones.

#### Scenario: Extracción de fecha de aviso

- **WHEN** se registra un nuevo siniestro en SS
- **THEN** el sistema SHALL extraer la fecha de aviso del campo correspondiente
- **AND** SHALL almacenarla en la etapa 1

#### Scenario: Extracción de fecha de radicación

- **WHEN** se notifica a la aseguradora
- **THEN** el sistema SHALL extraer la fecha de notificación
- **AND** SHALL almacenarla en la etapa 2

### Requirement: Etapas 3-16 - Extracción desde observaciones

El sistema SHALL extraer las fechas de las Etapas 3-16 buscando textos exactos en el campo observaciones según la siguiente tabla:

| Etapa | Texto a buscar              |
| ----- | --------------------------- |
| 3     | AJUSTADOR                   |
| 4     | DOCUMENTOS ADICIONALES      |
| 5     | ASISTENCIA                  |
| 6     | LIQUIDACIÓN                 |
| 7     | OBJECIÓN                    |
| 8     | RECONSIDERACIÓN LIQUIDACIÓN |
| 9     | RECONSIDERACIÓN OBJECIÓN    |
| 10    | DESISTIMIENTO               |
| 11    | RATIFICACIÓN LIQUIDACIÓN    |
| 12    | RATIFICACIÓN OBJECIÓN       |
| 13    | PRESCRIPCIÓN                |
| 14    | PROCESO JURÍDICO            |
| 15    | FINALIZADO                  |
| 16    | PAGADO                      |

#### Scenario: Búsqueda case-insensitive

- **WHEN** se busca el texto "liquidación" en una observación
- **THEN** el sistema SHALL encontrar coincidencias con "LIQUIDACIÓN", "Liquidación", "liquidación", etc.

#### Scenario: Extracción de fecha asociada

- **WHEN** se encuentra una palabra clave en la observación
- **THEN** el sistema SHALL extraer la fecha asociada que aparece junto a la palabra clave
- **AND** SHALL almacenarla en la etapa correspondiente

### Requirement: Procesamiento batch de observaciones históricas

El sistema SHALL proporcionar un servicio de procesamiento batch para extraer fechas de todas las observaciones históricas existentes.

#### Scenario: Procesamiento de backlog completo

- **WHEN** se ejecuta el job de procesamiento batch
- **THEN** el sistema SHALL procesar todas las observaciones históricas sin fechas extraídas
- **AND** SHALL actualizar la tabla de etapas con las fechas encontradas

#### Scenario: Resumen de procesamiento

- **WHEN** finaliza el procesamiento batch
- **THEN** el sistema SHALL generar un resumen con: total de siniestros procesados, fechas extraídas por etapa, y observaciones no parseables

### Requirement: Procesamiento en tiempo real de nuevas observaciones

El sistema SHALL procesar automáticamente las observaciones nuevas o actualizadas para extraer sus fechas.

#### Scenario: Trigger en inserción de observación

- **WHEN** se inserta una nueva observación
- **THEN** el sistema SHALL ejecutar el procesamiento de extracción de fechas
- **AND** SHALL actualizar la tabla de etapas correspondiente

#### Scenario: Trigger en actualización de observación

- **WHEN** se actualiza una observación existente
- **THEN** el sistema SHALL re-procesar la observación
- **AND** SHALL actualizar las fechas de etapas si hay cambios

### Requirement: Almacenamiento estructurado de etapas

El sistema SHALL almacenar las fechas extraídas en una tabla normalizada con columnas específicas para cada etapa.

#### Scenario: Estructura de tabla

- **WHEN** se extrae una fecha de etapa
- **THEN** el sistema SHALL almacenarla en la tabla `siniestro_etapas`
- **AND** la tabla SHALL tener columnas: id, siniestro_id, etapa_1_fecha, etapa_2_fecha, ..., etapa_16_fecha, updated_at

### Requirement: Servicio SlaTrackingService

El sistema SHALL implementar un servicio `SlaTrackingService` que encapsule toda la lógica de extracción y almacenamiento de fechas de etapas.

#### Scenario: Extracción de un siniestro

- **WHEN** se invoca `SlaTrackingService.extract(siniestroId)`
- **THEN** el servicio SHALL extraer todas las fechas de etapas del siniestro
- **AND** SHALL retornar un objeto con las fechas extraídas

#### Scenario: Actualización de etapas

- **WHEN** se invoca `SlaTrackingService.updateStages(siniestroId, fechas)`
- **THEN** el servicio SHALL actualizar la tabla `siniestro_etapas` con las fechas proporcionadas
- **AND** SHALL actualizar el campo `updated_at`

### Requirement: Logging de observaciones no parseables

El sistema SHALL registrar en logs las observaciones que no puedan ser parseadas correctamente para análisis posterior.

#### Scenario: Observación sin formato reconocido

- **WHEN** una observación no contiene ningún texto de etapa reconocido
- **THEN** el sistema SHALL registrar el ID del siniestro y un snippet de la observación
- **AND** SHALL continuar con el siguiente siniestro sin fallar

### Requirement: Validación de fechas

El sistema SHALL validar que las fechas extraídas sean válidas y estén dentro de rangos razonables.

#### Scenario: Fecha futura detectada

- **WHEN** se extrae una fecha posterior a la fecha actual
- **THEN** el sistema SHALL rechazar la fecha
- **AND** SHALL registrar la inconsistencia en logs

#### Scenario: Fecha anterior a creación del siniestro

- **WHEN** se extrae una fecha anterior a la fecha de creación del siniestro
- **THEN** el sistema SHALL registrar una advertencia
- **AND** SHALL almacenar la fecha para revisión manual
