# Specs: Mejoras Dashboard y KPIs

## User Stories
1. **Visualización de Cantidades**: Como usuario, quiero ver el número total de siniestros abiertos en el dashboard para tener una idea rápida del volumen de trabajo.
2. **Filtro de Estado**: Como usuario, quiero filtrar siniestros por "Activos" o "Finalizados" para enfocarme en los casos que requieren atención inmediata.
3. **Métricas de Eficiencia**: Como usuario de negocio, quiero que el módulo de eficiencia muestre datos incluso si los siniestros no han sido pagados aún, para medir el rendimiento de las etapas tempranas.
4. **Filtros Avanzados**: Como técnico, quiero filtrar por cliente, aseguradora o vendedor para organizar mejor mi carga de trabajo.
5. **Permisos de Vendedor**: Como vendedor, quiero acceder al sistema pero solo para consultar información de mis clientes, sin poder modificar datos críticos.

## Functional Requirements
- **Dashboard Metrics**: Actualizar `KpiCard` para recibir un valor opcional de `count`.
- **Global Filters**: 
  - Extender `FilterState` para incluir `tecnico`, `asegurado`, `vendedor`.
  - Agregar `showFinished: boolean`.
- **Efficiency Engine**: Ajustar `EficienciaEtapasService` para procesar registros con `datos_completos = false` si tienen fechas de inicio/fin para etapas específicas.
- **SLA Timeline**: Asegurar que el array de etapas enviado a `TimelineSLA` contenga siempre las 16 etapas, marcando como 'pendiente' las que no tienen fecha.

## Technical Requirements
- **Roles**: Agregar `'VENDEDOR'` al type `Role` y configurar su paleta de colores en `roleUtils.ts`.
- **Supabase**: Las consultas deben optimizarse para filtrar por el nuevo estado `finalizado`.
- **Date Filters**: Sincronizar el estado del `DateRangePicker` del Dashboard con las consultas de `useKPIs`.
