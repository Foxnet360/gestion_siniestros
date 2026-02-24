# Capability: Database Schema

## Purpose

This capability defines the persistence layer for claims management using Supabase and PostgreSQL. It ensures that all data regarding claims, their historical state transitions, and timeline events are stored reliably and are accessible in real-time.

## Requirements

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

### Requirement: Extended Claim Fields

The claims table must capture all fields from SoftSeguros Excel to provide complete data visibility.

#### Scenario: Additional SoftSeguros Fields

- **WHEN** the database is initialized or migrated
- **THEN** the `claims` table must include these additional columns:
  - `numero_siniestro_compania` (TEXT)
  - `tipo_siniestro` (TEXT)
  - `fecha_aviso` (TIMESTAMP)
  - `fecha_notificacion_aseguradora` (TIMESTAMP)
  - `proveedor_asignado` (TEXT)
  - `descripcion` (TEXT)
  - `documento_asegurado` (TEXT)
  - `email_principal` (TEXT)
  - `celular_principal` (TEXT)
  - `porcentaje_siniestralidad` (NUMERIC)
  - `finalizado` (BOOLEAN, default FALSE)
  - `fecha_finalizacion` (TIMESTAMP)
  - `coaseguros` (NUMERIC)

#### Scenario: Hybrid Management Fields

- **WHEN** the database is initialized or migrated
- **THEN** the `claims` table must include fields for SoftSeguros management tracking:
  - `gestion_softseguros` (TEXT)
  - `estado_gestion_softseguros` (TEXT)

#### Scenario: Calculated Prescription Fields

- **WHEN** the database is initialized or migrated
- **THEN** the `claims` table must include auto-calculated prescription dates:
  - `prescripcion_ordinaria` (DATE) - calculated as `fecha_siniestro + 2 years`
  - `prescripcion_extraordinaria` (DATE) - calculated as `fecha_siniestro + 5 years`

#### Scenario: Internal Management Fields

- **WHEN** the database is initialized or migrated
- **THEN** the `claims` table must include internal workflow fields:
  - `proximo_seguimiento` (TIMESTAMP)
  - `responsable` (TEXT)
  - `tecnico` (TEXT)
  - `fecha_ultimo_seguimiento` (TIMESTAMP)
  - `estado_ultima_gestion` (TEXT)
  - `estado_interno` (TEXT)
  - `prioridad` (TEXT or ENUM)

### Requirement: Amparos Table

The system must persist coverage (amparo) details for each claim in a separate related table.

#### Scenario: Amparos Table Structure

- **WHEN** the database is initialized
- **THEN** an `amparos` table must exist with:
  - `id` (UUID, primary key, auto-generated)
  - `claim_id` (TEXT, foreign key to `claims.id_softseguros`)
  - `numero_siniestro` (TEXT)
  - `nombre_reclamante` (TEXT)
  - `amparo` (TEXT) - coverage type
  - `valor` (NUMERIC) - coverage amount
  - `created_at` (TIMESTAMP, default NOW())

#### Scenario: Amparos Foreign Key Cascade

- **WHEN** a claim is deleted from the `claims` table
- **THEN** all related `amparos` records must be automatically deleted (ON DELETE CASCADE)

### Requirement: Performance Indexes

The database must have indexes to support efficient merge operations and queries.

#### Scenario: Merge Operation Indexes

- **WHEN** the database is initialized or migrated
- **THEN** the following indexes must exist:
  - `idx_claims_estado_softseguros` on `claims(estado_softseguros)`
  - `idx_claims_aseguradora` on `claims(aseguradora)`
  - `idx_claims_tecnico` on `claims(tecnico)`
  - `idx_state_history_claim_id` on `state_history(claim_id)`
  - `idx_timeline_claim_id` on `timeline(claim_id)`
  - `idx_amparos_claim_id` on `amparos(claim_id)`

### Requirement: Field Ownership Metadata

The schema must support classification of fields by ownership for merge logic.

#### Scenario: Field Classification Documentation

- **WHEN** developers need to understand field ownership
- **THEN** the schema documentation must clearly indicate:
  - **SoftSeguros-owned fields** (24 fields): Updated from Excel ingestion
  - **Internal-only fields** (9 fields): Never modified by ingestion
  - **Hybrid fields** (2 fields): Special merge logic from Gestión sheet

### Requirement: Data Relationships

- **WHEN** a claim is deleted (cascading optional) or updated
- **THEN** the related `state_history` and `timeline` entries must be retrievable via the `id_softseguros` identifier.
