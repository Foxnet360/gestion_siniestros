# Proposal: Fix % Cerrados en Plazo KPI

## Goal
Estandarizar y corregir el cálculo del KPI "% Cerrados en Plazo (SLA)", asegurando que tanto el Backend como el Frontend utilicen la misma fórmula (basada en días hábiles) y comparen contra el total de siniestros cerrados, no contra el total general de siniestros.

## Why
Actualmente existen graves discrepancias en el cálculo de este indicador:
1. **Backend (`KpiService.ts`)**: Calcula el porcentaje de siniestros cerrados sobre el *total* de siniestros, ignorando por completo si se cerraron dentro del SLA de 45 días.
2. **Frontend (`useKpiOperativos.ts`)**: Sí evalúa que el tiempo sea <= 45 días y divide sobre el total de siniestros cerrados, pero utiliza *días calendario* (restando timestamps directamente) en lugar de *días hábiles*.

Esta inconsistencia genera confusión y métricas erróneas en el Dashboard Gerencial y en los reportes exportados.

## What Changes
1. **Backend (`KpiService.ts`)**: 
   - Modificar las funciones `calculateOverviewFromEtapas` y `calculateOverviewFromClaims` para que `porcentajeCerradosPlazo` mida los siniestros cerrados en `<= 45 días hábiles` sobre el total de siniestros cerrados.
   - Utilizar la utilidad de cálculo de días hábiles existente.
2. **Frontend (`useKpiOperativos.ts`)**: 
   - Modificar la lógica de `cerradosEnPlazo` para que calcular la diferencia entre la fecha de aviso y cierre en *días hábiles* en lugar de días calendario. Se puede aprovechar la función del backend o recrear una versión ligera en el frontend para el cálculo iterativo del dashboard en vivo.

## Capabilities
- `kpi-cerrados-plazo`: Corrección del cálculo del SLA de 45 días hábiles para siniestros cerrados, unificando criterios en Backend y Frontend.

## Impact
No se requieren cambios en el esquema de la base de datos ni modificaciones en los contratos de la API. El principal impacto será en la precisión del KPI visualizado en el Dashboard Gerencial (tarjeta y reportes exportables), reflejando un cumplimiento de SLA más riguroso (solo días hábiles).
