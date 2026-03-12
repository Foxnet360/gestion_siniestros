# Design: Fix Frecuencia de Siniestralidad KPI

## Context

The "Frecuencia de Siniestralidad" KPI is currently broken because the backend code queries the database using a column named `fecha_siniestro` which does not exist. The correct column is `fecha_ocurrencia`. Additionally, we need to fix the UI representation of the data.

## Goals / Non-Goals

**Goals:**
- Repair the Frecuencia KPI calculation in `KpiService.ts`.
- Fix the `TimelineChart` to properly display a count without a `%` suffix.
- Correct the month bucket key generation to prevent cross-year collisions.

**Non-Goals:**
- We are not changing the core definition of the frequency formula (e.g. adding the total policies denominator) as that requires data we do not currently have. This fix focuses strictly on making the existing count-based frequency work correctly.

## Decisions

1. **Database Column Swap:**
   - In `KpiService.ts`, replace all instances of `fecha_siniestro` with `fecha_ocurrencia`. This affects date filters and the month grouping logic within `getFrecuenciaSiniestralidad`.

2. **Month Key Generation:**
   - Change the grouping logic to use `YYYY-MM` format as the internal dictionary key. Ensure the frontend still receives the localized short month name (e.g., "ene", "feb") for display purposes by using a mapping of the generated keys to the localized names.

3. **TimelineChart Configuration:**
   - Add a `suffix` boolean or string prop to `TimelineChart`. Default it to `'%'` for backward compatibility with other charts that use it. In `FinancialMetricsSection`, pass an empty string suffix when rendering the Frecuencia chart.

## Risks / Trade-offs

- The fix is localized to the KPI service and the dashboard UI, so risks to other parts of the application are minimal. The only trade-off is that Frecuencia remains a raw count proxy rather than a true percentage frequency.
