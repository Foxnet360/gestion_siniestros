## ADDED Requirements

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

## REMOVED Requirements

None - this is purely additive to the existing database schema.
