# Tasks: Mejoras Dashboard y KPIs

## Setup & Types
- [ ] Agregar `VENDEDOR` al enum `Role` en `src/types.ts`
- [ ] Configurar permisos y colores para `VENDEDOR` en `src/utils/roleUtils.ts`
- [ ] Extender `FilterState` y `DashboardFilters` para nuevos campos (`tecnico`, `vendedor`, `showFinished`)

## Dashboard Enhancements
- [ ] Modificar `KpiCard.tsx` para mostrar contador además de monto
- [ ] Actualizar `Dashboard.tsx` para pasar las métricas de cantidad a las tarjetas correspondientes
- [ ] Implementar el toggle "Siniestros Finalizados" en `FilterBar.tsx`

## Efficiency Module
- [ ] Refactorizar `EficienciaEtapasService.ts` para incluir registros incompletos en el cálculo de promedios por etapa
- [ ] Actualizar `useEficienciaEtapas.ts` para asegurar que el refetch funcione con los nuevos parámetros

## Timeline & Filters
- [ ] Ajustar `TimelineSLA.tsx` para mostrar las 16 etapas e incluir la etapa 1 (Aviso)
- [ ] Reparar la reactividad de los filtros de fecha en `DashboardFilters.tsx` para que afecten a `useKPIs`
- [ ] Agregar dropdowns de Técnico y Vendedor en `FilterBar.tsx` y sincronizar con `ClaimsContext`

## Verification
- [ ] Verificar acceso restringido con un usuario de rol `VENDEDOR`
- [ ] Validar que la métrica de eficiencia cargue datos reales de la base de datos
