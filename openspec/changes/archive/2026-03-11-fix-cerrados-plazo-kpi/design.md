# Design: Fix % Cerrados en Plazo KPI

## Overview
This document outlines the technical approach for fixing the "% Cerrados en Plazo (SLA)" KPI in both the backend (`KpiService.ts`) and the frontend (`useKpiOperativos.ts`). The goal is to unify the logic to use business days (días hábiles) and to calculate the percentage specifically against the total number of *closed* claims, rather than all active and closed claims.

## Context
During an audit of the KPIs, severe discrepancies were discovered in how the SLA compliance is calculated:
- The backend simply calculates `Finalized Claims / Total Claims`, which doesn't check the 45-day SLA at all.
- The frontend correctly checks `Finalized Claims <= 45 days / Total Finalized Claims`, but it computes the 45 days using natural calendar days instead of Colombian business days.

## Technical Approach

### 1. Backend (`src/services/KpiService.ts`)
The `porcentajeCerradosPlazo` metric in `calculateOverviewFromEtapas` and `calculateOverviewFromClaims` needs to be updated.
- We need to correctly identify "Cerrados" (closed) claims.
- For each closed claim, we need to calculate the elapsed time in business days from `fecha_aviso` to `fecha_finalizacion` (or equivalent closed date).
- We'll use the existing `calculateBusinessDays` method in `KpiService.ts` to determine the difference.
- The new formula will be: `(Count of Closed Claims with <= 45 business days) / (Total Count of Closed Claims) * 100`.
- We'll use the `TIEMPO_OBJETIVO_CIERRE` constant from `src/constants/reports.ts` (currently 45 days).

### 2. Frontend (`src/hooks/reports/useKpiOperativos.ts`)
The frontend computes KPI metrics on the fly for the `DashboardGerencial`.
- Currently, it relies on a raw `getTime()` difference.
- Since `KpiService.ts` contains the robust `calculateBusinessDays` logic (which skips weekends and Colombian holidays), we should extract this business day calculation logic so the frontend can use it, OR we replicate a simplified business day logic in the frontend hook.
- Given that the frontend app is a Vite React SPA, it's feasible to create a shared utility function for `calculateBusinessDays` (e.g., in `src/utils/dateUtils.ts`) that both the backend services and frontend hooks can consume.
- In `useKpiOperativos.ts`, we'll replace the line `const dias = Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));` with a call to the new shared `calculateBusinessDays` utility.

### 3. Shared Utility (`src/utils/dateUtils.ts`)
- Extract `calculateBusinessDays` from `KpiService.ts` to `src/utils/dateUtils.ts`.
- Ensure it handles weekends correctly. 
- Ensure it handles the list of `FERIADOS_COLOMBIA` (which might also need to be extracted to a shared constants file).
- Update both `KpiService.ts` and `useKpiOperativos.ts` to import and use this shared utility. 
- *Note:* In a previous OpenSpec (`kpi-eficiencia-etapas`), a robust business day calculation was implemented. We should reuse that logic if it's already centralized, or centralize it now so both Kpis can use it.

## Database Changes
None required.

## API Changes
None required. The shape of the response from the KPIs API remains exactly the same (returning a `porcentajeCerradosPlazo` number).

## Test Plan
- Verify that `porcentajeCerradosPlazo` on the dashboard matches the expected percentage using manual calculations of business days on a known dataset.
- Confirm that claims closed on weekends or spanning holidays do not artificially inflate the duration penalty.
- Ensure the backend overview API returns the exact same percentage as the frontend calculation when no filters are applied.
