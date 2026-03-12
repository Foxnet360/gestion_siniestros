## MODIFIED Requirements

### Requirement: Save tracking updates with automatic date calculation

**MODIFIED FROM:** Manual entry of `proximo_seguimiento` with default of today + 7 days
**TO:** Automatic calculation of `proximo_seguimiento` based on workflow rules, with manual override option

The system SHALL automatically calculate the next follow-up date when saving tracking updates, using configurable business rules based on the claim's current state, while still allowing technicians to manually override the calculated date.

#### Scenario: Standard tracking update with auto-calculated date

- **WHEN** a technician saves a tracking update
- **AND** the claim's `estado_interno` is in Fases 1-5 (AVISO SINIESTRO through RATIFICACIÓN)
- **THEN** the system SHALL suggest `proximo_seguimiento` as current date + 10 days
- **AND** the technician SHALL be able to accept or modify this date
- **AND** the system SHALL use `FollowUpCalculationService` to determine the default value

#### Scenario: Legal process tracking update

- **WHEN** a technician saves a tracking update
- **AND** the claim's `estado_interno` is PROCESO JURÍDICO
- **THEN** the system SHALL suggest `proximo_seguimiento` as current date + 30 days
- **AND** the system SHALL allow the technician to extend this up to 60 days
- **AND** the system SHALL display a warning if the selected date exceeds 60 days

#### Scenario: State change triggers recalculation

- **WHEN** a technician changes the `estado_interno` field in EditTrackingTab
- **THEN** the system SHALL immediately recalculate the suggested `proximo_seguimiento` date
- **AND** the system SHALL update the date picker to show the new suggestion
- **AND** the system SHALL preserve any manual override the technician had already entered

#### Scenario: Override with prescription consideration

- **WHEN** a claim has an active prescription alert (warning or critical)
- **AND** a technician attempts to set `proximo_seguimiento` beyond the prescription date
- **THEN** the system SHALL display a warning about the prescription deadline
- **AND** the system SHALL suggest a date before the prescription deadline
- **AND** the technician SHALL be able to proceed with the override after acknowledging the warning

## ADDED Requirements (New capability for claim-tracking)

### Requirement: Display calculated vs actual dates

The system SHALL visually distinguish between automatically calculated dates and manually overridden dates in the tracking interface.

#### Scenario: Visual indication of calculated date

- **WHEN** the `proximo_seguimiento` date matches the system's calculated suggestion
- **AND** a technician views the EditTrackingTab
- **THEN** the system SHALL display a subtle indicator (e.g., "Calculado automáticamente" badge) next to the date

#### Scenario: Visual indication of overridden date

- **WHEN** the `proximo_seguimiento` date differs from the system's calculated suggestion
- **AND** a technician views the EditTrackingTab
- **THEN** the system SHALL display an indicator showing the original calculated date
- **AND** the system SHALL provide a "Restaurar fecha calculada" option
