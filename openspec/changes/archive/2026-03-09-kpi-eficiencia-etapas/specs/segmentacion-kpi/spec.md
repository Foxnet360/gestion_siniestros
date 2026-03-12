## ADDED Requirements

### Requirement: Filtrar métricas por aseguradora

El sistema SHALL permitir filtrar todas las métricas de eficiencia por aseguradora específica, mostrando KPIs personalizados para cada compañía aseguradora.

#### Scenario: Filtrado por aseguradora específica

- **WHEN** el usuario selecciona una aseguradora del dropdown
- **THEN** el sistema SHALL recalcular y mostrar todos los KPIs (tiempos, funnel, cuellos de botella) solo para siniestros de esa aseguradora

#### Scenario: Comparación entre aseguradoras

- **WHEN** el usuario selecciona "Comparar aseguradoras"
- **THEN** el sistema SHALL mostrar una tabla comparativa con Lead Time promedio, tasa de cumplimiento SLA, y cantidad de siniestros por aseguradora

#### Scenario: Ranking de aseguradoras por eficiencia

- **WHEN** el usuario solicita el ranking
- **THEN** el sistema SHALL ordenar las aseguradoras por Lead Time promedio (menor a mayor) y mostrar top 5 mejores y peores

### Requirement: Filtrar métricas por ramo

El sistema SHALL permitir filtrar métricas por ramo de seguro (SOAT, Vehículo, Hogar, etc.) para identificar diferencias de eficiencia entre tipos de producto.

#### Scenario: Filtrado por ramo específico

- **WHEN** el usuario selecciona un ramo del filtro
- **THEN** el sistema SHALL mostrar todos los KPIs filtrados para ese ramo específico

#### Scenario: Comparación de eficiencia entre ramos

- **WHEN** el usuario selecciona "Comparar ramos"
- **THEN** el sistema SHALL mostrar un gráfico comparativo de Lead Time promedio por ramo

#### Scenario: Identificación de ramos problemáticos

- **WHEN** un ramo tiene un Lead Time promedio superior al general en más del 50%
- **THEN** el sistema SHALL marcar ese ramo como "requiere atención" y mostrarlo destacado

### Requirement: Filtrar métricas por técnico asignado

El sistema SHALL permitir filtrar métricas por técnico asignado para evaluación de performance individual.

#### Scenario: Dashboard por técnico

- **WHEN** el usuario selecciona un técnico específico
- **THEN** el sistema SHALL mostrar KPIs personales: cantidad de siniestros gestionados, Lead Time promedio, etapas donde más tiempo pasan sus casos

#### Scenario: Ranking de técnicos

- **WHEN** el supervisor solicita "Ver ranking de técnicos"
- **THEN** el sistema SHALL mostrar una tabla ordenada por eficiencia (Lead Time promedio, cumplimiento SLA) con cada técnico

#### Scenario: Comparación técnico vs promedio del equipo

- **WHEN** se visualiza el dashboard de un técnico
- **THEN** el sistema SHALL mostrar la comparación contra el promedio del equipo (ej: "15% más rápido que el promedio")

#### Scenario: Identificación de técnicos con casos críticos

- **WHEN** un técnico tiene más de 5 siniestros con Lead Time > 60 días
- **THEN** el sistema SHALL mostrar una alerta y listar los casos críticos

### Requirement: Filtrar por rango de valor del siniestro

El sistema SHALL permitir filtrar métricas por rango de valor del siniestro (monto reclamado) para identificar si la complejidad financiera afecta la eficiencia.

#### Scenario: Filtrado por rango de valor

- **WHEN** el usuario selecciona un rango (ej: "$0 - $5M", "$5M - $20M", ">$20M")
- **THEN** el sistema SHALL mostrar KPIs específicos para siniestros en ese rango de valor

#### Scenario: Análisis de correlación valor vs tiempo

- **WHEN** el usuario selecciona "Análisis por valor"
- **THEN** el sistema SHALL mostrar un gráfico de dispersión o boxplot de Lead Time vs valor del siniestro

#### Scenario: Identificación de rangos problemáticos

- **WHEN** siniestros de alto valor (>$20M) tienen Lead Time significativamente mayor
- **THEN** el sistema SHALL sugerir revisar procesos para siniestros complejos

### Requirement: Filtrar por tipo de proceso

El sistema SHALL permitir filtrar explícitamente por tipo de proceso (Normal, Prescripción Ordinaria, Prescripción Extraordinaria) para análisis específicos.

#### Scenario: Dashboard exclusivo para procesos normales

- **WHEN** el usuario selecciona filtro "Procesos Normales"
- **THEN** el sistema SHALL excluir prescripciones y mostrar KPIs solo para siniestros normales (30-90 días típicos)

#### Scenario: Análisis de prescripciones

- **WHEN** el usuario selecciona filtro "Prescripciones"
- **THEN** el sistema SHALL mostrar métricas específicas: tiempo en etapa 13, frecuencia de seguimientos durante prescripción, tasa de éxito

#### Scenario: Comparación entre tipos de proceso

- **WHEN** el usuario selecciona "Comparar tipos de proceso"
- **THEN** el sistema SHALL mostrar métricas lado a lado para comparar eficiencia, cuellos de botella, y tasas de conversión

### Requirement: Combinar múltiples filtros

El sistema SHALL permitir aplicar múltiples filtros simultáneamente para análisis granular.

#### Scenario: Filtros combinados

- **WHEN** el usuario selecciona aseguradora "Seguros ABC" + ramo "SOAT" + técnico "Juan Pérez"
- **THEN** el sistema SHALL mostrar KPIs que cumplan TODOS los criterios simultáneamente

#### Scenario: Contador de resultados filtrados

- **WHEN** se aplican filtros
- **THEN** el sistema SHALL mostrar "Mostrando X siniestros de Y totales (Z%)" para indicar el alcance del filtro

#### Scenario: Guardar configuración de filtros

- **WHEN** el usuario frecuentemente usa la misma combinación de filtros
- **THEN** el sistema SHALL permitir guardar la configuración como "Vista personalizada" para acceso rápido futuro

### Requirement: Exportar datos segmentados

El sistema SHALL permitir exportar datos filtrados por cualquier segmentación.

#### Scenario: Exportar reporte por aseguradora

- **WHEN** el usuario está viendo métricas filtradas por aseguradora y hace clic en "Exportar"
- **THEN** el sistema SHALL generar un reporte CSV/Excel con los datos filtrados incluyendo el nombre de la aseguradora en el nombre del archivo

#### Scenario: Exportar comparativo multi-segmento

- **WHEN** el usuario está viendo comparación entre múltiples segmentos (ej: varias aseguradoras)
- **THEN** el sistema SHALL exportar una tabla comparativa con todos los segmentos en columnas separadas
