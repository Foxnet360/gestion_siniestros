## ADDED Requirements

### Requirement: Search by numero_siniestro_compañia

The system SHALL allow users to filter claims by the field `numero_siniestro_compañia` (Número de Siniestro Compañía) and return matching results from the database.

#### Scenario: Filter by exact numero_siniestro_compañia

- **WHEN** user enters "01-56498-2" in the "Número de Siniestro Compañía" search field
- **THEN** the system SHALL display the claim(s) with numero_siniestro_compañia equal to "01-56498-2"

#### Scenario: Filter by partial numero_siniestro_compañia

- **WHEN** user enters "56498" in the "Número de Siniestro Compañía" search field
- **THEN** the system SHALL display all claims where numero_siniestro_compañia contains "56498"

#### Scenario: Case-insensitive search

- **WHEN** user enters "01-56498-2" (lowercase or mixed case) in the search field
- **THEN** the system SHALL match claims regardless of case sensitivity

#### Scenario: Handle values with hyphens and spaces

- **WHEN** user enters "01-56498-2" or "01 56498 2" in the search field
- **THEN** the system SHALL correctly match the claim in the database
