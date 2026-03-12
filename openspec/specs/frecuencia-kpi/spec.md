# Specification: Frecuencia KPI

## Purpose
TBD: Definition of the Frecuencia de Siniestralidad system and business rules.

## Requirements

### Requirement: Frecuencia de Siniestralidad Calculation
The Frecuencia de Siniestralidad KPI must calculate the count of claims per month based on the actual occurrence date of the claim, not an arbitrary non-existent field.

#### Scenario: Aggregating claims by month
- **GIVEN** a list of claims with valid `fecha_ocurrencia` dates
- **WHEN** the `getFrecuenciaSiniestralidad` method is called
- **THEN** the claims are grouped into the correct `YYYY-MM` bucket, preventing collisions between identical months in different years.

#### Scenario: Fetching within date filters
- **GIVEN** date filters (fechaDesde, fechaHasta)
- **WHEN** the KPI service builds the query
- **THEN** the filter is applied against the `fecha_ocurrencia` column.

### Requirement: Frecuencia KPI Chart Rendering
The frequency chart must display the raw count of claims for the current month, without converting it or labelling it as a percentage.

#### Scenario: Displaying the chart in the dashboard
- **GIVEN** the frequency data from the backend
- **WHEN** the FinancialMetricsSection renders the TimelineChart
- **THEN** it displays the raw count with no `%` suffix.
