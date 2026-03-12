## 1. Core Logic Fixes (KpiService.ts)

- [x] 1.1 Replace all `fecha_siniestro` references with `fecha_ocurrencia` in date filters (`buildFilteredQuery` and `buildClaimsQuery`).
- [x] 1.2 Replace `fecha_siniestro` with `fecha_ocurrencia` inside `getFrecuenciaSiniestralidad`.
- [x] 1.3 Update the month key generation in `getFrecuenciaSiniestralidad` to use `YYYY-MM` format internally to prevent cross-year collisions.

## 2. Dashboard UI Fixes

- [x] 2.1 Add an optional `suffix` prop (default `'%''`) to `TimelineChartProps` in `TimelineChart.tsx`.
- [x] 2.2 Use the `suffix` prop in the `TimelineChart` render instead of the hardcoded `%`.
- [x] 2.3 Pass `suffix=""` to the `TimelineChart` displaying "FRECUENCIA DE SINIESTRALIDAD" in `FinancialMetricsSection.tsx`.
