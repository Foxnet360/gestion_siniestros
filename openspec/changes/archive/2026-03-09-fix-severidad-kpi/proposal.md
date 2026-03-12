# Proposal: Fix Severidad KPI

## Why

The "Severidad por Ramo" KPI is currently displaying 0 for all categories because the backend service is trying to read a property named `valor_indemnizado` from the database. However, according to the `src/types.ts` definition and the way other services interact with the database, the correct column name is `valor_indemnizacion`. This bug prevents users from seeing the financial severity of claims.

## What Changes

Update the property name used in the `KpiService.ts` to calculate the financial severity.
Change `claim.valor_indemnizado` to `claim.valor_indemnizacion`.

## Capabilities

- `kpi-severidad`: Fix the financial severity KPI calculation.

## Impact

- `src/services/KpiService.ts`: The `getSeveridad` function needs to be updated.
- `Dashboard`: The UI will now correctly display the financial severity by category instead of 0.
