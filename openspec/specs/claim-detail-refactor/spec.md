## ADDED Requirements

### Requirement: Remove financial module fields

The Claim Detail view SHALL NOT display financial reservation fields: Monto Pretensión, Deducible, Indemnización Bruta, and Neto a Pagar.

#### Scenario: Viewing claim details

- **WHEN** a user opens the claim detail page
- **THEN** no financial reservation fields SHALL be visible

### Requirement: Read-only bitácora display

The bitácora (timeline) SHALL display only read-only content from Softseguros novedades without any editable input fields or chat functionality.

#### Scenario: Viewing bitácora

- **WHEN** a user views the bitácora section
- **THEN** only historical novedades from Softseguros SHALL be displayed
- **AND** no text input, comment box, or chat interface SHALL be present

### Requirement: Finalizado status indicator

The claim detail header SHALL display a "Finalizado" indicator showing whether the claim is finished (Yes/No) and the completion date when applicable.

#### Scenario: Completed claim

- **WHEN** viewing a claim with estado_finalizado = true
- **THEN** the header SHALL display "Finalizado: Sí" with the fecha_finalizacion

#### Scenario: Active claim

- **WHEN** viewing a claim with estado_finalizado = false
- **THEN** the header SHALL display "Finalizado: No"
