## ADDED Requirements

### Requirement: Accurate date display

The system SHALL parse and display dates from Softseguros without timezone conversion errors that cause a 1-day discrepancy.

#### Scenario: Date ingestion from Softseguros

- **WHEN** the system ingests a date from Softseguros (e.g., "13/09/2023")
- **THEN** the stored and displayed date SHALL be "13/09/2023" without subtraction

#### Scenario: UTC to local conversion

- **WHEN** dates are processed through timezone conversion
- **THEN** the system SHALL preserve the original date without crossing day boundaries

### Requirement: Timezone-aware parsing

All date parsing operations SHALL explicitly handle timezone information to prevent automatic UTC offset subtraction.

#### Scenario: Date field processing

- **WHEN** processing fecha_ocurrencia, fecha_aviso, or fecha_notificacion_aseguradora fields
- **THEN** the parser SHALL treat the input as local time (Bogotá/Colombia) without UTC conversion artifacts
