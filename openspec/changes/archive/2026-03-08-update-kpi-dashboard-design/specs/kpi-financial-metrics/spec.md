## ADDED Requirements

### Requirement: Claim Frequency by Branch

The system SHALL display claim frequency (Frecuencia de Siniestralidad) broken down by insurance branch over the last 12 months.

#### Scenario: Display frequency trend chart

- **WHEN** the user accesses the technical and financial management section
- **THEN** the system SHALL display a line chart showing claim frequency trends month by month
- **AND** SHALL show the current value (e.g., "15%") prominently
- **AND** SHALL include months from Jan to Dec on the X-axis

#### Scenario: Frequency data calculation

- **WHEN** data is loaded
- **THEN** the system SHALL calculate frequency as: (COUNT of claims in period / Total policies in period) \* 100
- **AND** SHALL display "DESGLOSO ARS ÚLTIMO AÑO ÚLTIMOS 3 MESES" as context

#### Scenario: Historical data warning

- **WHEN** insufficient historical data exists
- **THEN** the system SHALL display "GENERAR DATOS HISTÓRICOS ÚLTIMOS 3 MESES" with warning icon

### Requirement: Severity by Branch

The system SHALL display claim severity (Severidad por Ramo) with monetary values broken down by insurance type.

#### Scenario: Display severity bar chart

- **WHEN** the user views the financial management section
- **THEN** the system SHALL display a grouped bar chart showing severity by branch
- **AND** SHALL show monetary values on the Y-axis (COP)
- **AND** SHALL display different colors for each branch category

#### Scenario: Branch categories display

- **WHEN** the chart renders
- **THEN** the system SHALL display the following branches: Automóvil, Empresas, Automas, Empresas, Espacias, Empresas
- **AND** SHALL show corresponding values (e.g., $ 15.000.000, $ 22.000.000, $ 10.000.000, etc.)

#### Scenario: Branch selector note

- **WHEN** viewing the severity chart
- **THEN** the system SHALL display "CREAR LISTA DESPLEGABLE POR AMPARO (EXTRAER DE TIPO DE SINIESTRO SS)" as a pending action

### Requirement: Monetary Value Formatting

The system SHALL format all monetary values consistently across financial KPIs.

#### Scenario: COP formatting

- **WHEN** displaying monetary values
- **THEN** the system SHALL format values in Colombian Peso currency (COP)
- **AND** SHALL use punto (.) as thousand separator and comma (,) as decimal separator (e.g., $ 15.000.000,00)

### Requirement: Comparative Period Analysis

The system SHALL provide comparative analysis between current and previous periods for financial metrics.

#### Scenario: Period comparison

- **WHEN** viewing financial KPIs
- **THEN** the system SHALL display percentage change indicators comparing current month vs previous month
- **AND** SHALL use green arrows for improvement, red for decline
