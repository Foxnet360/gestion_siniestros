# Spec: Severidad KPI

## Purpose

The "Severidad por Ramo" KPI should accurately calculate the financial severity of claims, which is the average indemnization amount per claim, grouped by the insurance category (ramo).

## Requirements

### Requirement: Calculate financial severity

- **GIVEN** a set of filtered claims
- **WHEN** the `getSeveridad` metrics are requested
- **THEN** it should correctly aggregate the `valor_indemnizacion` property from each claim
- **AND** calculate the average for each `ramo` group.
- **AND** it should correctly handle claims where the indemnization value is missing (defaulting to 0).
