# Design: Fix Severidad KPI

## Context

The Severidad KPI is meant to calculate the financial severity (average indemnization) of claims by category.
Currently, `KpiService.ts` tries to read `valor_indemnizado` which is undefined, resulting in a metric of 0.
The correct property name based on the data model (`src/types.ts`) is `valor_indemnizacion`.

## Goals / Scope

- Correctly point to `valor_indemnizacion` in the `getSeveridad()` function inside `src/services/KpiService.ts`.
- Ensure there are no other places in `KpiService.ts` affected by the same typo.

## Architecture / Implementation

In `src/services/KpiService.ts`, locate the `getSeveridad()` function.
Modify the loop where the `valor` is extracted:

**From:**
```typescript
const valor = claim.valor_indemnizado || 0;
```

**To:**
```typescript
const valor = claim.valor_indemnizacion || 0;
```

This change is limited to `KpiService.ts` as the GUI components simply render the data they receive.

## Data Model Changes

None. The database and the `Claim` interface in `src/types.ts` already correctly use `valor_indemnizacion`. This bug was purely a mismatch between the read property and the defined schema.

## Risks / Trade-offs

- Minimal risk. The `valor_indemnizacion` property has been verified to be correct across the rest of the application (e.g., `FinancialMetricsSection.tsx`, `mergeService.ts`, etc.).
