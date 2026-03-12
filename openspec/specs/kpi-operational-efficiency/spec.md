# Purpose

Display operational efficiency KPIs for claims management including lead time, withdrawal rate, objection rate, and prescription rate with real-time visualizations.

## Requirements

### Requirement: Lead Time Visualization

The system SHALL display the average resolution cycle time (Lead Time) from claim notification to closure in a gauge chart format.

#### Scenario: Display lead time gauge

- **WHEN** the user accesses the operational efficiency section
- **THEN** the system SHALL display a gauge chart showing the average lead time in business days
- **AND** SHALL color-code based on target (<30 days = green, >=30 days = yellow/red)
- **AND** SHALL display the target value (Meta: <30 días hábiles)

#### Scenario: Lead time trend line

- **WHEN** the dashboard loads
- **THEN** the system SHALL display a line chart showing lead time trends over the last 12 months
- **AND** SHALL highlight the current month's value

### Requirement: Withdrawal Rate Display

The system SHALL display the withdrawal rate (Tasa de Desistimiento) as a percentage in a donut chart format.

#### Scenario: Display withdrawal rate

- **WHEN** the user views the operational efficiency section
- **THEN** the system SHALL display a donut chart showing the withdrawal rate percentage
- **AND** SHALL color-code based on target (<10% = good, >=10% = warning)
- **AND** SHALL display the trend indicator (up/down arrow)

#### Scenario: Withdrawal rate calculation

- **WHEN** data is loaded
- **THEN** the system SHALL calculate: (COUNT of claims with withdrawal observation / COUNT total claims in period) \* 100

### Requirement: Objection Rate Display

The system SHALL display the objection rate (Tasa de Objetados) as a percentage.

#### Scenario: Display objection rate

- **WHEN** the user views the operational efficiency section
- **THEN** the system SHALL display the objection rate in a circular indicator
- **AND** SHALL show "PENDIENTE PARA DATOS HISTÓRICOS" if data is insufficient

#### Scenario: Objection rate calculation

- **WHEN** data is loaded
- **THEN** the system SHALL calculate: (COUNT of claims with objection observation / COUNT total claims in period) \* 100

### Requirement: Prescription Rate Display

The system SHALL display the prescription rate (Tasa de Prescritos) as a percentage with bar chart visualization.

#### Scenario: Display prescription rate

- **WHEN** the user views the operational efficiency section
- **THEN** the system SHALL display a bar chart showing prescription rate over time
- **AND** SHALL highlight the current value

#### Scenario: Prescription rate calculation

- **WHEN** data is loaded
- **THEN** the system SHALL calculate: (COUNT of claims with prescription observation / COUNT total claims in period) \* 100

### Requirement: Real-time Data Updates

The system SHALL update all operational efficiency KPIs in real-time when underlying data changes.

#### Scenario: Auto-refresh on data change

- **WHEN** a claim status is updated in the system
- **THEN** the system SHALL recalculate all affected KPIs within 5 seconds
- **AND** SHALL animate the chart transitions to reflect changes
