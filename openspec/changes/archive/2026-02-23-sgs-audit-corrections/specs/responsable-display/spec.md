## ADDED Requirements

### Requirement: Separate author and responsible fields

The system SHALL distinguish between the "autor" (user who entered the novedad in Softseguros) and the "responsable" (actual stage owner/claim handler).

#### Scenario: Display separation

- **WHEN** displaying novedad information
- **THEN** the autor (data entry user) SHALL be shown separately from the responsable (stage owner)
- **AND** the responsable SHALL be prominently displayed as the primary contact

### Requirement: Responsible party identification

The responsable field SHALL be populated based on the actual owner of the current workflow stage, not the user who performed data entry.

#### Scenario: Stage ownership

- **WHEN** a claim is in a specific workflow stage
- **THEN** the responsable SHALL be the assigned handler for that stage
- **AND** SHALL NOT default to the autor of the most recent novedad

### Requirement: UI clarity

The claim detail view SHALL clearly label autor and responsable fields to prevent confusion between data entry user and stage owner.

#### Scenario: User identification

- **WHEN** viewing claim assignment information
- **THEN** labels SHALL clearly distinguish "Ingresado por" (autor) from "Responsable" (owner)
