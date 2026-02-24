## ADDED Requirements

### Requirement: 22-stage workflow synchronization

The system SHALL synchronize and display all 22 workflow stages from Softseguros, accurately reflecting the current stage based on the most recent chronological record.

#### Scenario: Stage determination

- **WHEN** determining the current stage of a claim
- **THEN** the system SHALL use the most recent novedad from Softseguros chronologically
- **AND** map it to the correct stage in the 22-stage workflow

### Requirement: 7-state workflow mapping

The system SHALL correctly map the 22 stages into 7 high-level states, ensuring claims appear in the correct state category.

#### Scenario: State categorization

- **WHEN** a claim is in stage 7 (Pagado)
- **THEN** it SHALL be categorized under the appropriate high-level state
- **AND** NOT incorrectly display as stage 1 (Radicación)

### Requirement: Chronological accuracy

The workflow state SHALL always reflect the most recent Softseguros record, preventing stale or incorrect stage displays.

#### Scenario: Recent update handling

- **WHEN** a new novedad is added in Softseguros
- **THEN** the next sync SHALL update the claim to the new stage
- **AND** the UI SHALL reflect this change immediately
