## ADDED Requirements

### Requirement: Export bitácora data

The system SHALL provide an export functionality that downloads the complete bitácora along with associated claim, person, and company data.

#### Scenario: User initiates export

- **WHEN** a user clicks the export button on the claim detail page
- **THEN** the system SHALL generate and download a file containing the bitácora and related data

### Requirement: Export file format

The exported file SHALL be in a standard format (CSV or Excel) containing all bitácora entries with timestamps, authors, and observations.

#### Scenario: Export content verification

- **WHEN** the exported file is opened
- **THEN** it SHALL contain all bitácora entries for the claim
- **AND** include claim identification data, person information, and company details
- **AND** maintain chronological order
