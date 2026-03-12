## ADDED Requirements

### Requirement: Detect legal process stagnation

The system SHALL detect when claims in PROCESO JURÍDICO state have been stagnant for extended periods.

#### Scenario: 24-month stagnation warning

- **WHEN** a claim is in PROCESO JURÍDICO state
- **AND** the claim has been in this state for 24 months (2 years) without state change
- **THEN** the system SHALL set `alert_level` to "legal_stagnation_warning"
- **AND** the system SHALL create a timeline entry noting the stagnation
- **AND** the system SHALL notify the assigned technician and their supervisor

#### Scenario: 5-year stagnation auto-close

- **WHEN** a claim is in PROCESO JURÍDICO state
- **AND** the claim has been in this state for 5 years without state change
- **AND** the claim has not been modified in the last 5 years
- **THEN** the system SHALL automatically transition the claim to "PRESCRIPCIÓN" state with subtype "ESTANCAMIENTO JURÍDICO"
- **AND** the system SHALL set `finalizado` to true
- **AND** the system SHALL set `fecha_finalizacion` to current date
- **AND** the system SHALL create a timeline entry with author "Sistema"

### Requirement: Calculate legal stagnation periods

The system SHALL accurately calculate the time a claim has spent in PROCESO JURÍDICO state.

#### Scenario: Calculate stagnation duration

- **WHEN** evaluating a claim for legal stagnation
- **THEN** the system SHALL calculate the duration as: current_date - lastStateChangeDate
- **AND** the system SHALL consider only time in PROCESO JURÍDICO state
- **AND** if the claim transitioned out and back into PROCESO JURÍDICO, the system SHALL calculate cumulative time across all periods in this state

#### Scenario: Stagnation with recent activity

- **WHEN** a claim is in PROCESO JURÍDICO state
- **AND** the claim has been in this state for 5 years
- **BUT** the claim has been updated within the last 6 months (timeline entry, note, etc.)
- **THEN** the system SHALL NOT auto-close the claim
- **AND** the system SHALL reset the stagnation warning
- **AND** the system SHALL log the recent activity as evidence of non-stagnation

### Requirement: Differentiate legal stagnation from prescription

The system SHALL distinguish between closure due to legal stagnation and closure due to prescription expiration.

#### Scenario: Stagnation closure audit entry

- **WHEN** a claim is automatically closed due to legal stagnation
- **THEN** the system SHALL create a timeline entry with:
  - Author: "Sistema"
  - Text: "Cierre automático por estancamiento jurídico. Tiempo en proceso: [X] años. Última actividad registrada: [date]."
- **AND** the system SHALL set a specific flag or metadata indicating "closure_type" = "LEGAL_STAGNATION"
- **AND** the system SHALL include this in reports separately from prescription closures

### Requirement: Alert on approaching stagnation

The system SHALL provide advance warning before legal stagnation auto-close occurs.

#### Scenario: 6-month stagnation warning

- **WHEN** a claim is in PROCESO JURÍDICO state
- **AND** the claim has been in this state for 54 months (4.5 years)
- **THEN** the system SHALL set `alert_level` to "legal_stagnation_critical"
- **AND** the system SHALL send urgent notifications to GERENTE role
- **AND** the system SHALL suggest reviewing the case for potential resolution before auto-close
