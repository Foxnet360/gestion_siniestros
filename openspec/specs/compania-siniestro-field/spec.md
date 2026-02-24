## ADDED Requirements

### Requirement: Store compañía siniestro number

The system SHALL store the "Número de Siniestro Compañía" field from Softseguros (3rd column) in the claims table.

#### Scenario: Data ingestion

- **WHEN** ingesting claim data from Softseguros
- **THEN** the numero_siniestro_compania field SHALL be populated from the 3rd column

### Requirement: Search by compañía number

The global search endpoint SHALL support searching claims by numero_siniestro_compania using case-insensitive partial matching (ILIKE).

#### Scenario: Search with compañía number

- **WHEN** a user enters a compañía siniestro number in the search field
- **THEN** the system SHALL return claims where numero_siniestro_compania contains the search term (case-insensitive)

#### Scenario: Combined search

- **WHEN** searching across multiple fields including numero_siniestro_compania
- **THEN** the system SHALL return results matching any of the searchable fields
