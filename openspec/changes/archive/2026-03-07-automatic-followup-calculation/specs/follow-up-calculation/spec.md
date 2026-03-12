## ADDED Requirements

### Requirement: Calculate next follow-up date based on workflow state

The system SHALL automatically calculate the `proximo_seguimiento` field whenever a claim's `estado_interno` changes or when a tracking update is saved.

#### Scenario: Standard phase follow-up (Fases 1-5)

- **WHEN** a claim transitions to any state in Fases 1-5 (AVISO SINIESTRO through RATIFICACIÓN OBJECIÓN)
- **THEN** the system SHALL set `proximo_seguimiento` to 10 days from the current date

#### Scenario: Legal process follow-up

- **WHEN** a claim transitions to PROCESO JURÍDICO state
- **THEN** the system SHALL set `proximo_seguimiento` to 30 days from the current date by default
- **AND** the technician SHALL be able to manually adjust this to up to 60 days

#### Scenario: Prescription monitoring follow-up

- **WHEN** a claim is in PRESCRIPCIÓN state
- **THEN** the system SHALL set `proximo_seguimiento` to 10 days from the current date
- **AND** the system SHALL prioritize closing the claim based on prescription dates

### Requirement: Allow manual override of calculated dates

The system SHALL allow technicians to manually adjust the automatically calculated `proximo_seguimiento` date while preserving the system's suggestion as default.

#### Scenario: Technician accepts calculated date

- **WHEN** a technician saves a tracking update
- **AND** does not modify the suggested date
- **THEN** the system SHALL use the calculated date for `proximo_seguimiento`

#### Scenario: Technician overrides calculated date

- **WHEN** a technician modifies the suggested date in EditTrackingTab
- **AND** the new date is not in the past
- **THEN** the system SHALL use the technician's selected date
- **AND** the system SHALL log the override in the claim timeline

### Requirement: Recalculate on state change

The system SHALL automatically recalculate `proximo_seguimiento` whenever the `estado_interno` field changes, regardless of whether a manual tracking update is performed.

#### Scenario: Automatic recalculation on state transition

- **WHEN** the `estado_interno` field is updated on a claim
- **THEN** the system SHALL immediately recalculate `proximo_seguimiento` based on the new state
- **AND** the system SHALL create a timeline entry noting the state change and new follow-up date
