## ADDED Requirements

### Requirement: Calculate prescription dates on claim creation

The system SHALL automatically calculate both ordinary and extraordinary prescription dates when a claim is created or when `fecha_ocurrencia` is modified.

#### Scenario: Ordinary prescription calculation

- **WHEN** a claim is created with `fecha_ocurrencia` set
- **AND** the `ramo` is NOT in the extraordinary prescription list
- **THEN** the system SHALL calculate `fecha_prescripcion_ordinaria` as `fecha_ocurrencia` + 2 years
- **AND** the system SHALL leave `fecha_prescripcion_extraordinaria` as null

#### Scenario: Extraordinary prescription calculation for RC

- **WHEN** a claim is created with `fecha_ocurrencia` set
- **AND** the `ramo` is "Responsabilidad Civil" (or other configured extraordinary ramos)
- **THEN** the system SHALL calculate `fecha_prescripcion_extraordinaria` as `fecha_ocurrencia` + 5 years
- **AND** the system SHALL also calculate `fecha_prescripcion_ordinaria` as `fecha_ocurrencia` + 2 years for reference

#### Scenario: Recalculation on date change

- **WHEN** `fecha_ocurrencia` is modified on an existing claim
- **THEN** the system SHALL recalculate both prescription dates
- **AND** the system SHALL create a timeline entry noting the date change

### Requirement: Monitor prescription expiration

The system SHALL continuously monitor all non-closed claims and identify those approaching prescription expiration.

#### Scenario: Warning alert generation

- **WHEN** a claim is within 90 days of its prescription date (ordinary or extraordinary, whichever applies)
- **AND** the claim is not in FINALIZADO or PAGADO state
- **THEN** the system SHALL set `alert_level` to "warning"

#### Scenario: Critical alert generation

- **WHEN** a claim is within 30 days of its prescription date
- **AND** the claim is not in FINALIZADO or PAGADO state
- **THEN** the system SHALL set `alert_level` to "critical"

#### Scenario: Clear alert when resolved

- **WHEN** a claim transitions to FINALIZADO or PAGADO state
- **THEN** the system SHALL set `alert_level` to "resolved"
- **AND** the system SHALL clear prescription monitoring for this claim

### Requirement: Prioritize prescription in follow-up calculation

The system SHALL prioritize prescription dates when calculating follow-up dates for claims approaching expiration.

#### Scenario: Prescription-urgent follow-up

- **WHEN** calculating `proximo_seguimiento` for a claim with `alert_level` = "critical"
- **THEN** the system SHALL suggest the next follow-up date as the earlier of: calculated date OR prescription date - 7 days
- **AND** the system SHALL highlight the urgency in the UI
