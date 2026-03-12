# Design: Mejoras Dashboard y KPIs

## UI Architecture
### Dashboard Key Cards
- **Component**: `KpiCard`
- **Change**: Agregar un prop `secondaryValue` (number) para mostrar la cantidad de casos debajo del monto en pesos.
- **Style**: Texto pequeño en `slate-400` para el contador.

### Filter Navigation
- **Component**: `FilterBar`
- **Addition**: 
  - Toggle de "Siniestros Finalizados".
  - MultiSelect dropdowns para "Técnico" y "Vendedor".
- **Integration**: Los filtros se conectan al `ClaimsContext` para filtrado local en la tabla y a `useFilters` para regenerar opciones.

## Service Architecture
### Efficiency Calculation
- **Service**: `EficienciaEtapasService`
- **Modification**: En `getEficienciaEtapas`, cambiar la lógica de filtrado inicial. En lugar de solo traer `datos_completos = true`, traer todos los registros de `metricas_etapas` y filtrar por completitud a nivel de etapa individual para el cálculo de promedios.
- **Bottleneck detection**: Seguirá basándose en etapas con tiempos registrados mayores al SLA.

### SLA Visualizer
- **Component**: `TimelineSLA`
- **Modification**: El array `stages` ahora se construirá dinámicamente mapeando las 16 constantes de estado internas. Si un siniestro no tiene fecha para una etapa, se marcará como `estado: 'en_progreso'` o `'pendiente'`.

## Data Model Updates
- **Type `Role`**:
  ```typescript
  export type Role = 'ADMIN' | 'GERENTE' | 'TECNICO' | 'ALIADO' | 'VENDEDOR';
  ```
- **Permission Mapping**:
  ```typescript
  VENDEDOR: ['view:assigned-claims', 'view:dashboard']
  ```

## API / Database Interaction
- **Query Filter**: `supabase.from('claims').select('*').eq('finalizado', showFinished)`
- **Cache**: El cache de `EficienciaEtapasService` debe ser invalidado cuando cambian los filtros de fecha del dashboard.
