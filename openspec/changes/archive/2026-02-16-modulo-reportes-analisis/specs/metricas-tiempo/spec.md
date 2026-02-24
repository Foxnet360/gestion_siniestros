## ADDED Requirements

### Requirement: Cálculo del tiempo total Aviso→Pago
El sistema DEBE calcular el tiempo promedio total como:
- Tiempo = fecha_finalizacion - fecha_aviso (en días calendario)
- Solo incluir casos donde finalizado = SI

#### Scenario: Cálculo de tiempo promedio general
- **WHEN** se calcula el KPI "Tiempo Promedio Total"
- **THEN** el sistema promedia los días de todos los casos finalizados en el periodo

### Requirement: Desglose por dimensiones
El tiempo promedio DEBE poder visualizarse desglosado por:
- General (todos los casos)
- Por aseguradora
- Por ramo
- Por técnico responsable
- Por rango de fechas

#### Scenario: Usuario visualiza tiempos por aseguradora
- **WHEN** un usuario selecciona "Por Aseguradora" en el filtro de dimensión
- **THEN** el sistema muestra tabla con tiempo promedio por cada aseguradora
- **AND** ordena de mayor a menor tiempo

### Requirement: Cálculo de tiempo por fase del workflow
El sistema DEBE calcular el tiempo promedio que los casos permanecen en cada fase del workflow usando state_history:
- Fase 1: AVISO - SOPORTES - ESTUDIO
- Fase 2: RADICACIÓN - AJUSTE
- Fase 3: LIQUIDACIÓN - OBJECIÓN
- Fase 4: RECONSIDERACIÓN
- Fase 5: RATIFICACIÓN
- Fase 6: JURÍDICO - PRESCRIPCIÓN
- Fase 7: PAGO - FINALIZADO

#### Scenario: Visualización de cuellos de botella
- **WHEN** un usuario accede a la métrica de tiempos por fase
- **THEN** el sistema muestra gráfico de barras con tiempo promedio por fase
- **AND** resalta las fases con mayor tiempo (posibles cuellos de botella)

### Requirement: Benchmarking de tiempos
El sistema DEBE comparar los tiempos actuales contra metas definidas:
- Tiempo objetivo máximo de cierre (configurable, default: 45 días)
- Meta de % de casos cerrados dentro del plazo

#### Scenario: Alerta de desviación de meta
- **WHEN** el tiempo promedio excede la meta definida
- **THEN** el sistema muestra indicador visual de alerta (color rojo/amarillo)

### Requirement: Tendencias temporales
El sistema DEBE mostrar la evolución de los tiempos de gestión a lo largo del tiempo:
- Gráfico de línea: Tiempo promedio mensual (últimos 12 meses)
- Comparación: Mes actual vs mismo mes del año anterior

#### Scenario: Usuario analiza tendencia de tiempos
- **WHEN** un usuario visualiza la métrica de tendencias
- **THEN** el sistema muestra gráfico con evolución histórica de tiempos
