## ADDED Requirements

### Requirement: Automatically close claims on prescription expiration

The system SHALL automatically close claims when they reach their prescription date, with appropriate logging.

#### Scenario: Ordinary prescription auto-close

- **WHEN** the current date equals or exceeds `fecha_prescripcion_ordinaria`
- **AND** the claim is not in FINALIZADO, PAGADO, or already closed state
- **AND** the claim's ramo is NOT in the extraordinary prescription list
- **THEN** the system SHALL automatically transition the claim to "PRESCRIPCIÓN" state
- **AND** the system SHALL set `finalizado` to true
- **AND** the system SHALL set `fecha_finalizacion` to current date
- **AND** the system SHALL create a timeline entry with author "Sistema"

#### Scenario: Extraordinary prescription auto-close

- **WHEN** the current date equals or exceeds `fecha_prescripcion_extraordinaria`
- **AND** the claim is not in FINALIZADO, PAGADO, or already closed state
- **AND** the claim's ramo IS in the extraordinary prescription list (e.g., "Responsabilidad Civil")
- **THEN** the system SHALL automatically transition the claim to "PRESCRIPCIÓN" state
- **AND** the system SHALL set `finalizado` to true
- **AND** the system SHALL set `fecha_finalizacion` to current date
- **AND** the system SHALL create a timeline entry noting the extraordinary prescription

### Requirement: Create system audit trail for auto-closures

The system SHALL create detailed audit entries when automatically closing claims.

#### Scenario: Prescription closure audit entry

- **WHEN** a claim is automatically closed due to prescription
- **THEN** the system SHALL create a timeline entry with format:
  - Author: "Sistema"
  - Date: Current date
  - Text: "Cierre automático por prescripción [ordinaria/extraordinaria] alcanzada. Fecha de ocurrencia: [date]. Prescripción calculada: [date]."
- **AND** the system SHALL create an entry in `audit_logs` with:
  - Action: "AUTO_CLOSE_PRESCRIPTION"
  - Entity: claim ID
  - Details: prescription type, dates, previous state

### Requirement: Exclude high-priority claims from auto-close

The system SHALL require manual approval for closing high-value or high-priority claims.

#### Scenario: High-value claim requires approval

- **WHEN** a claim meets prescription expiration criteria
- **AND** the claim's `monto_reclamo` exceeds the configured threshold (e.g., $50,000,000)
- **OR** the claim's `prioridad` is "Alta"
- **THEN** the system SHALL NOT auto-close the claim
- **AND** the system SHALL transition the claim to "CIERRE PENDIENTE APROBACIÓN" state
- **AND** the system SHALL send urgent notification to GERENTE and ADMIN roles
- **AND** the system SHALL require manual approval before final closing

### Requirement: Process closures daily

The system SHALL process all pending prescription closures on a daily schedule.

#### Scenario: Daily closure job execution

- **WHEN** the daily closure job runs (scheduled for 2:00 AM)
- **THEN** the system SHALL query all non-closed claims with expired prescription dates
- **AND** the system SHALL process each claim according to auto-close rules
- **AND** the system SHALL generate a report of closures performed
- **AND** the system SHALL log any errors encountered during processing
