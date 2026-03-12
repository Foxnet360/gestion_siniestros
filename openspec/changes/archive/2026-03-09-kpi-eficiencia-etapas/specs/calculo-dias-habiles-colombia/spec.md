## ADDED Requirements

### Requirement: Calcular días hábiles excluyendo fines de semana

El sistema SHALL calcular días hábiles entre dos fechas excluyendo sábados y domingos.

#### Scenario: Cálculo básico de días hábiles

- **WHEN** se calculan días entre lunes y viernes de la misma semana
- **THEN** el sistema SHALL retornar 5 días hábiles

#### Scenario: Cálculo cruzando fin de semana

- **WHEN** se calculan días entre viernes y lunes siguiente
- **THEN** el sistema SHALL retornar 2 días hábiles (excluyendo sábado y domingo)

#### Scenario: Cálculo de un solo día

- **WHEN** se calculan días entre un lunes y el mismo lunes
- **THEN** el sistema SHALL retornar 1 día hábil

#### Scenario: Cálculo de duración en etapa

- **WHEN** un siniestro entra a una etapa el lunes 1 y sale el viernes 5
- **THEN** el sistema SHALL calcular 5 días hábiles en esa etapa

### Requirement: Manejar feriados de Colombia

El sistema SHALL excluir los feriados nacionales de Colombia del cálculo de días hábiles.

#### Scenario: Feriado en medio de la semana

- **WHEN** se calculan días hábiles entre lunes y viernes donde el miércoles es feriado
- **THEN** el sistema SHALL retornar 4 días hábiles (excluyendo el feriado)

#### Scenario: Feriado en fin de semana

- **WHEN** un feriado cae en sábado o domingo
- **THEN** el sistema SHALL no contarlo como día hábil adicional (ya está excluido por ser fin de semana)

#### Scenario: Múltiples feriados en el período

- **WHEN** se calculan días entre fechas que incluyen varios feriados
- **THEN** el sistema SHALL excluir todos los feriados del conteo total

#### Scenario: Año bisiesto

- **WHEN** el cálculo incluye el 29 de febrero de un año bisiesto
- **THEN** el sistema SHALL manejar correctamente la fecha sin errores

### Requirement: Mantener calendario de feriados actualizado

El sistema SHALL utilizar un calendario de feriados de Colombia que pueda ser actualizado anualmente.

#### Scenario: Feriados año 2024

- **WHEN** se calculan días hábiles en 2024
- **THEN** el sistema SHALL reconocer feriados 2024: 1 ene, 8 ene, 25 mar, 28 mar, 9 mayo, 3 jun, 10 jun, 1 jul, 12 oct, 4 nov, 11 nov, 25 dic

#### Scenario: Feriados año 2025

- **WHEN** se actualiza el sistema con feriados 2025
- **THEN** el sistema SHALL utilizar el nuevo calendario para cálculos en 2025

#### Scenario: Feriado puente declarado

- **WHEN** el gobierno declara un feriado puente adicional
- **THEN** el administrador del sistema SHALL poder agregar el feriado sin necesidad de deploy

#### Scenario: Festivos locales opcionales

- **WHEN** una región tiene feriados locales adicionales
- **THEN** el sistema SHALL permitir configurar feriados adicionales por región si es necesario

### Requirement: Diferenciar entre días hábiles y calendario

El sistema SHALL permitir obtener tanto días hábiles como días calendario para comparación.

#### Scenario: Cálculo dual para una etapa

- **WHEN** se procesa una etapa de un siniestro
- **THEN** el sistema SHALL calcular y almacenar: días_habiles (ej: 10) y días_calendario (ej: 14)

#### Scenario: Indicador de eficiencia de tiempo

- **WHEN** se visualiza una métrica
- **THEN** el sistema SHALL mostrar opcionalmente ambos valores: "10 días hábiles (14 calendario)"

#### Scenario: Análisis de impacto de fines de semana

- **WHEN** el usuario solicita análisis detallado
- **THEN** el sistema SHALL mostrar el porcentaje de tiempo perdido en fines de semana y feriados

### Requirement: Manejar zonas horarias correctamente

El sistema SHALL manejar correctamente las fechas considerando la zona horaria de Colombia (UTC-5).

#### Scenario: Fechas sin componente de tiempo

- **WHEN** las fechas almacenadas son solo DATE (sin hora)
- **THEN** el sistema SHALL asumir inicio del día para cálculos consistentes

#### Scenario: Fechas con timestamp

- **WHEN** las fechas incluyen componente de tiempo
- **THEN** el sistema SHALL truncar a fecha solamente para cálculo de días hábiles

#### Scenario: Consistencia entre frontend y backend

- **WHEN** el frontend envía fechas al backend
- **THEN** ambos SHALL interpretar las fechas en zona horaria Colombia (Bogotá)

### Requirement: Optimizar rendimiento de cálculos

El sistema SHALL calcular días hábiles de manera eficiente para miles de registros.

#### Scenario: Cálculo batch de múltiples registros

- **WHEN** se procesan 10,000 siniestros históricos
- **THEN** el cálculo de días hábiles SHALL completarse en menos de 30 segundos

#### Scenario: Caché de resultados

- **WHEN** se consulta el mismo rango de fechas múltiples veces
- **THEN** el sistema SHALL utilizar caché para evitar recálculos redundantes

#### Scenario: Cálculo incremental

- **WHEN** se agregan nuevos siniestros
- **THEN** el sistema SHALL calcular solo los nuevos registros sin reprocesar todo el histórico

### Requirement: Validar entrada de fechas

El sistema SHALL validar que las fechas de entrada sean válidas antes de calcular.

#### Scenario: Fecha nula o inválida

- **WHEN** se recibe una fecha null o undefined
- **THEN** el sistema SHALL retornar null y no lanzar error

#### Scenario: Fecha de inicio posterior a fecha de fin

- **WHEN** la fecha de inicio es posterior a la fecha de fin
- **THEN** el sistema SHALL retornar valor negativo o null e indicar error de datos

#### Scenario: Formato de fecha inválido

- **WHEN** se recibe una fecha en formato no esperado
- **THEN** el sistema SHALL intentar parsear o retornar null con mensaje de error

### Requirement: Proveer API de cálculo reutilizable

El sistema SHALL exponer una función o servicio reutilizable para cálculo de días hábiles que pueda ser usado por otros módulos.

#### Scenario: Uso desde servicio de KPIs

- **WHEN** el servicio de métricas necesita calcular días hábiles
- **THEN** SHALL importar y usar la función de cálculo sin duplicar código

#### Scenario: Uso desde reportes

- **WHEN** el módulo de reportes necesita calcular días hábiles
- **THEN** SHALL usar la misma función centralizada para consistencia

#### Scenario: Uso desde exportación

- **WHEN** se exportan datos a Excel
- **THEN** los días hábiles calculados en exportación SHALL coincidir con los del dashboard
