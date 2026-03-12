## ADDED Requirements

### Requirement: Insurance Company Filter

The system SHALL provide a dropdown filter for selecting insurance companies (Aseguradora).

#### Scenario: Display insurer filter

- **WHEN** the user views the dashboard
- **THEN** the system SHALL display a dropdown labeled "ASEGURADORA"
- **AND** SHALL list all available insurance companies
- **AND** SHALL include an "All" or "Todas" option

#### Scenario: Apply insurer filter

- **WHEN** the user selects an insurer from the dropdown
- **THEN** the system SHALL filter all dashboard data to show only claims from that insurer
- **AND** SHALL recalculate all KPIs based on filtered data
- **AND** SHALL update all visualizations within 1 second

### Requirement: Branch/Ramo Filter

The system SHALL provide a dropdown filter for selecting insurance branches (Ramo).

#### Scenario: Display branch filter

- **WHEN** the user views the dashboard
- **THEN** the system SHALL display a dropdown labeled "RAMO"
- **AND** SHALL list all available branches: Automóvil, Empresas, Automas, Espacias, etc.
- **AND** SHALL include a multi-select option for selecting multiple branches

#### Scenario: Apply branch filter

- **WHEN** the user selects one or more branches
- **THEN** the system SHALL filter KPIs to show only data for selected branches
- **AND** SHALL update the severity by branch chart to highlight selected branches

### Requirement: Vendor/Vendedor Filter

The system SHALL provide a dropdown filter for selecting vendors (Vendedor).

#### Scenario: Display vendor filter

- **WHEN** the user views the dashboard
- **THEN** the system SHALL display a dropdown labeled "VENDEDOR"
- **AND** SHALL list all available vendors/agents
- **AND** SHALL show vendor names (not just IDs)

#### Scenario: Apply vendor filter

- **WHEN** the user selects a vendor
- **THEN** the system SHALL filter all claims handled by that vendor
- **AND** SHALL update operational efficiency KPIs to reflect vendor performance

### Requirement: Date Range Filter

The system SHALL provide a date range picker for filtering claims by date.

#### Scenario: Display date filter

- **WHEN** the user views the dashboard
- **THEN** the system SHALL display a date picker labeled "FECHA"
- **AND** SHALL allow selection of predefined ranges: Last 7 days, Last 30 days, Last 3 months, Last 12 months, Custom

#### Scenario: Apply date range filter

- **WHEN** the user selects a date range
- **THEN** the system SHALL filter all claims within that date range
- **AND** SHALL recalculate all time-based KPIs (lead time, trends, etc.)
- **AND** SHALL update trend charts to show data points within the selected range

#### Scenario: Quick date presets

- **WHEN** the user clicks on date filter
- **THEN** the system SHALL display quick preset buttons: "Último mes", "Últimos 3 meses", "Último año", "Todo"

### Requirement: Filter Combination

The system SHALL support combining multiple filters simultaneously.

#### Scenario: Apply combined filters

- **WHEN** the user selects multiple filters (e.g., Insurer + Branch + Date)
- **THEN** the system SHALL apply all filters with AND logic
- **AND** SHALL display active filter indicators/tags
- **AND** SHALL show a "Clear all filters" option

#### Scenario: Filter persistence

- **WHEN** the user applies filters
- **THEN** the system SHALL persist filter selections during the session
- **AND** SHALL restore filters on page refresh (via URL params or localStorage)

### Requirement: Generate Report Button

The system SHALL provide a button to generate reports based on current filter selections.

#### Scenario: Display generate report button

- **WHEN** the user views the dashboard
- **THEN** the system SHALL display a prominent "GENERAR REPORTE" button
- **AND** SHALL style it with primary action colors (blue/teal)

#### Scenario: Generate filtered report

- **WHEN** the user clicks "GENERAR REPORTE"
- **THEN** the system SHALL generate a report using current filter selections
- **AND** SHALL download or open the report in a new view
- **AND** SHALL include all KPIs and visualizations from the current filtered view
