# Purpose

TBD - REST API endpoints for calculating and retrieving KPI metrics.

## Requirements

### Requirement: Endpoint GET /api/kpis/overview

El sistema SHALL proporcionar un endpoint REST para obtener un resumen de todos los KPIs principales.

#### Scenario: Respuesta de overview

- **WHEN** se realiza una petición GET a /api/kpis/overview
- **THEN** el sistema SHALL retornar un JSON con los valores de: leadTimeAvg, tasaDesistimiento, tasaObjetados, tasaPrescritos, porcentajeCerradosPlazo, backlogActivos

#### Scenario: Filtros por query parameters

- **WHEN** se incluyen parámetros de filtro en la URL (aseguradora, ramo, fechaDesde, fechaHasta, vendedor)
- **THEN** el sistema SHALL aplicar los filtros y recalcular los KPIs
- **AND** SHALL retornar los valores filtrados

### Requirement: Endpoint GET /api/kpis/lead-time

El sistema SHALL proporcionar un endpoint específico para consultar métricas de ciclo de resolución.

#### Scenario: Lead time promedio

- **WHEN** se realiza una petición GET a /api/kpis/lead-time
- **THEN** el sistema SHALL retornar el tiempo promedio de resolución en días hábiles

#### Scenario: Lead time por percentiles

- **WHEN** se incluye el parámetro ?includePercentiles=true
- **THEN** el sistema SHALL retornar también los percentiles 50, 75, 90 y 95 del lead time

#### Scenario: Lead time por categoría

- **WHEN** se incluye el parámetro ?groupBy=aseguradora (o ramo, vendedor)
- **THEN** el sistema SHALL retornar el lead time promedio agrupado por la categoría solicitada

### Requirement: Endpoint GET /api/kpis/tasas

El sistema SHALL proporcionar un endpoint para consultar las tasas de desistimiento, objeción y prescripción.

#### Scenario: Tasas generales

- **WHEN** se realiza una petición GET a /api/kpis/tasas
- **THEN** el sistema SHALL retornar un objeto con: tasaDesistimiento, tasaObjetados, tasaPrescritos
- **AND** cada tasa SHALL ser un porcentaje (0-100)

#### Scenario: Tasas con conteos absolutos

- **WHEN** se incluye el parámetro ?includeCounts=true
- **THEN** el sistema SHALL incluir también los conteos absolutos (numerador y denominador) de cada tasa

#### Scenario: Tasas históricas mensuales

- **WHEN** se incluye el parámetro ?historico=true
- **THEN** el sistema SHALL retornar un array con las tasas de los últimos 12 meses

### Requirement: Endpoint GET /api/kpis/backlog

El sistema SHALL proporcionar un endpoint para consultar el backlog de siniestros activos.

#### Scenario: Conteo de backlog

- **WHEN** se realiza una petición GET a /api/kpis/backlog
- **THEN** el sistema SHALL retornar el número total de siniestros activos (sin etapa 15 ni 16)

#### Scenario: Backlog por antigüedad

- **WHEN** se incluye el parámetro ?groupByAge=true
- **THEN** el sistema SHALL retornar el backlog agrupado por rangos de antigüedad: 0-30 días, 31-60 días, 61-90 días, 90+ días

#### Scenario: Backlog por etapa actual

- **WHEN** se incluye el parámetro ?groupByStage=true
- **THEN** el sistema SHALL retornar el backlog agrupado por la etapa actual más reciente de cada siniestro

### Requirement: Endpoint GET /api/kpis/frecuencia-siniestralidad

El sistema SHALL proporcionar un endpoint para calcular la frecuencia de siniestralidad por ramo.

#### Scenario: Cálculo de frecuencia

- **WHEN** se realiza una petición GET a /api/kpis/frecuencia-siniestralidad
- **THEN** el sistema SHALL calcular: (N° siniestros reportados por ramo / N° pólizas vigentes) / 365
- **AND** SHALL retornar el resultado por cada ramo

#### Scenario: Requiere datos de pólizas

- **WHEN** se consulta la frecuencia de siniestralidad
- **THEN** el sistema SHALL validar que existan datos de pólizas vigentes
- **AND** SHALL retornar error 400 si no hay datos suficientes

### Requirement: Endpoint GET /api/kpis/retencion-post-siniestro

El sistema SHALL proporcionar un endpoint para calcular la tasa de retención post-siniestro.

#### Scenario: Cálculo de retención

- **WHEN** se realiza una petición GET a /api/kpis/retencion-post-siniestro
- **THEN** el sistema SHALL calcular: (Clientes con siniestro que renovaron / total clientes con siniestro) \* 100

#### Scenario: Requiere datos de renovación

- **WHEN** se consulta la retención
- **THEN** el sistema SHALL validar que existan datos de renovaciones de pólizas
- **AND** SHALL retornar error 400 si no hay datos suficientes

### Requirement: Endpoint GET /api/kpis/severidad

El sistema SHALL proporcionar un endpoint para calcular la severidad por ramo.

#### Scenario: Severidad por ramo

- **WHEN** se realiza una petición GET a /api/kpis/severidad
- **THEN** el sistema SHALL calcular: Costo total de siniestros por amparo afectado / # de siniestros por amparo afectado
- **AND** SHALL retornar la severidad por cada combinación ramo-amparo

### Requirement: Filtros comunes para todos los endpoints

Todos los endpoints de KPIs SHALL soportar los siguientes filtros opcionales como query parameters.

#### Scenario: Filtro por aseguradora

- **WHEN** se incluye ?aseguradora=ID
- **THEN** el sistema SHALL filtrar los datos solo para esa aseguradora

#### Scenario: Filtro por asegurado

- **WHEN** se incluye ?asegurado=ID
- **THEN** el sistema SHALL filtrar los datos solo para ese asegurado

#### Scenario: Filtro por ramo

- **WHEN** se incluye ?ramo=ID
- **THEN** el sistema SHALL filtrar los datos solo para ese ramo

#### Scenario: Filtro por vendedor

- **WHEN** se incluye ?vendedor=ID
- **THEN** el sistema SHALL filtrar los datos solo para ese vendedor

#### Scenario: Filtro por rango de valor indemnizado

- **WHEN** se incluye ?valorMin=1000&valorMax=50000
- **THEN** el sistema SHALL filtrar los datos donde el valor indemnizado esté dentro del rango

#### Scenario: Filtro por fecha de siniestro

- **WHEN** se incluye ?fechaDesde=2024-01-01&fechaHasta=2024-12-31
- **THEN** el sistema SHALL filtrar los datos por el rango de fechas de siniestro especificado

#### Scenario: Filtro por número de siniestro SS

- **WHEN** se incluye ?siniestroSS=NUMERO
- **THEN** el sistema SHALL retornar datos específicos para ese siniestro

#### Scenario: Filtro por número de siniestro compañía

- **WHEN** se incluye ?siniestroCompania=NUMERO
- **THEN** el sistema SHALL retornar datos específicos para ese siniestro

### Requirement: Paginación y límites

Los endpoints que retornan listas SHALL soportar paginación.

#### Scenario: Paginación básica

- **WHEN** se incluyen ?page=2&limit=50
- **THEN** el sistema SHALL retornar la página 2 con 50 resultados por página

#### Scenario: Metadata de paginación

- **WHEN** se retorna una respuesta paginada
- **THEN** el sistema SHALL incluir metadata: total, page, limit, totalPages

### Requirement: Caché de respuestas

El sistema SHALL implementar caché para las respuestas de KPIs que no cambian frecuentemente.

#### Scenario: Respuesta cacheada

- **WHEN** se realiza una consulta idéntica dentro de un período corto
- **THEN** el sistema SHALL retornar la respuesta cacheada
- **AND** SHALL incluir un header indicando que es cache

#### Scenario: Invalidación de caché

- **WHEN** se actualizan los datos subyacentes
- **THEN** el sistema SHALL invalidar el caché relacionado
- **AND** SHALL recalcular en la siguiente petición

### Requirement: Manejo de errores

Los endpoints SHALL manejar errores de forma consistente.

#### Scenario: Error de validación

- **WHEN** se envían parámetros inválidos
- **THEN** el sistema SHALL retornar HTTP 400 con mensaje descriptivo del error

#### Scenario: Error de servidor

- **WHEN** ocurre un error interno
- **THEN** el sistema SHALL retornar HTTP 500
- **AND** SHALL loguear el error para debugging

#### Scenario: Datos no encontrados

- **WHEN** no hay datos para los filtros aplicados
- **THEN** el sistema SHALL retornar HTTP 200 con array vacío o valores null/zero según corresponda
