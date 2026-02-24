## ADDED Requirements

### Requirement: Correct column name mapping for numero_siniestro_compania

The Excel parser SHALL correctly map the "NÚMERO DE SINIESTRO COMPAÑÍA" column from Softseguros Excel files.

#### Scenario: Excel ingestion with compañía number

- **GIVEN** an Excel file with column "NÚMERO DE SINIESTRO COMPAÑÍA"
- **WHEN** the system parses the file
- **THEN** the numero_siniestro_compania field SHALL be populated with the value from that column

### Requirement: Support multiple column name variants

The parser SHALL support multiple variants of column names to handle different Excel formats.

#### Scenario: Variant column names

- **GIVEN** column names may appear as "NÚMERO SINIESTRO COMPAÑÍA" or "NÚMERO DE SINIESTRO COMPAÑÍA"
- **WHEN** parsing either variant
- **THEN** the correct field SHALL be mapped

### Requirement: Debug logging for column mapping

The parser SHALL log debug information when columns are not found or are empty.

#### Scenario: Missing column

- **WHEN** a mapped column is not found in the Excel
- **THEN** a warning SHALL be logged with available columns
