# Tasks: Fix Severidad KPI

## 1. Update KpiService
- [x] 1.1 In `src/services/KpiService.ts:getSeveridad()`, change `claim.valor_indemnizado || 0;` to `claim.valor_indemnizacion || 0;`

## 2. Verification
- [x] 2.1 Verify that the Severidad KPI in the dashboard now renders actual financial values instead of always 0.
- [x] 2.2 Verify that `npm run build` succeeds and there are no TypeScript errors.
