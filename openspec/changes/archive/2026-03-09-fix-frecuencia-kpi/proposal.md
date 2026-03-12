# Proposal: Fix Frecuencia de Siniestralidad KPI

## Motivation

The "Frecuencia de Siniestralidad" KPI currently displays as zero for all months in the dashboard. This is due to a critical bug where the backend service `KpiService` references a database column `fecha_siniestro` which does not exist in the Supabase schema. The correct column for the claim date is `fecha_ocurrencia`. Additionally, there are minor UI and logic issues: the `TimelineChart` enforces a `%` suffix which is inappropriate for a raw count, and the month grouping logic uses abbreviated month names without the year, causing data from different years to collide in the same month bucket.

## What Changes

- Update `KpiService.ts` to replace all references to `fecha_siniestro` with `fecha_ocurrencia` for the Frecuencia KPI and date filters.
- Update `KpiService.ts` to use `YYYY-MM` as the internal key for grouping claims by month to prevent cross-year collisions.
- Update the `TimelineChart` component to accept an optional `suffix` prop (defaulting to `%`).
- Pass `suffix=""` from `FinancialMetricsSection` to the `TimelineChart` displaying the Frecuencia KPI.

## Capabilities

### Existing Capabilities
None of the existing core capabilities are changing. We are fixing a bug in an existing KPI calculation.

## Impact

- **Affected Code**: `src/services/KpiService.ts`, `src/components/Dashboard/charts/TimelineChart.tsx`, `src/components/Dashboard/sections/FinancialMetricsSection.tsx`.
- **APIs**: The data returned by `getFrecuenciaSiniestralidad` will now correctly reflect real data instead of zeros.
- **Systems**: The KPI dashboard will now correctly visualize the Frecuencia KPI.
