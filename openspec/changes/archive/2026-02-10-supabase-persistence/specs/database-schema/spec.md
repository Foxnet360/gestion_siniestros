## ADDED Requirements

### Requirement: Database Tables
The system must persist claim data in a Supabase PostgreSQL database. The schema must mirror the current TypeScript interfaces (`Claim`, `StateHistoryEntry`, `TimelineEvent`).

#### Scenario: Claims Table Structure
- **WHEN** the database is initialized
- **THEN** a `claims` table must exist with columns for:
  - `id_softseguros` (Primary Key, string)
  - `poliza` (string)
  - `asegurado` (string)
  - `placa_bien` (string)
  - `monto_reclamo` (number)
  - `valor_deducible` (number)
  - `valor_indemnizacion` (number)
  - `prioridad` (enum/string)
  - `estado_softseguros` (string)
  - `estado_interno` (string)
  - `usuario_registro` (string)
  - `fecha_ocurrencia` (timestamp)
  - `ultimo_seguimiento_raw` (text)
  - `lastStateChangeDate` (timestamp)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

#### Scenario: State History Table Structure
- **WHEN** the database is initialized
- **THEN** a `state_history` table must exist with a foreign key to `claims` (`claim_id`), containing:
  - `state` (string)
  - `startDate` (timestamp)
  - `endDate` (timestamp)
  - `daysDuration` (number)
  - `author` (string)

#### Scenario: Timeline Table Structure
- **WHEN** the database is initialized
- **THEN** a `timeline` table must exist with a foreign key to `claims` (`claim_id`), containing:
  - `date` (timestamp)
  - `author` (string)
  - `text` (text)
  - `isSystem` (boolean)

### Requirement: Data Relationships
- **WHEN** a claim is deleted (cascading optional) or updated
- **THEN** the related `state_history` and `timeline` entries must be retrievable via the `id_softseguros` identifier.
