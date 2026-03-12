# Proposal: Mejoras Dashboard y KPIs

## Problem
El dashboard actual presenta varias limitaciones:
1. Solo muestra montos reclamados, omitiendo la cantidad de siniestros.
2. No permite filtrar fácilmente entre siniestros activos y finalizados.
3. El módulo de eficiencia por etapas no carga datos debido a requerimientos de completitud excesivos (Etapa 16).
4. Los filtros de periodos de tiempo no funcionan.
5. Faltan filtros clave (técnico, cliente, ramo, vendedor).
6. La línea de tiempo de SLA está incompleta (falta etapa 1).
7. Falta el rol de 'Vendedor' con permisos restringidos.

## Proposed Changes
### Dashboard y Visualización
- Agregar contador de siniestros abiertos a las KPI cards.
- Implementar toggle/filtro para "Activos" vs "Finalizados".
- Completar la visualización de las 16 etapas en la línea de tiempo.

### Métricas de Eficiencia
- Refactorizar `EficienciaEtapasService` para permitir el cálculo de eficiencia en siniestros que aún no han finalizado (datos parciales).
- Asegurar persistencia de métricas calculadas en Supabase.

### Filtros y Funcionalidad
- Activar el `DateRangePicker` para que afecte correctamente los KPIs.
- Agregar selectores para Técnico, Asegurado, Aseguradora, Ramo y Vendedor en `FilterBar`.

### Roles y Seguridad
- Definir el rol `VENDEDOR` con permisos de solo lectura.
- Asegurar que el rol `ADMIN` pueda gestionar usuarios.

## Scope
- Frontend: `Dashboard.tsx`, `FilterBar.tsx`, `DashboardFilters.tsx`, `SLATrackingSection.tsx`.
- Backend/Services: `EficienciaEtapasService.ts`, `MetricasEtapasService.ts`, `roleUtils.ts`.
- Database: Sin cambios mayores en esquema, solo actualización de datos en `metricas_etapas`.
